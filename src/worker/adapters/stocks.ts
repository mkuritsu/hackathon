import type { Fill, Instrument, MarketAdapter, MarketContext, Order, Quote } from "./types";

// Free, unofficial Yahoo Finance JSON. No key. v8 chart endpoint avoids the
// crumb/cookie auth that v7 quote now requires.
const HEADERS = {
	accept: "application/json",
	"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) hedge-fund-of-agents/0.1",
};

const WATCHLIST = ["AAPL", "NVDA", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "AMD"];

interface ChartMeta {
	symbol: string;
	shortName?: string;
	longName?: string;
	regularMarketPrice: number;
	chartPreviousClose?: number;
	previousClose?: number;
	regularMarketVolume?: number;
	fiftyTwoWeekHigh?: number;
	fiftyTwoWeekLow?: number;
}

interface ChartResult {
	meta: ChartMeta;
	timestamp?: number[];
	indicators?: { quote?: { close?: (number | null)[]; volume?: (number | null)[] }[] };
}

async function chart(symbol: string): Promise<ChartResult> {
	const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) {
		throw new Error(`Yahoo ${res.status} for ${symbol}: ${await res.text()}`);
	}
	const json = (await res.json()) as { chart?: { result?: ChartResult[]; error?: unknown } };
	const result = json.chart?.result?.[0];
	if (!result) {
		throw new Error(`Yahoo: no data for ${symbol}`);
	}
	return result;
}

function lastNonNull(arr?: (number | null)[]): number | undefined {
	if (!arr) return undefined;
	for (let i = arr.length - 1; i >= 0; i--) {
		if (typeof arr[i] === "number") return arr[i] as number;
	}
	return undefined;
}

function toContext(r: ChartResult): MarketContext {
	const m = r.meta;
	const prev = m.chartPreviousClose ?? m.previousClose ?? m.regularMarketPrice;
	const change24h = prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0;
	const closes = r.indicators?.quote?.[0]?.close;
	const weekAgo = closes && closes.length >= 6 ? closes[closes.length - 6] : undefined;
	const change7d = typeof weekAgo === "number" && weekAgo ? ((m.regularMarketPrice - weekAgo) / weekAgo) * 100 : 0;
	const volume = m.regularMarketVolume ?? lastNonNull(r.indicators?.quote?.[0]?.volume);
	const name = m.longName ?? m.shortName ?? m.symbol;

	const signals: Record<string, string | number> = { change7dPct: change7d };
	if (m.fiftyTwoWeekHigh) signals.fiftyTwoWeekHigh = m.fiftyTwoWeekHigh;
	if (m.fiftyTwoWeekLow) signals.fiftyTwoWeekLow = m.fiftyTwoWeekLow;

	return {
		kind: "stocks",
		instrument: m.symbol,
		name,
		symbol: m.symbol,
		price: m.regularMarketPrice,
		unit: "usd",
		changePct: change24h,
		liquidity: volume,
		signals,
		summary: `${name} (${m.symbol}) at $${m.regularMarketPrice}, ${change24h.toFixed(2)}% since prior close.`,
	};
}

export const stocksAdapter: MarketAdapter = {
	id: "stocks",
	kind: "stocks",

	async getUniverse(limit = 5): Promise<Instrument[]> {
		let symbols: string[] = [];
		try {
			const res = await fetch("https://query1.finance.yahoo.com/v1/finance/trending/US?count=15", {
				headers: HEADERS,
			});
			if (res.ok) {
				const json = (await res.json()) as { finance?: { result?: { quotes?: { symbol: string }[] }[] } };
				symbols = (json.finance?.result?.[0]?.quotes ?? []).map((q) => q.symbol).filter(Boolean);
			}
		} catch {
			symbols = [];
		}
		if (symbols.length === 0) {
			symbols = WATCHLIST;
		}
		return symbols.slice(0, limit).map((s) => ({ id: s, symbol: s, name: s }));
	},

	async getQuote(id: string): Promise<Quote> {
		const r = await chart(id);
		return { instrument: id, price: r.meta.regularMarketPrice, unit: "usd", ts: new Date().toISOString() };
	},

	async getContext(id: string): Promise<MarketContext> {
		return toContext(await chart(id));
	},

	async simulateFill(order: Order): Promise<Fill> {
		const quote = await this.getQuote(order.instrument);
		return { instrument: order.instrument, price: quote.price, qty: order.qty, ts: new Date().toISOString() };
	},
};
