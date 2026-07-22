import { Hono } from "hono";
import type { ResearchParams } from "./workflows/research";

type AppEnv = { Bindings: Env };

export const researchApp = new Hono<AppEnv>();

// POST /api/research/run  { adapter?, topN?, cycleId? }
// Kicks off a ResearchWorkflow cycle. For live demos and the cron heartbeat.
researchApp.post("/run", async (c) => {
	const body = (await c.req.json().catch(() => ({}))) as Partial<ResearchParams>;
	const params: ResearchParams = {
		cycleId: body.cycleId ?? crypto.randomUUID(),
		adapter: body.adapter ?? "crypto",
		topN: body.topN ?? 5,
	};
	const instance = await c.env.RESEARCH_WORKFLOW.create({ params });
	return c.json({ id: instance.id, cycleId: params.cycleId, status: await instance.status() });
});

// GET /api/research/:id  -> workflow instance status (+ output when complete)
researchApp.get("/:id", async (c) => {
	const instance = await c.env.RESEARCH_WORKFLOW.get(c.req.param("id"));
	return c.json({ id: instance.id, status: await instance.status() });
});
