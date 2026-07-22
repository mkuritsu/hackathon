import type { Fill, Instrument, MarketAdapter, MarketContext, Order, Quote } from "./types";

// Free Polymarket Gamma API. No key. We model the YES side of each market as one
// instrument; the price is the implied probability of YES.
const BASE = "https://gamma-api.polymarket.com";
const HEADERS = { accept: "application/json", "user-agent": "hedge-fund-of-agents/0.1" };

interface GammaMarket {
	id: string;
	question: string;
	slug: string;
	outcomes?: string | string[];
	outcomePrices?: string | string[];
	volumeNum?: number;
	volume?: string | number;
	liquidityNum?: number;
	endDate?: string;
}

function parseList(v: string | string[] | undefined): string[] {
	if (!v) return [];
	if (Array.isArray(v)) return v;
	try {
		return JSON.parse(v) as string[];
	} catch {
		return [];
	}
}

function yesPrice(m: GammaMarket): number | undefined {
	const prices = parseList(m.outcomePrices).map(Number);
	return prices.length && Number.isFinite(prices[0]) ? prices[0] : undefined;
}

async function gamma<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	const url = new URL(`${BASE}${path}`);
	for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) {
		throw new Error(`Polymarket ${res.status}: ${await res.text()}`);
	}
	return (await res.json()) as T;
}

function toContext(m: GammaMarket): MarketContext {
	const price = yesPrice(m) ?? 0;
	const liquidity = m.volumeNum ?? (m.volume !== undefined ? Number(m.volume) : m.liquidityNum);
	return {
		kind: "prediction",
		instrument: `pm:${m.id}`,
		name: `${m.question} — YES`,
		symbol: "YES",
		price,
		unit: "probability",
		liquidity: Number.isFinite(liquidity as number) ? (liquidity as number) : undefined,
		eventAt: m.endDate,
		signals: { question: m.question },
		summary: `Polymarket: "${m.question}". Market implies ${(price * 100).toFixed(1)}% chance of YES.`,
	};
}

async function fetchMarket(numericId: string): Promise<GammaMarket> {
	const data = await gamma<GammaMarket | GammaMarket[]>(`/markets/${numericId}`);
	const m = Array.isArray(data) ? data[0] : data;
	if (!m) {
		throw new Error(`Polymarket: no market ${numericId}`);
	}
	return m;
}

export const predictionAdapter: MarketAdapter = {
	id: "prediction",
	kind: "prediction",

	async getUniverse(limit = 5): Promise<Instrument[]> {
		const markets = await gamma<GammaMarket[]>("/markets", {
			closed: "false",
			active: "true",
			order: "volumeNum",
			ascending: "false",
			limit: "40",
		});
		return markets
			.filter((m) => yesPrice(m) !== undefined)
			.slice(0, limit)
			.map((m) => ({ id: `pm:${m.id}`, symbol: "YES", name: m.question }));
	},

	async getQuote(id: string): Promise<Quote> {
		const m = await fetchMarket(id.replace(/^pm:/, ""));
		return { instrument: id, price: yesPrice(m) ?? 0, unit: "probability", ts: new Date().toISOString() };
	},

	async getContext(id: string): Promise<MarketContext> {
		return toContext(await fetchMarket(id.replace(/^pm:/, "")));
	},

	async simulateFill(order: Order): Promise<Fill> {
		const quote = await this.getQuote(order.instrument);
		return { instrument: order.instrument, price: quote.price, qty: order.qty, ts: new Date().toISOString() };
	},
};
