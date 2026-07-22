// The universal market adapter. Add a market = add an adapter; the analyst,
// ledger, and reporting never change. Backend owns simulateFill semantics;
// the AI slice owns getUniverse/getQuote/getContext data-gathering.

export interface Instrument {
	id: string; // adapter-native id, e.g. "bitcoin"
	symbol: string; // e.g. "btc"
	name: string; // e.g. "Bitcoin"
}

export interface Quote {
	instrument: string;
	price: number;
	currency: string;
	ts: string;
}

// The bundle of info handed to the analyst about one instrument.
export interface MarketContext {
	instrument: string;
	name: string;
	symbol: string;
	price: number;
	change24hPct: number;
	change7dPct: number;
	volume24h: number;
	marketCap: number;
	headlines?: string[];
	extra?: Record<string, unknown>;
}

export interface Order {
	adapter: string;
	instrument: string;
	action: "buy" | "sell";
	qty: number;
}

export interface Fill {
	instrument: string;
	price: number;
	qty: number;
	ts: string;
}

export interface MarketAdapter {
	id: string;
	getUniverse(limit?: number): Promise<Instrument[]>;
	getQuote(id: string): Promise<Quote>;
	getContext(id: string): Promise<MarketContext>;
	simulateFill(order: Order): Promise<Fill>;
}
