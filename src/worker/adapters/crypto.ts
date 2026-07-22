import type { Fill, Instrument, MarketAdapter, MarketContext, Order, Quote } from "./types";

// Free CoinGecko API. No key required.
const BASE = "https://api.coingecko.com/api/v3";
const HEADERS = { accept: "application/json", "user-agent": "hedge-fund-of-agents/0.1" };

const STABLECOINS = new Set([
	"usdt", "usdc", "dai", "busd", "tusd", "usdd", "fdusd", "usde", "pyusd", "gusd", "usds",
]);

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

async function cg<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	const url = new URL(`${BASE}${path}`);
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) {
		throw new Error(`CoinGecko ${res.status}: ${await res.text()}`);
	}
	return (await res.json()) as T;
}

function markets(params: Record<string, string>): Promise<CoinMarket[]> {
	return cg<CoinMarket[]>("/coins/markets", {
		vs_currency: "usd",
		price_change_percentage: "24h,7d",
		...params,
	});
}

function toContext(m: CoinMarket): MarketContext {
	const change24h = m.price_change_percentage_24h_in_currency ?? 0;
	const change7d = m.price_change_percentage_7d_in_currency ?? 0;
	return {
		kind: "crypto",
		instrument: m.id,
		name: m.name,
		symbol: m.symbol,
		price: m.current_price,
		unit: "usd",
		changePct: change24h,
		liquidity: m.total_volume,
		signals: { change7dPct: change7d, marketCap: m.market_cap },
		summary: `${m.name} is trading at $${m.current_price}, ${change24h.toFixed(1)}% over 24h and ${change7d.toFixed(1)}% over 7d.`,
	};
}

export const cryptoAdapter: MarketAdapter = {
	id: "crypto",
	kind: "crypto",

	// Meme-forward universe: blend meme-category + trending, filter stablecoins.
	async getUniverse(limit = 5): Promise<Instrument[]> {
		const meme = await markets({ category: "meme-token", order: "volume_desc", per_page: "20", page: "1" }).catch(
			() => [] as CoinMarket[],
		);
		let trending: CoinMarket[] = [];
		try {
			const t = await cg<{ coins: { item: { id: string } }[] }>("/search/trending");
			const ids = t.coins.map((c) => c.item.id).slice(0, 10).join(",");
			if (ids) {
				trending = await markets({ ids });
			}
		} catch {
			trending = [];
		}

		const seen = new Set<string>();
		const picked: Instrument[] = [];
		for (const m of [...meme, ...trending]) {
			if (seen.has(m.id) || STABLECOINS.has(m.symbol.toLowerCase())) {
				continue;
			}
			seen.add(m.id);
			picked.push({ id: m.id, symbol: m.symbol, name: m.name });
			if (picked.length >= limit) {
				break;
			}
		}
		return picked;
	},

	async getQuote(id: string): Promise<Quote> {
		const [m] = await markets({ ids: id });
		if (!m) {
			throw new Error(`Unknown crypto instrument: ${id}`);
		}
		return { instrument: id, price: m.current_price, unit: "usd", ts: new Date().toISOString() };
	},

	async getContext(id: string): Promise<MarketContext> {
		const [m] = await markets({ ids: id });
		if (!m) {
			throw new Error(`Unknown crypto instrument: ${id}`);
		}
		return toContext(m);
	},

	async simulateFill(order: Order): Promise<Fill> {
		const quote = await this.getQuote(order.instrument);
		return { instrument: order.instrument, price: quote.price, qty: order.qty, ts: new Date().toISOString() };
	},
};
