import { getAdapter } from "./adapters";
import type { PriceUnit } from "./adapters/types";
import type { Pitch } from "./contracts";

// Simple confidence-scaled sizing. The analyst gives action + confidence; the
// orchestrator turns that into a dollar notional here.
const PER_TRADE_MAX_USD = 15_000;
const MIN_NOTIONAL_USD = 100;

// Cost of one "unit" given the market's price unit. For odds-based markets a
// unit is one dollar staked.
function unitCost(price: number, unit: PriceUnit): number {
	if (unit === "usd" || unit === "probability") {
		return price;
	}
	return 1;
}

export interface ExecutedTrade {
	adapter: string;
	instrument: string;
	action: "buy" | "sell";
	qty: number;
	price: number;
	notional: number;
}

interface PositionRow {
	id: number;
	qty: number;
	avg_price: number;
}

async function getCash(db: D1Database): Promise<number> {
	const row = await db.prepare("SELECT value FROM config WHERE key = 'cash'").first<{ value: string }>();
	return row ? Number(row.value) : 0;
}

async function setCash(db: D1Database, cash: number): Promise<void> {
	await db
		.prepare("INSERT INTO config (key, value) VALUES ('cash', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
		.bind(String(cash))
		.run();
}

function getPosition(db: D1Database, adapter: string, instrument: string): Promise<PositionRow | null> {
	return db
		.prepare("SELECT id, qty, avg_price FROM positions WHERE adapter = ? AND instrument = ?")
		.bind(adapter, instrument)
		.first<PositionRow>();
}

// Execute the ranked final calls once: buys open/add positions (spending cash),
// sells close existing positions (no shorting in the POC). Records every fill in
// the trades table and updates cash.
export async function executeCalls(
	db: D1Database,
	finalCalls: Pitch[],
): Promise<{ trades: ExecutedTrade[]; cash: number }> {
	let cash = await getCash(db);
	const trades: ExecutedTrade[] = [];

	for (const call of finalCalls) {
		const adapter = getAdapter(call.adapter);
		if (!adapter) {
			continue;
		}
		let price: number;
		let unit: PriceUnit;
		try {
			const quote = await adapter.getQuote(call.instrument);
			price = quote.price;
			unit = quote.unit;
		} catch {
			continue;
		}
		const cost = unitCost(price, unit);
		if (!(cost > 0)) {
			continue;
		}

		if (call.action === "buy") {
			const notional = Math.min(Math.round(call.confidence * PER_TRADE_MAX_USD), cash);
			if (notional < MIN_NOTIONAL_USD) {
				continue;
			}
			const qty = notional / cost;
			const pos = await getPosition(db, call.adapter, call.instrument);
			if (pos) {
				const newQty = pos.qty + qty;
				const newAvg = (pos.qty * pos.avg_price + qty * cost) / newQty;
				await db.prepare("UPDATE positions SET qty = ?, avg_price = ? WHERE id = ?").bind(newQty, newAvg, pos.id).run();
			} else {
				await db
					.prepare("INSERT INTO positions (adapter, instrument, qty, avg_price) VALUES (?, ?, ?, ?)")
					.bind(call.adapter, call.instrument, qty, cost)
					.run();
			}
			await db
				.prepare(
					"INSERT INTO trades (adapter, instrument, action, qty, price, thesis, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)",
				)
				.bind(call.adapter, call.instrument, "buy", qty, cost, call.thesis, call.confidence)
				.run();
			cash -= notional;
			trades.push({ adapter: call.adapter, instrument: call.instrument, action: "buy", qty, price: cost, notional });
		} else if (call.action === "sell") {
			const pos = await getPosition(db, call.adapter, call.instrument);
			if (!pos || pos.qty <= 0) {
				continue; // no shorting in the POC
			}
			const proceeds = pos.qty * cost;
			await db.prepare("DELETE FROM positions WHERE id = ?").bind(pos.id).run();
			await db
				.prepare(
					"INSERT INTO trades (adapter, instrument, action, qty, price, thesis, confidence) VALUES (?, ?, ?, ?, ?, ?, ?)",
				)
				.bind(call.adapter, call.instrument, "sell", pos.qty, cost, call.thesis, call.confidence)
				.run();
			cash += proceeds;
			trades.push({
				adapter: call.adapter,
				instrument: call.instrument,
				action: "sell",
				qty: pos.qty,
				price: cost,
				notional: proceeds,
			});
		}
	}

	await setCash(db, cash);
	return { trades, cash };
}

// FUTURE WORK (not implemented): at end of month, liquidate all open positions
// at current prices, realize P&L, and generate the final report/email. Left as
// a stub deliberately.
export async function liquidateAndReport(): Promise<never> {
	throw new Error("Not implemented: end-of-month liquidation + final report is future work.");
}
