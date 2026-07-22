import { Hono } from "hono";
import { ensureAccount } from "./account";
import { currentUser } from "./auth";
import type { ResearchParams } from "./workflows/research";

type AppEnv = { Bindings: Env };

export const researchApp = new Hono<AppEnv>();

// POST /api/research/run  { markets?, topN?, cycleId? }
// Kicks off a ResearchWorkflow cycle across markets that trades into the
// logged-in user's own account.
researchApp.post("/run", async (c) => {
	const user = await currentUser(c);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const account = await ensureAccount(c.env.ACCOUNTS_DB, user.id);
	const body = (await c.req.json().catch(() => ({}))) as Partial<ResearchParams>;
	const params: ResearchParams = {
		cycleId: body.cycleId ?? crypto.randomUUID(),
		userId: user.id,
		markets: body.markets,
		topN: body.topN ?? 5,
		portfolio: { cash: account.cash, nav: account.cash },
	};
	const instance = await c.env.RESEARCH_WORKFLOW.create({ params });
	return c.json({ id: instance.id, cycleId: params.cycleId, status: await instance.status() });
});

// GET /api/research/:id  -> workflow instance status (+ output when complete)
researchApp.get("/:id", async (c) => {
	const instance = await c.env.RESEARCH_WORKFLOW.get(c.req.param("id"));
	return c.json({ id: instance.id, status: await instance.status() });
});
