import { cryptoAdapter } from "./crypto";
import { predictionAdapter } from "./prediction";
import { sportsAdapter } from "./sports";
import { stocksAdapter } from "./stocks";
import type { MarketAdapter, MarketKind } from "./types";

export const ADAPTERS: Record<MarketKind, MarketAdapter> = {
	crypto: cryptoAdapter,
	stocks: stocksAdapter,
	prediction: predictionAdapter,
	sports: sportsAdapter,
};

export const ALL_MARKETS: MarketKind[] = ["crypto", "stocks", "prediction", "sports"];

export function getAdapter(kind: string): MarketAdapter | undefined {
	return ADAPTERS[kind as MarketKind];
}
