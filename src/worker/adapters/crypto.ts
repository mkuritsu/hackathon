import type { Fill, Instrument, MarketAdapter, MarketContext, Order, Quote } from "./types";

// Free CoinGecko API. No key required for the markets endpoint.
const BASE = "https://api.coingecko.com/api/v3";
const HEADERS = { accept: "application/json", "user-agent": "hedge-fund-of-agents/0.1" };

interface CoinMarket {
	id: string;
	symbol: string;
	name: string;
	current_price: number;
	total_volume: number;
	market_cap: number;
	price_change_percentage_24h_in_currency?: number;
	price_change_percentage_7d_in_currency?: number;
}

// Stablecoins dominate volume rankings but are dull to trade; skip them so the
// analyst sees real movers.
const STABLECOINS = new Set([
	"usdt",
	"usdc",
	"dai",
	"busd",
	"tusd",
	"usdd",
	"fdusd",
	"usde",
	"pyusd",
	"gusd",
	"usds",
]);

async function markets(params: Record<string, string>): Promise<CoinMarket[]> {
	const url = new URL(`${BASE}/coins/markets`);
	url.searchParams.set("vs_currency", "usd");
	url.searchParams.set("price_change_percentage", "24h,7d");
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) {
		throw new Error(`CoinGecko ${res.status}: ${await res.text()}`);
	}
	return (await res.json()) as CoinMarket[];
}

function toContext(m: CoinMarket): MarketContext {
	return {
		instrument: m.id,
		name: m.name,
		symbol: m.symbol,
		price: m.current_price,
		change24hPct: m.price_change_percentage_24h_in_currency ?? 0,
		change7dPct: m.price_change_percentage_7d_in_currency ?? 0,
		volume24h: m.total_volume,
		marketCap: m.market_cap,
	};
}

export const cryptoAdapter: MarketAdapter = {
	id: "crypto",

	// Top N by 24h trading volume, excluding stablecoins. Over-fetch to backfill
	// the ones we filter out.
	async getUniverse(limit = 5): Promise<Instrument[]> {
		const rows = await markets({
			order: "volume_desc",
			per_page: String(limit + 10),
			page: "1",
		});
		return rows
			.filter((m) => !STABLECOINS.has(m.symbol.toLowerCase()))
			.slice(0, limit)
			.map((m) => ({ id: m.id, symbol: m.symbol, name: m.name }));
	},

	async getQuote(id: string): Promise<Quote> {
		const [m] = await markets({ ids: id });
		if (!m) {
			throw new Error(`Unknown crypto instrument: ${id}`);
		}
		return { instrument: id, price: m.current_price, currency: "usd", ts: new Date().toISOString() };
	},

	async getContext(id: string): Promise<MarketContext> {
		const [m] = await markets({ ids: id });
		if (!m) {
			throw new Error(`Unknown crypto instrument: ${id}`);
		}
		return toContext(m);
	},

	// Simple mock fill at the current quote price (no slippage). Backend may
	// replace with a richer model.
	async simulateFill(order: Order): Promise<Fill> {
		const quote = await this.getQuote(order.instrument);
		return { instrument: order.instrument, price: quote.price, qty: order.qty, ts: new Date().toISOString() };
	},
};
