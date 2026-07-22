import { Hono } from "hono";
import { getAllModels } from "./models";

type AppEnv = { Bindings: Env };

export const modelsApp = new Hono<AppEnv>();

// GET /api/models -> the centralized model registry (KV overrides merged over
// in-code defaults). Declare/override via the kv:seed:models script.
modelsApp.get("/", async (c) => {
	return c.json({ models: await getAllModels(c.env) });
});
