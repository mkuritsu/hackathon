import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { cryptoAdapter } from "../adapters/crypto";
import type { Instrument, MarketAdapter } from "../adapters/types";
import { runAnalyst } from "../ai/analyst";
import { MemoryPitchStore, type Pitch, type PitchStore, type PortfolioContext } from "../contracts";
import { D1PitchStore } from "../store";

const ADAPTERS: Record<string, MarketAdapter> = {
	crypto: cryptoAdapter,
};

const DEFAULT_PORTFOLIO: PortfolioContext = { cash: 100_000, nav: 100_000 };

export interface ResearchParams {
	cycleId: string;
	adapter: string; // e.g. "crypto"
	topN?: number;
	instruments?: Instrument[]; // optional pre-selected shortlist (from the DO)
	portfolio?: PortfolioContext;
}

// The durable research pipeline: select a universe, analyze each instrument in
// parallel (one ret/riable step each), then persist all pitches for the DO.
export class ResearchWorkflow extends WorkflowEntrypoint<Env, ResearchParams> {
	async run(event: WorkflowEvent<ResearchParams>, step: WorkflowStep) {
		const { cycleId } = event.payload;
		const topN = event.payload.topN ?? 5;
		const portfolio = event.payload.portfolio ?? DEFAULT_PORTFOLIO;
		const adapter = ADAPTERS[event.payload.adapter];
		if (!adapter) {
			throw new Error(`Unknown adapter: ${event.payload.adapter}`);
		}

		const universe =
			event.payload.instruments ??
			(await step.do("select-universe", () => adapter.getUniverse(topN)));

		const pitches = await Promise.all(
			universe.map((inst) =>
				step.do(
					`analyze:${inst.id}`,
					{ retries: { limit: 3, delay: "5 seconds", backoff: "exponential" } },
					async (): Promise<Pitch> => {
						const ctx = await adapter.getContext(inst.id);
						return runAnalyst(this.env.AI, adapter.id, ctx, portfolio);
					},
				),
			),
		);

		await step.do("persist", async () => {
			const store: PitchStore = this.env.ACCOUNTS_DB
				? new D1PitchStore(this.env.ACCOUNTS_DB)
				: new MemoryPitchStore();
			await store.save(cycleId, pitches);
		});

		return { cycleId, adapter: adapter.id, count: pitches.length, pitches };
	}
}
