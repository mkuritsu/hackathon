// Render the React report to a full HTML document, then hand it to Cloudflare
// Browser Rendering (headless Chrome) to produce a PDF.

import { renderToStaticMarkup } from "react-dom/server";
import { ReportDocument, type ReportData } from "./ReportDocument";
import type { ReportLeaderboardRow, ReportTrade } from "./ReportDocument";

export function renderReportHtml(data: ReportData): string {
	return "<!doctype html>" + renderToStaticMarkup(<ReportDocument data={data} />);
}

// Generate the daily report PDF from D1 state and store it in R2, keyed by the
// generation date. Returns the PDF bytes and the R2 key. Shared by the HTTP
// route and the scheduled (cron) handler.
export async function generateAndStoreReport(
	env: Env,
): Promise<{ pdf: Uint8Array; key: string }> {
	const data = await gatherReportData(env.ACCOUNTS_DB);
	const pdf = await renderReportPdf(env.BROWSER, data);
	const key = `fund-report-${data.generatedAt.slice(0, 10)}.pdf`;
	await env.REPORTS.put(key, pdf, { httpMetadata: { contentType: "application/pdf" } });
	return { pdf, key };
}

export async function renderReportPdf(
	browser: BrowserRun,
	data: ReportData,
): Promise<Uint8Array> {
	const html = renderReportHtml(data);

	// Use the Browser Rendering PDF Quick Action: it manages the browser session
	// lifecycle for us (no manual launch/connect/close), which avoids the
	// concurrency/session errors that come from launching Puppeteer directly.
	// Retry a couple of times to ride out transient 500s from the service.
	let lastError: unknown;
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			// Bound each attempt so a stuck Browser Rendering call can't hang the
			// whole request forever.
			const response = await withTimeout(
				browser.quickAction("pdf", {
					html,
					pdfOptions: {
						format: "a4",
						printBackground: true,
						margin: { top: "0", bottom: "0", left: "0", right: "0" },
					},
					gotoOptions: { waitUntil: "networkidle0", timeout: 20_000 },
				}),
				25_000,
			);
			if (!response.ok) {
				const detail = (await response.text()).slice(0, 300);
				throw new Error(`Browser Rendering PDF failed: HTTP ${response.status} ${detail}`);
			}
			return new Uint8Array(await response.arrayBuffer());
		} catch (error) {
			lastError = error;
			console.log(`PDF render attempt ${attempt} failed: ${error}`);
			if (attempt < 3) {
				await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
			}
		}
	}
	throw lastError instanceof Error ? lastError : new Error("Browser Rendering PDF failed");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
		),
	]);
}

// Assemble the report payload from the D1 system of record. Everything degrades
// gracefully when the fund has not traded yet (empty tables -> empty sections).
export async function gatherReportData(db: D1Database): Promise<ReportData> {
	const configRows = await db.prepare("SELECT key, value FROM config").all<{
		key: string;
		value: string;
	}>();
	const config = new Map(configRows.results.map((r) => [r.key, r.value]));
	const startingCash = Number(config.get("starting_cash") ?? "0");
	const configCash = Number(config.get("cash") ?? String(startingCash));

	const navRows = await db
		.prepare("SELECT ts, cash, positions_value, nav FROM nav_snapshots ORDER BY ts DESC LIMIT 2")
		.all<{ ts: string; cash: number; positions_value: number; nav: number }>();
	const latest = navRows.results[0];
	const prior = navRows.results[1];

	const nav = latest?.nav ?? startingCash;
	const cash = latest?.cash ?? configCash;
	const positionsValue = latest?.positions_value ?? 0;

	const trades = await db
		.prepare(
			`SELECT ts, adapter, instrument, action, qty, price, thesis, confidence
			 FROM trades ORDER BY ts DESC LIMIT 50`,
		)
		.all<ReportTrade>();

	const leaderboard = await db
		.prepare(
			`SELECT adapter, realized_pnl, unrealized_pnl, trade_count FROM agent_pnl`,
		)
		.all<ReportLeaderboardRow>();

	return {
		generatedAt: new Date().toISOString(),
		mandate: config.get("mandate") ?? "Make money. All trades simulated.",
		startingCash,
		nav,
		cash,
		positionsValue,
		priorNav: prior?.nav ?? null,
		trades: trades.results,
		leaderboard: leaderboard.results,
	};
}
