// Render the React report to a full HTML document, then hand it to Cloudflare
// Browser Rendering (headless Chrome) to produce a PDF.

import { renderToStaticMarkup } from "react-dom/server";
import { ensureAccount } from "../account";
import { ReportDocument, type ReportData } from "./ReportDocument";
import type { ReportLeaderboardRow, ReportTrade } from "./ReportDocument";

// A user's account context needed to title and key their report.
export interface ReportOwner {
	id: number;
	username: string;
}

export function renderReportHtml(data: ReportData): string {
	return "<!doctype html>" + renderToStaticMarkup(<ReportDocument data={data} />);
}

// The R2 key for a user's report on a given date (YYYY-MM-DD). One key per user
// per day so each account's reports are isolated and listable by prefix.
export function reportKey(userId: number, date: string): string {
	return `report-${userId}-${date}.pdf`;
}

// Generate the daily report PDF for one user's account from D1 state and store
// it in R2, keyed by user + date. Returns the PDF bytes and the R2 key. Shared
// by the HTTP route and the scheduled (cron) handler.
export async function generateAndStoreReport(
	env: Env,
	owner: ReportOwner,
): Promise<{ pdf: Uint8Array; key: string }> {
	const data = await gatherReportData(env.ACCOUNTS_DB, owner);
	const pdf = await renderReportPdf(env.BROWSER, data);
	const key = reportKey(owner.id, data.generatedAt.slice(0, 10));
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

// Assemble the report payload for one user's account from the D1 system of
// record. Everything degrades gracefully when the account has not traded yet
// (empty tables -> empty sections). NAV falls back to live account state when
// no snapshot exists (snapshots are future work).
export async function gatherReportData(db: D1Database, owner: ReportOwner): Promise<ReportData> {
	const mandateRow = await db
		.prepare("SELECT value FROM config WHERE key = 'mandate'")
		.first<{ value: string }>();

	const account = await ensureAccount(db, owner.id);
	const startingCash = account.starting_cash;

	const navRows = await db
		.prepare(
			"SELECT ts, cash, positions_value, nav FROM nav_snapshots WHERE user_id = ? ORDER BY ts DESC LIMIT 2",
		)
		.bind(owner.id)
		.all<{ ts: string; cash: number; positions_value: number; nav: number }>();
	const latest = navRows.results[0];
	const prior = navRows.results[1];

	const positionsRow = await db
		.prepare("SELECT COALESCE(SUM(qty * avg_price), 0) AS value FROM positions WHERE user_id = ?")
		.bind(owner.id)
		.first<{ value: number }>();
	const livePositionsValue = positionsRow?.value ?? 0;

	const cash = latest?.cash ?? account.cash;
	const positionsValue = latest?.positions_value ?? livePositionsValue;
	const nav = latest?.nav ?? cash + positionsValue;

	const trades = await db
		.prepare(
			`SELECT ts, adapter, instrument, action, qty, price, thesis, confidence
			 FROM trades WHERE user_id = ? ORDER BY ts DESC LIMIT 50`,
		)
		.bind(owner.id)
		.all<ReportTrade>();

	const leaderboard = await db
		.prepare(
			`SELECT adapter, realized_pnl, unrealized_pnl, trade_count FROM agent_pnl WHERE user_id = ?`,
		)
		.bind(owner.id)
		.all<ReportLeaderboardRow>();

	return {
		generatedAt: new Date().toISOString(),
		owner: owner.username,
		mandate: mandateRow?.value ?? "Make money. All trades simulated.",
		startingCash,
		nav,
		cash,
		positionsValue,
		priorNav: prior?.nav ?? null,
		trades: trades.results,
		leaderboard: leaderboard.results,
	};
}
