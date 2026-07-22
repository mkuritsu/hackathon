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

app.all("/api/*", (c) => c.json({ error: "Not found" }, 404));

app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
