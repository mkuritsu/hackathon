import type { Trade } from "./api";

export type AdapterBuys = { instruments: string[]; notional: number; count: number };

// Aggregate a user's buy trades per market adapter so each agent card can show
// what its market actually bought and for how much (cost-basis notional).
export function buysByAdapter(trades: Trade[]): Record<string, AdapterBuys> {
	const out: Record<string, AdapterBuys> = {};
	for (const t of trades) {
		if (t.action !== "buy") continue;
		const entry = (out[t.adapter] ??= { instruments: [], notional: 0, count: 0 });
		entry.notional += Number(t.qty) * Number(t.price);
		entry.count += 1;
		if (!entry.instruments.includes(t.instrument)) {
			entry.instruments.push(t.instrument);
		}
	}
	return out;
}

export function formatUSD(n: number): string {
	return n.toLocaleString("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

// Read a positive dollar amount from a URLSearchParams "amount" value,
// falling back to a default when missing/invalid.
export function readAmount(raw: string | null, fallback = 10000): number {
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
