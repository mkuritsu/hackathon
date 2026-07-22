import { Hono } from "hono";
import { cryptoAdapter } from "./adapters/crypto";
import type { MarketContext } from "./adapters/types";
import { runAnalyst } from "./ai/analyst";
import type { PortfolioContext } from "./contracts";

type AppEnv = { Bindings: Env };

const DEFAULT_PORTFOLIO: PortfolioContext = { cash: 100_000, nav: 100_000 };

// Offline fixture so the analyst can be exercised without any network/API.
const FIXTURE_CONTEXT: MarketContext = {
	instrument: "bitcoin",
	name: "Bitcoin",
	symbol: "btc",
	price: 67350.42,
	change24hPct: 4.12,
	change7dPct: -2.8,
	volume24h: 38_500_000_000,
	marketCap: 1_330_000_000_000,
};

export const analyzeApp = new Hono<AppEnv>();

// GET /api/analyze?instrument=bitcoin[&fixture=1]
// Runs a single analyst pass and returns the pitch (no trade). Debug/demo hook.
analyzeApp.get("/", async (c) => {
	const instrument = c.req.query("instrument") ?? "bitcoin";
	const useFixture = c.req.query("fixture") === "1";

	let ctx: MarketContext;
	if (useFixture) {
		ctx = { ...FIXTURE_CONTEXT, instrument };
	} else {
		try {
			ctx = await cryptoAdapter.getContext(instrument);
		} catch (err) {
			return c.json({ error: `Failed to fetch context: ${String(err)}` }, 502);
		}
	}

	const pitch = await runAnalyst(c.env.AI, cryptoAdapter.id, ctx, DEFAULT_PORTFOLIO);
	return c.json({ context: ctx, pitch });
});
