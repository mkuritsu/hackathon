import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { ADAPTERS, ALL_MARKETS } from "../adapters";
import type { MarketKind } from "../adapters/types";
import { runAnalyst } from "../ai/analyst";
import { MemoryPitchStore, type Pitch, type PitchStore, type PortfolioContext } from "../contracts";
import { executeCalls, type ExecutedTrade } from "../ledger";
import { getModelId } from "../models";
import { D1PitchStore } from "../store";

const DEFAULT_PORTFOLIO: PortfolioContext = { cash: 100_000, nav: 100_000 };

export interface ResearchParams {
	cycleId: string;
	markets?: MarketKind[]; // default: all
	topN?: number; // per market
	portfolio?: PortfolioContext;
}

// Orchestrator: run one market-scoped analyst per market in parallel, collect
// every pitch, then rank the non-hold pitches by confidence as the final calls.
export class ResearchWorkflow extends WorkflowEntrypoint<Env, ResearchParams> {
	async run(event: WorkflowEvent<ResearchParams>, step: WorkflowStep) {
		const { cycleId } = event.payload;
		const topN = event.payload.topN ?? 5;
		const portfolio = event.payload.portfolio ?? DEFAULT_PORTFOLIO;
		const markets = event.payload.markets ?? ALL_MARKETS;
		const modelId = await getModelId(this.env, "analyst");

		const perMarket = await Promise.all(
			markets.map(async (kind) => {
				const adapter = ADAPTERS[kind];
				// A missing universe (rate limit, off-season, etc.) must not kill the cycle.
				const universe = await step.do(`universe:${kind}`, () =>
					adapter.getUniverse(topN).catch(() => []),
				);
				return Promise.all(
					universe.map((inst) =>
						step.do(
							`analyze:${kind}:${inst.id}`,
							{ retries: { limit: 2, delay: "5 seconds", backoff: "exponential" } },
							async (): Promise<Pitch> => {
								const ctx = await adapter.getContext(inst.id);
								return runAnalyst(this.env.AI, modelId, adapter.id, ctx, portfolio);
							},
						),
					),
				);
			}),
		);

		const pitches = perMarket.flat();
		const finalCalls = pitches
			.filter((p) => p.action !== "hold")
			.sort((a, b) => b.confidence - a.confidence);

		await step.do("persist", async () => {
			const store: PitchStore = this.env.ACCOUNTS_DB
				? new D1PitchStore(this.env.ACCOUNTS_DB)
				: new MemoryPitchStore();
			await store.save(cycleId, pitches);
		});

		// Execute the final calls once, now (buy/sell), then hold. End-of-month
		// liquidation + report is future work (see ledger.liquidateAndReport).
		let executed: { trades: ExecutedTrade[]; cash: number } = { trades: [], cash: 0 };
		if (this.env.ACCOUNTS_DB) {
			executed = await step.do("execute", () => executeCalls(this.env.ACCOUNTS_DB, finalCalls));
		}

		return { cycleId, markets, count: pitches.length, finalCalls, executed, pitches };
	}
}
