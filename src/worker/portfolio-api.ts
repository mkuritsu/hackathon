import { Hono } from "hono";

type AppEnv = { Bindings: Env };

export const portfolioApp = new Hono<AppEnv>();

// GET /api/portfolio -> everything the frontend needs to render the desk:
// cash, positions the fund decided on, cost-basis NAV, and recent trades.
portfolioApp.get("/", async (c) => {
	const db = c.env.ACCOUNTS_DB;
	const cashRow = await db.prepare("SELECT value FROM config WHERE key = 'cash'").first<{ value: string }>();
	const cash = cashRow ? Number(cashRow.value) : 0;

	const positions =
		(await db
			.prepare("SELECT adapter, instrument, qty, avg_price, opened_at FROM positions ORDER BY id DESC")
			.all()).results ?? [];

	const positionsValue = positions.reduce(
		(sum, p) => sum + Number(p.qty) * Number(p.avg_price),
		0,
	);

	const trades =
		(await db
			.prepare(
				"SELECT ts, adapter, instrument, action, qty, price, thesis, confidence FROM trades ORDER BY id DESC LIMIT 50",
			)
			.all()).results ?? [];

	return c.json({
		cash,
		positionsValue, // cost basis; mark-to-market is future work
		nav: cash + positionsValue,
		positions,
		trades,
	});
});

// GET /api/portfolio/pitches -> the latest reasoning (what it decided on).
portfolioApp.get("/pitches", async (c) => {
	const pitches =
		(await c.env.ACCOUNTS_DB
			.prepare(
				"SELECT cycle_id, ts, adapter, instrument, action, confidence, thesis FROM pitches ORDER BY id DESC LIMIT 100",
			)
			.all()).results ?? [];
	return c.json({ pitches });
});
