// Render the React report to a full HTML document, then hand it to Cloudflare
// Browser Rendering (headless Chrome) to produce a PDF.

import puppeteer from "@cloudflare/puppeteer";
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
	const instance = await acquireBrowser(browser);
	try {
		const page = await instance.newPage();
		try {
			await page.setContent(renderReportHtml(data), { waitUntil: "networkidle0" });
			return await page.pdf({
				format: "A4",
				printBackground: true,
				margin: { top: "0", bottom: "0", left: "0", right: "0" },
			});
		} finally {
			await page.close();
		}
	} finally {
		// Keep the browser alive (disconnect, don't close) so the next report can
		// reuse this session instead of launching a new instance.
		instance.disconnect();
	}
}

// Browser Rendering caps concurrent browser instances and the rate of new
// instances. Reuse an idle session when one exists; only launch a fresh browser
// as a fallback. This avoids "Unable to create new browser" errors and recovers
// sessions leaked by earlier aborted requests.
async function acquireBrowser(browser: BrowserRun) {
	const sessionId = await pickFreeSession(browser);
	if (sessionId) {
		try {
			return await puppeteer.connect(browser, sessionId);
		} catch (error) {
			console.log(`Failed to reuse browser session ${sessionId}: ${error}`);
		}
	}
	try {
		return await puppeteer.launch(browser);
	} catch (error) {
		// Under the concurrency/rate limit: retry once by reusing any free session
		// that may have appeared (or been freed) in the meantime.
		console.log(`Browser launch failed, retrying via reuse: ${error}`);
		const retryId = await pickFreeSession(browser);
		if (retryId) {
			return await puppeteer.connect(browser, retryId);
		}
		throw error;
	}
}

async function pickFreeSession(browser: BrowserRun): Promise<string | undefined> {
	try {
		const sessions = await puppeteer.sessions(browser);
		const free = sessions.filter((s) => !s.connectionId).map((s) => s.sessionId);
		return free.length > 0 ? free[0] : undefined;
	} catch (error) {
		console.log(`Failed to list browser sessions: ${error}`);
		return undefined;
	}
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
