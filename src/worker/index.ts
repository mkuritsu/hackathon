import { Hono } from "hono";
import { authApp, sessionCookieMiddleware } from "./auth";
import { gatherReportData, renderReportHtml, renderReportPdf } from "./report/pdf";

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

// Daily desk report as a Browser Rendering PDF. GET (or POST for the live-demo
// trigger) gathers the fund state from D1, renders the React report, and returns
// the generated PDF.
app.on(["GET", "POST"], "/api/report/pdf", async (c) => {
	const data = await gatherReportData(c.env.ACCOUNTS_DB);
	const pdf = await renderReportPdf(c.env.BROWSER, data);
	const filename = `fund-report-${data.generatedAt.slice(0, 10)}.pdf`;
	await c.env.REPORTS.put(filename, pdf, {
		httpMetadata: { contentType: "application/pdf" },
	});
	return new Response(pdf, {
		status: 200,
		headers: {
			"Content-Type": "application/pdf",
			"Content-Disposition": `inline; filename="${filename}"`,
		},
	});
});

// HTML preview of the same report (no browser time used) for styling/iteration.
app.get("/api/report/preview", async (c) => {
	const data = await gatherReportData(c.env.ACCOUNTS_DB);
	return c.html(renderReportHtml(data));
});

// List the report PDFs stored in R2 (newest first).
app.get("/api/reports", async (c) => {
	const listing = await c.env.REPORTS.list();
	const reports = listing.objects
		.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded }))
		.sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());
	return c.json({ reports });
});

// Download a single report PDF from R2.
app.get("/api/reports/:key{.+\\.pdf}", async (c) => {
	const key = c.req.param("key");
	if (key.includes("/") || key.includes("..")) {
		return c.json({ error: "Invalid report key" }, 400);
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

export default app;
