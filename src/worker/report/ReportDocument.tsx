// The daily fund report, authored as React and server-rendered to a full HTML
// document. Browser Rendering turns this document into the PDF. Styling is
// inlined so the render is fully self-contained (no external asset fetches).

export interface ReportTrade {
	ts: string;
	adapter: string;
	instrument: string;
	action: string;
	qty: number;
	price: number;
	thesis: string | null;
	confidence: number | null;
}

export interface ReportLeaderboardRow {
	adapter: string;
	realized_pnl: number;
	unrealized_pnl: number;
	trade_count: number;
}

export interface ReportData {
	generatedAt: string;
	owner: string;
	mandate: string;
	startingCash: number;
	nav: number;
	cash: number;
	positionsValue: number;
	priorNav: number | null;
	trades: ReportTrade[];
	leaderboard: ReportLeaderboardRow[];
}

// Credible randomized report data for previewing/demoing the fully populated
// layout without needing real account activity in D1.
export function sampleReportData(owner = "demo-desk"): ReportData {
	const rand = (min: number, max: number) => min + Math.random() * (max - min);
	const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
	const round2 = (n: number) => Math.round(n * 100) / 100;

	const startingCash = 100_000;

	const markets: Record<string, string[]> = {
		crypto: ["BTC", "ETH", "SOL", "DOGE", "PEPE"],
		stocks: ["NVDA", "AAPL", "TSLA", "AMD", "MSFT"],
		prediction: ["US-ELECTION-2028", "FED-CUT-Q3", "OPENAI-IPO-2026"],
		sports: ["LAL-ML", "ARS-OVER-2.5", "CHIEFS-SPREAD"],
	};

	const priceFor = (adapter: string) => {
		switch (adapter) {
			case "crypto":
				return round2(rand(0.000008, 68_000));
			case "stocks":
				return round2(rand(95, 940));
			default:
				return round2(rand(0.05, 0.95)); // implied probability as price
		}
	};

	const theses = [
		"Momentum breakout on rising volume; trend-following signal fired.",
		"Oversold RSI with bullish divergence into a key support retest.",
		"Positive news catalyst not yet priced in; mean-reversion setup.",
		"Implied odds lag the consensus model; edge on the yes side.",
		"Sector rotation tailwind; relative strength versus the benchmark.",
		"Funding rates cooling after a squeeze; fading the overextension.",
	];

	const adapters = Object.keys(markets);
	const trades: ReportTrade[] = [];
	const now = Date.now();
	const tradeCount = Math.floor(rand(9, 16));
	for (let i = 0; i < tradeCount; i++) {
		const adapter = pick(adapters);
		const action = pick(["buy", "buy", "sell", "hold"]);
		const price = priceFor(adapter);
		trades.push({
			ts: new Date(now - i * rand(20, 90) * 60_000).toISOString(),
			adapter,
			instrument: pick(markets[adapter]),
			action,
			qty: round2(rand(1, adapter === "crypto" ? 5 : 120)),
			price,
			thesis: action === "hold" ? null : pick(theses),
			confidence: round2(rand(0.52, 0.95)),
		});
	}

	const leaderboard: ReportLeaderboardRow[] = adapters.map((adapter) => ({
		adapter,
		realized_pnl: round2(rand(-2_800, 6_500)),
		unrealized_pnl: round2(rand(-1_500, 4_200)),
		trade_count: trades.filter((t) => t.adapter === adapter).length,
	}));

	const totalPnl = leaderboard.reduce((s, r) => s + r.realized_pnl + r.unrealized_pnl, 0);
	const nav = round2(startingCash + totalPnl);
	const positionsValue = round2(rand(0.3, 0.7) * nav);
	const cash = round2(nav - positionsValue);
	const priorNav = round2(nav - rand(-1_800, 2_400));

	return {
		generatedAt: new Date().toISOString(),
		owner,
		mandate: "Make money. All trades simulated.",
		startingCash,
		nav,
		cash,
		positionsValue,
		priorNav,
		trades,
		leaderboard,
	};
}

const money = (n: number) =>
	n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const signedMoney = (n: number) => (n >= 0 ? "+" : "") + money(n);

const styles = `
	* { box-sizing: border-box; }
	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		margin: 0;
		color: #0f172a;
		background: #ffffff;
		font-size: 12px;
		line-height: 1.45;
	}
	.page { padding: 40px 44px; }
	.eyebrow { letter-spacing: 0.18em; text-transform: uppercase; font-size: 10px; color: #64748b; margin: 0 0 4px; }
	h1 { font-size: 26px; margin: 0 0 2px; }
	.sub { color: #64748b; margin: 0 0 28px; font-size: 11px; }
	.cards { display: flex; gap: 12px; margin-bottom: 28px; }
	.card { flex: 1; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
	.card .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin: 0 0 6px; }
	.card .value { font-size: 20px; font-weight: 700; margin: 0; }
	.pos { color: #16a34a; }
	.neg { color: #dc2626; }
	h2 { font-size: 14px; margin: 28px 0 10px; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
	table { width: 100%; border-collapse: collapse; }
	th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
	th { text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; color: #64748b; }
	td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
	.pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
	.pill.buy { background: #dcfce7; color: #166534; }
	.pill.sell { background: #fee2e2; color: #991b1b; }
	.pill.hold { background: #e2e8f0; color: #475569; }
	.thesis { color: #475569; max-width: 260px; }
	.empty { color: #94a3b8; font-style: italic; padding: 12px 0; }
	.footer { margin-top: 36px; color: #94a3b8; font-size: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
`;

export function ReportDocument({ data }: { data: ReportData }) {
	const pnl = data.nav - data.startingCash;
	const pnlPct = data.startingCash > 0 ? (pnl / data.startingCash) * 100 : 0;
	const dayChange = data.priorNav === null ? null : data.nav - data.priorNav;

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<title>Hedge Fund of Agents — Daily Report</title>
				<style dangerouslySetInnerHTML={{ __html: styles }} />
			</head>
			<body>
				<div className="page">
					<p className="eyebrow">Hedge Fund of Agents</p>
					<h1>Daily Desk Report</h1>
					<p className="sub">
						Account: {data.owner} · Generated {new Date(data.generatedAt).toUTCString()} · All
						trades simulated
					</p>

					<div className="cards">
						<div className="card">
							<p className="label">Net Asset Value</p>
							<p className="value">{money(data.nav)}</p>
						</div>
						<div className="card">
							<p className="label">Total P&amp;L</p>
							<p className={`value ${pnl >= 0 ? "pos" : "neg"}`}>
								{signedMoney(pnl)} ({pnlPct >= 0 ? "+" : ""}
								{pnlPct.toFixed(2)}%)
							</p>
						</div>
						<div className="card">
							<p className="label">Day Change</p>
							<p className={`value ${(dayChange ?? 0) >= 0 ? "pos" : "neg"}`}>
								{dayChange === null ? "—" : signedMoney(dayChange)}
							</p>
						</div>
					</div>

					<div className="cards">
						<div className="card">
							<p className="label">Starting Capital</p>
							<p className="value">{money(data.startingCash)}</p>
						</div>
						<div className="card">
							<p className="label">Cash</p>
							<p className="value">{money(data.cash)}</p>
						</div>
						<div className="card">
							<p className="label">Positions Value</p>
							<p className="value">{money(data.positionsValue)}</p>
						</div>
					</div>

					<h2>Per-Market Leaderboard</h2>
					{data.leaderboard.length === 0 ? (
						<p className="empty">No market activity yet.</p>
					) : (
						<table>
							<thead>
								<tr>
									<th>Market</th>
									<th className="num">Realized P&amp;L</th>
									<th className="num">Unrealized P&amp;L</th>
									<th className="num">Total P&amp;L</th>
									<th className="num">Trades</th>
								</tr>
							</thead>
							<tbody>
								{[...data.leaderboard]
									.sort(
										(a, b) =>
											b.realized_pnl + b.unrealized_pnl - (a.realized_pnl + a.unrealized_pnl),
									)
									.map((row) => {
										const total = row.realized_pnl + row.unrealized_pnl;
										return (
											<tr key={row.adapter}>
												<td>{row.adapter}</td>
												<td className={`num ${row.realized_pnl >= 0 ? "pos" : "neg"}`}>
													{signedMoney(row.realized_pnl)}
												</td>
												<td className={`num ${row.unrealized_pnl >= 0 ? "pos" : "neg"}`}>
													{signedMoney(row.unrealized_pnl)}
												</td>
												<td className={`num ${total >= 0 ? "pos" : "neg"}`}>
													{signedMoney(total)}
												</td>
												<td className="num">{row.trade_count}</td>
											</tr>
										);
									})}
							</tbody>
						</table>
					)}

					<h2>Trades</h2>
					{data.trades.length === 0 ? (
						<p className="empty">No trades executed in this period.</p>
					) : (
						<table>
							<thead>
								<tr>
									<th>Time</th>
									<th>Market</th>
									<th>Instrument</th>
									<th>Action</th>
									<th className="num">Qty</th>
									<th className="num">Price</th>
									<th className="num">Conf.</th>
									<th>Thesis</th>
								</tr>
							</thead>
							<tbody>
								{data.trades.map((t, i) => {
									const action = t.action.toLowerCase();
									const pill = action === "buy" || action === "sell" ? action : "hold";
									return (
										<tr key={i}>
											<td>{new Date(t.ts).toISOString().slice(0, 16).replace("T", " ")}</td>
											<td>{t.adapter}</td>
											<td>{t.instrument}</td>
											<td>
												<span className={`pill ${pill}`}>{t.action}</span>
											</td>
											<td className="num">{t.qty}</td>
											<td className="num">{money(t.price)}</td>
											<td className="num">
												{t.confidence === null ? "—" : `${Math.round(t.confidence * 100)}%`}
											</td>
											<td className="thesis">{t.thesis ?? "—"}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					)}

					<p className="footer">
						Hedge Fund of Agents · Autonomous simulated trading desk on Cloudflare ·
						Mandate: {data.mandate}
					</p>
				</div>
			</body>
		</html>
	);
}
