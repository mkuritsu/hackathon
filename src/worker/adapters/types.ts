// The universal market adapter. Add a market = add an adapter; the analyst,
// ledger, and reporting never change. One analyst implementation reads this one
// context shape for every market; each adapter fills what's relevant to it.

export type MarketKind = "crypto" | "stocks" | "prediction" | "sports";

// How to read `price`: a dollar amount, an implied probability (0..1), or odds.
export type PriceUnit = "usd" | "probability" | "odds_decimal" | "odds_american";

export interface Instrument {
	id: string; // adapter-native id, e.g. "bitcoin", "AAPL", "polymarket:<slug>:YES"
	symbol: string;
	name: string;
}

export interface Quote {
	instrument: string;
	price: number;
	unit: PriceUnit;
	ts: string;
}

// The bundle of info handed to the analyst about one instrument. Universal core
// + a flexible `signals` bag + an adapter-authored `summary` so a single analyst
// spans crypto, stocks, prediction markets, and sports.
export interface MarketContext {
	kind: MarketKind;
	instrument: string;
	name: string;
	symbol?: string;
	price: number;
	unit: PriceUnit;
	changePct?: number; // recent move (~24h)
	liquidity?: number; // volume / open interest / handle
	eventAt?: string; // resolves-at (prediction) or start time (sports)
	signals?: Record<string, string | number>; // asset-specific extras
	summary?: string; // short natural-language digest
	headlines?: string[];
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
	kind: MarketKind;
	getUniverse(limit?: number): Promise<Instrument[]>;
	getQuote(id: string): Promise<Quote>;
	getContext(id: string): Promise<MarketContext>;
	simulateFill(order: Order): Promise<Fill>;
}
