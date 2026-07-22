import { Hono } from "hono";
import { analyzeApp } from "./analyze";
import { authApp, sessionCookieMiddleware } from "./auth";
import { researchApp } from "./research-api";

const app = new Hono<{ Bindings: Env }>();

app.use("*", sessionCookieMiddleware);

app.get("/api/health", (c) =>
	c.json({
		status: "ok",
		message: "Worker API is online",
		timestamp: new Date().toISOString(),
	}),
);

app.route("/api/auth", authApp);
app.route("/api/analyze", analyzeApp);
app.route("/api/research", researchApp);

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;

export { ResearchWorkflow } from "./workflows/research";
