import { Hono } from "hono";
import { ensureAccount } from "./account";
import { currentUser } from "./auth";

type AppEnv = { Bindings: Env };

export const portfolioApp = new Hono<AppEnv>();

// GET /api/portfolio -> everything the frontend needs to render the logged-in
// user's desk: their cash, positions, cost-basis NAV, and recent trades.
portfolioApp.get("/", async (c) => {
	const user = await currentUser(c);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const db = c.env.ACCOUNTS_DB;
	const account = await ensureAccount(db, user.id);

	const positions =
		(await db
			.prepare(
				"SELECT adapter, instrument, qty, avg_price, opened_at FROM positions WHERE user_id = ? ORDER BY id DESC",
			)
			.bind(user.id)
			.all()).results ?? [];

	const positionsValue = positions.reduce(
		(sum, p) => sum + Number(p.qty) * Number(p.avg_price),
		0,
	);

	const trades =
		(await db
			.prepare(
				"SELECT ts, adapter, instrument, action, qty, price, thesis, confidence FROM trades WHERE user_id = ? ORDER BY id DESC LIMIT 50",
			)
			.bind(user.id)
			.all()).results ?? [];

	return c.json({
		cash: account.cash,
		startingCash: account.starting_cash,
		positionsValue, // cost basis; mark-to-market is future work
		nav: account.cash + positionsValue,
		positions,
		trades,
	});
});

// GET /api/portfolio/pitches -> the latest reasoning (shared across the desk;
// pitches are not per-user, they are the analyst's market views).
portfolioApp.get("/pitches", async (c) => {
	const pitches =
		(await c.env.ACCOUNTS_DB
			.prepare(
				"SELECT cycle_id, ts, adapter, instrument, action, confidence, thesis FROM pitches ORDER BY id DESC LIMIT 100",
			)
			.all()).results ?? [];
	return c.json({ pitches });
});
