import { Hono } from "hono";
import { analyzeApp } from "./analyze";
import { authApp, currentUser, sessionCookieMiddleware } from "./auth";
import { modelsApp } from "./models-api";
import { portfolioApp } from "./portfolio-api";
import { researchApp } from "./research-api";
import { gatherReportData, generateAndStoreReport, renderReportHtml } from "./report/pdf";
import { sampleReportData } from "./report/ReportDocument";
import { runDailyReport } from "./report/run";

const app = new Hono<{ Bindings: Env }>();

app.use("*", sessionCookieMiddleware);

app.get("/api/health", (c) =>
	c.json({
		status: "ok",
		message: "Worker API is online",
		environment: c.env.ENVIRONMENT,
		timestamp: new Date().toISOString(),
	}),
);

app.route("/api/auth", authApp);
app.route("/api/analyze", analyzeApp);
app.route("/api/research", researchApp);
app.route("/api/models", modelsApp);
app.route("/api/portfolio", portfolioApp);

// Dev-only routes: the Dev page and its testing endpoints exist only in the dev
// environment. In production they return 404.
const dev = new Hono<{ Bindings: Env }>();
dev.use("*", async (c, next) => {
	if (c.env.ENVIRONMENT !== "dev") {
		return c.json({ error: "Not found" }, 404);
	}
	await next();
});

// Run the full daily job on demand (same code path as the cron): generate +
// store in R2 + email to all users. Used by the dev page trigger button.
dev.post("/report/run", async (c) => {
	const result = await runDailyReport(c.env);
	return c.json({ ok: true, ...result });
});

app.route("/api/dev", dev);

// The logged-in user's own account report as a Browser Rendering PDF. GET (or
// POST for the live-demo trigger) gathers their account state from D1, renders
// the React report, stores it in R2, and returns the PDF.
app.on(["GET", "POST"], "/api/report/pdf", async (c) => {
	const user = await currentUser(c);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const { pdf, key } = await generateAndStoreReport(c.env, { id: user.id, username: user.username });
	return new Response(pdf, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="${key}"`,
		},
	});
});

// HTML preview of the caller's own report (no browser time used) for
// styling/iteration.
app.get("/api/report/preview", async (c) => {
	const user = await currentUser(c);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const data = c.req.query("sample")
		? sampleReportData(user.username)
		: await gatherReportData(c.env.ACCOUNTS_DB, { id: user.id, username: user.username });
	return c.html(renderReportHtml(data));
});

// List only the caller's own report PDFs stored in R2 (newest first).
app.get("/api/reports", async (c) => {
	const user = await currentUser(c);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const listing = await c.env.REPORTS.list({ prefix: `report-${user.id}-` });
	const reports = listing.objects
		.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded }))
		.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
	return c.json({ reports });
});

// Download a single report PDF from R2. A user may only download their own
// reports (keys are prefixed with their user id).
app.get("/api/reports/:key{.+\\.pdf}", async (c) => {
	const user = await currentUser(c);
	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	const key = c.req.param("key");
	if (key.includes("/") || key.includes("..")) {
		return c.json({ error: "Invalid report key" }, 400);
	}
	if (!key.startsWith(`report-${user.id}-`)) {
		return c.json({ error: "Report not found" }, 404);
	}
	const object = await c.env.REPORTS.get(key);
	if (!object) {
		return c.json({ error: "Report not found" }, 404);
	}
	return new Response(object.body, {
		status: 200,
		headers: {
			"Content-Type": object.httpMetadata?.contentType ?? "application/pdf",
			"Content-Disposition": `attachment; filename="${key}"`,
			"Content-Length": String(object.size),
		},
	});
});

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
	fetch: app.fetch,
	// Daily cron: generate the report, store it in R2, then email the PDF to
	// every registered user.
	async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(runDailyReport(env));
	},
} satisfies ExportedHandler<Env>;

export { ResearchWorkflow } from "./workflows/research";
