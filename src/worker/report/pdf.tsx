// Render the React report to a full HTML document, then hand it to Cloudflare
// Browser Rendering (headless Chrome) to produce a PDF.

import puppeteer from "@cloudflare/puppeteer";
import { renderToStaticMarkup } from "react-dom/server";
import { ReportDocument, type ReportData } from "./ReportDocument";
import type { ReportLeaderboardRow, ReportTrade } from "./ReportDocument";

export function renderReportHtml(data: ReportData): string {
	return "<!doctype html>" + renderToStaticMarkup(<ReportDocument data={data} />);
}

export async function renderReportPdf(
	browser: BrowserRun,
	data: ReportData,
): Promise<Uint8Array> {
	const instance = await puppeteer.launch(browser);
	try {
		const page = await instance.newPage();
		await page.setContent(renderReportHtml(data), { waitUntil: "networkidle0" });
		return await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: "0", bottom: "0", left: "0", right: "0" },
		});
	} finally {
		await instance.close();
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
