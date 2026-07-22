import type { MarketContext, MarketKind } from "../adapters/types";
import type { PortfolioContext } from "../contracts";

const BASE_RULES = `You are an analyst for an autonomous, fully-simulated hedge fund.
Given data for ONE instrument and the fund's current portfolio, decide whether to buy, sell, or hold, and how strongly you believe it.

Rules:
- Reason ONLY from the data provided. Never invent prices, odds, news, or facts.
- Be decisive but honest. Confidence 0 means no edge, 1 means an extremely strong edge. Most calls sit between 0.2 and 0.7.
- "buy" = take/open this position, "sell" = exit or fade it, "hold" = pass.
- Account for the current position when deciding.
- thesis: one or two crisp sentences citing the specific numbers that drove the call. No filler, no disclaimers.`;

const PERSONA: Record<MarketKind, string> = {
	crypto: `You specialize in crypto and meme coins. Momentum and narrative dominate; volatility is huge and reversals are violent. Weight recent price action and volume heavily, and respect that low-cap meme coins can run or dump fast.`,
	stocks: `You specialize in equities. Balance momentum with valuation and liquidity. Remember markets have hours and gaps; avoid over-reacting to tiny intraday moves.`,
	prediction: `You specialize in prediction markets. The price IS an implied probability (0..1). Your edge is disagreeing with the crowd's probability: buy when you think the true probability is higher than the price, fade when lower. Consider time to resolution.`,
	sports: `You specialize in sports betting. Convert odds to an implied probability and look for value versus the line, not just the likely winner. Consider event timing and that favorites are often overpriced.`,
};

function fmt(n: number): string {
	if (!Number.isFinite(n)) {
		return "n/a";
	}
	return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function systemPromptFor(kind: MarketKind): string {
	return `${BASE_RULES}\n\n${PERSONA[kind]}`;
}

function priceLine(ctx: MarketContext): string {
	switch (ctx.unit) {
		case "usd":
			return `Price: $${fmt(ctx.price)}`;
		case "probability":
			return `Implied probability: ${(ctx.price * 100).toFixed(1)}%`;
		case "odds_decimal":
			return `Decimal odds: ${fmt(ctx.price)}`;
		case "odds_american":
			return `American odds: ${ctx.price > 0 ? "+" : ""}${fmt(ctx.price)}`;
	}
}

export function buildAnalystUserPrompt(ctx: MarketContext, portfolio: PortfolioContext): string {
	const lines: string[] = [
		`Market: ${ctx.kind}`,
		`Instrument: ${ctx.name}${ctx.symbol ? ` (${ctx.symbol.toUpperCase()})` : ""} [${ctx.instrument}]`,
		priceLine(ctx),
	];
	if (ctx.changePct !== undefined) {
		lines.push(`Recent change: ${ctx.changePct.toFixed(2)}%`);
	}
	if (ctx.liquidity !== undefined) {
		lines.push(`Liquidity: $${fmt(ctx.liquidity)}`);
	}
	if (ctx.eventAt) {
		lines.push(`Resolves/starts: ${ctx.eventAt}`);
	}
	if (ctx.signals) {
		for (const [k, v] of Object.entries(ctx.signals)) {
			lines.push(`${k}: ${typeof v === "number" ? fmt(v) : v}`);
		}
	}
	if (ctx.summary) {
		lines.push(`Context: ${ctx.summary}`);
	}
	if (ctx.headlines?.length) {
		lines.push(`Recent headlines:\n- ${ctx.headlines.join("\n- ")}`);
	}

	const position = portfolio.position
		? `Current position: ${portfolio.position.qty} units @ avg ${fmt(portfolio.position.avgPrice)} (unrealized P&L $${fmt(portfolio.position.unrealizedPnl)}).`
		: "No current position in this instrument.";

	return `${lines.join("\n")}

Portfolio:
Cash: $${fmt(portfolio.cash)}
NAV: $${fmt(portfolio.nav)}
${position}

Decide whether to buy, sell, or hold this instrument right now.`;
}
