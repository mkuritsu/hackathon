import type { MarketContext } from "../adapters/types";
import type { PortfolioContext } from "../contracts";

export const ANALYST_SYSTEM_PROMPT = `You are the lead analyst for an autonomous, fully-simulated hedge fund.
Given live market data for ONE instrument and the fund's current portfolio, decide whether to buy, sell, or hold, and how strongly you believe it.

Rules:
- Reason ONLY from the data provided. Never invent prices, news, or facts.
- Be decisive but honest. Set confidence to reflect genuine conviction: 0 means no edge, 1 means an extremely strong edge. Most calls should sit between 0.2 and 0.7.
- Account for the current position: prefer "sell" to take profit or cut losses, "hold" when there is no clear edge, "buy" when momentum or value justifies opening or adding.
- Trades are simulated, so there is no real risk, but act like a disciplined trader, not a gambler.
- thesis: one or two crisp sentences citing the specific numbers that drove the call. No hedging filler, no disclaimers.`;

function fmt(n: number): string {
	if (!Number.isFinite(n)) {
		return "n/a";
	}
	return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function pct(n: number): string {
	return Number.isFinite(n) ? `${n.toFixed(2)}%` : "n/a";
}

export function buildAnalystUserPrompt(ctx: MarketContext, portfolio: PortfolioContext): string {
	const news = ctx.headlines?.length
		? `Recent headlines:\n- ${ctx.headlines.join("\n- ")}`
		: "No news provided.";

	const position = portfolio.position
		? `Current position: ${portfolio.position.qty} units @ avg $${fmt(portfolio.position.avgPrice)} (unrealized P&L $${fmt(portfolio.position.unrealizedPnl)}).`
		: "No current position in this instrument.";

	return `Instrument: ${ctx.name} (${ctx.symbol.toUpperCase()}) [${ctx.instrument}]
Price: $${fmt(ctx.price)}
24h change: ${pct(ctx.change24hPct)}
7d change: ${pct(ctx.change7dPct)}
24h volume: $${fmt(ctx.volume24h)}
Market cap: $${fmt(ctx.marketCap)}
${news}

Portfolio:
Cash: $${fmt(portfolio.cash)}
NAV: $${fmt(portfolio.nav)}
${position}

Decide whether to buy, sell, or hold ${ctx.symbol.toUpperCase()} right now.`;
}
