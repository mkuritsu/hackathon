import type { Fill, Instrument, MarketAdapter, MarketContext, Order, Quote } from "./types";

// Free, unofficial ESPN JSON. No key. Odds availability is season/provider
// dependent; games without odds are skipped and an empty universe is fine.
const SPORT = "baseball";
const LEAGUE = "mlb";
const SCOREBOARD = `https://site.api.espn.com/apis/site/v2/sports/${SPORT}/${LEAGUE}/scoreboard`;
const HEADERS = { accept: "application/json", "user-agent": "hedge-fund-of-agents/0.1" };

interface EspnCompetitor {
	homeAway: string;
	team?: { displayName?: string; abbreviation?: string };
}
interface EspnTeamOdds {
	favorite?: boolean;
	moneyLine?: number;
	team?: { abbreviation?: string };
}
interface EspnOdds {
	details?: string;
	overUnder?: number;
	spread?: number;
	homeTeamOdds?: EspnTeamOdds;
	awayTeamOdds?: EspnTeamOdds;
}
interface EspnCompetition {
	competitors?: EspnCompetitor[];
	odds?: EspnOdds[];
}
interface EspnEvent {
	id: string;
	name?: string;
	shortName?: string;
	date?: string;
	competitions?: EspnCompetition[];
}

async function scoreboard(): Promise<EspnEvent[]> {
	const res = await fetch(SCOREBOARD, { headers: HEADERS });
	if (!res.ok) {
		throw new Error(`ESPN ${res.status}: ${await res.text()}`);
	}
	const json = (await res.json()) as { events?: EspnEvent[] };
	return json.events ?? [];
}

// Pick the favorite side; fall back to the lower moneyline.
function favorite(odds: EspnOdds): EspnTeamOdds | undefined {
	const home = odds.homeTeamOdds;
	const away = odds.awayTeamOdds;
	if (home?.favorite) return home;
	if (away?.favorite) return away;
	if (typeof home?.moneyLine === "number" && typeof away?.moneyLine === "number") {
		return home.moneyLine <= away.moneyLine ? home : away;
	}
	return home ?? away;
}

function toContext(ev: EspnEvent): MarketContext | null {
	const comp = ev.competitions?.[0];
	const odds = comp?.odds?.[0];
	if (!odds) {
		return null;
	}

	// Prefer the reliable "ABBR -162" details string; fall back to nested moneyLine.
	let abbr: string | undefined;
	let moneyLine: number | undefined;
	const m = odds.details?.match(/([A-Za-z]{2,4})\s+([+-]?\d+)/);
	if (m) {
		abbr = m[1].toUpperCase();
		moneyLine = Number(m[2]);
	} else {
		const fav = favorite(odds);
		if (fav && typeof fav.moneyLine === "number") {
			abbr = fav.team?.abbreviation;
			moneyLine = fav.moneyLine;
		}
	}
	if (moneyLine === undefined) {
		return null;
	}
	abbr = abbr ?? "FAV";
	const fav = { moneyLine };
	const matchup = ev.shortName ?? ev.name ?? ev.id;
	const signals: Record<string, string | number> = { matchup };
	if (odds.details) signals.line = odds.details;
	if (typeof odds.overUnder === "number") signals.overUnder = odds.overUnder;
	if (typeof odds.spread === "number") signals.spread = odds.spread;

	return {
		kind: "sports",
		instrument: `espn:${LEAGUE}:${ev.id}`,
		name: `${abbr} moneyline — ${matchup}`,
		symbol: abbr,
		price: fav.moneyLine,
		unit: "odds_american",
		eventAt: ev.date,
		signals,
		summary: `${LEAGUE.toUpperCase()} ${matchup}. Favorite ${abbr} moneyline ${fav.moneyLine > 0 ? "+" : ""}${fav.moneyLine}${odds.details ? ` (${odds.details})` : ""}.`,
	};
}

export const sportsAdapter: MarketAdapter = {
	id: "sports",
	kind: "sports",

	async getUniverse(limit = 5): Promise<Instrument[]> {
		const events = await scoreboard();
		const out: Instrument[] = [];
		for (const ev of events) {
			const ctx = toContext(ev);
			if (ctx) {
				out.push({ id: ctx.instrument, symbol: ctx.symbol ?? "FAV", name: ctx.name });
			}
			if (out.length >= limit) break;
		}
		return out;
	},

	async getQuote(id: string): Promise<Quote> {
		const ctx = await this.getContext(id);
		return { instrument: id, price: ctx.price, unit: ctx.unit, ts: new Date().toISOString() };
	},

	async getContext(id: string): Promise<MarketContext> {
		const eventId = id.split(":").pop();
		const ev = (await scoreboard()).find((e) => e.id === eventId);
		const ctx = ev ? toContext(ev) : null;
		if (!ctx) {
			throw new Error(`ESPN: no odds for ${id}`);
		}
		return ctx;
	},

	async simulateFill(order: Order): Promise<Fill> {
		const quote = await this.getQuote(order.instrument);
		return { instrument: order.instrument, price: quote.price, qty: order.qty, ts: new Date().toISOString() };
	},
};
