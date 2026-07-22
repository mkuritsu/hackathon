import { Hono } from "hono";
import { getAdapter } from "./adapters";
import type { MarketContext } from "./adapters/types";
import { runAnalyst } from "./ai/analyst";
import type { PortfolioContext } from "./contracts";
import { getModelId } from "./models";

type AppEnv = { Bindings: Env };

const DEFAULT_PORTFOLIO: PortfolioContext = { cash: 100_000, nav: 100_000 };

// Offline fixture so the analyst can be exercised without any network/API.
const FIXTURE_CONTEXT: MarketContext = {
	kind: "crypto",
	instrument: "bitcoin",
	name: "Bitcoin",
	symbol: "btc",
	price: 67350.42,
	unit: "usd",
	changePct: 4.12,
	liquidity: 38_500_000_000,
	signals: { change7dPct: -2.8, marketCap: 1_330_000_000_000 },
	summary: "Bitcoin at $67,350, up 4.12% over 24h.",
};

export const analyzeApp = new Hono<AppEnv>();

// GET /api/analyze?adapter=crypto&instrument=bitcoin[&fixture=1]
// Runs a single market-scoped analyst pass and returns the pitch (no trade).
analyzeApp.get("/", async (c) => {
	const adapterId = c.req.query("adapter") ?? "crypto";
	const useFixture = c.req.query("fixture") === "1";

	if (useFixture) {
		const ctx = FIXTURE_CONTEXT;
		const modelId = await getModelId(c.env, "analyst");
		const pitch = await runAnalyst(c.env.AI, modelId, "crypto", ctx, DEFAULT_PORTFOLIO);
		return c.json({ model: modelId, context: ctx, pitch });
	}

	const adapter = getAdapter(adapterId);
	if (!adapter) {
		return c.json({ error: `Unknown adapter: ${adapterId}` }, 400);
	}

	let instrument = c.req.query("instrument");
	try {
		if (!instrument) {
			const universe = await adapter.getUniverse(1);
			if (universe.length === 0) {
				return c.json({ error: `No instruments available for ${adapterId}` }, 502);
			}
			instrument = universe[0].id;
		}
		const ctx = await adapter.getContext(instrument);
		const modelId = await getModelId(c.env, "analyst");
		const pitch = await runAnalyst(c.env.AI, modelId, adapter.id, ctx, DEFAULT_PORTFOLIO);
		return c.json({ model: modelId, context: ctx, pitch });
	} catch (err) {
		return c.json({ error: `Failed to analyze: ${String(err)}` }, 502);
	}
});
