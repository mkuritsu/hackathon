import { useNavigate, useSearchParams } from "react-router-dom";
import { AGENTS, AGENT_WEIGHT } from "../data/agents";
import { findCharity } from "../data/charities";
import { formatUSD, readAmount } from "../lib/format";

// Per-agent end-value spread. Factors sum to the agent count so the per-agent
// ending values sum back to the final NAV.
const FACTORS = [1.35, 0.65, 1.2, 0.8];

export default function Overview() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const deployed = readAmount(params.get("amount"));
	const final = readAmount(params.get("final"), deployed);
	const charity = findCharity(params.get("charity"));

	const pnl = final - deployed;
	const won = pnl >= 0;
	const donation = Math.max(pnl, 0);

	const rows = AGENTS.map((agent, i) => {
		const buy = deployed * AGENT_WEIGHT;
		const end = (final / AGENTS.length) * (FACTORS[i] ?? 1);
		return { agent, buy, end, pnl: end - buy };
	});

	function emailReport() {
		const subject = `W YIELDS Recap - ${won ? "PROFIT" : "LOSS"} ${formatUSD(pnl)}`;
		const lines = [
			"W YIELDS // SIMULATED RUN RECAP",
			"",
			`Deployed capital: ${formatUSD(deployed)}`,
			`Final NAV: ${formatUSD(final)}`,
			`Net P&L: ${formatUSD(pnl)}`,
			charity ? `Charity: ${charity.name}` : "Charity: (none selected)",
			`Donated to charity: ${formatUSD(donation)}`,
			"",
			"Agent breakdown:",
			...rows.map(
				(r) =>
					`- ${r.agent.name} (${r.agent.buy}): bought ${formatUSD(r.buy)} -> ${formatUSD(r.end)} (${formatUSD(r.pnl)})`,
			),
			"",
			"All trades simulated. No real money involved.",
		];
		const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
		window.location.assign(href);
	}

	return (
		<div className="px-gutter lg:px-margin-desktop max-w-4xl mx-auto flex flex-col gap-6">
			{/* Header */}
			<div className="text-center relative py-2">
				<h1 className="font-headline-xl text-headline-xl md:text-[56px] text-primary-fixed tracking-tight led-text uppercase leading-none">
					THE FULL RECAP
				</h1>
				<p className="font-label-caps text-label-caps text-secondary-fixed-dim mt-2">
					SIMULATED RUN // COMPLETE
				</p>
			</div>

			{/* Result hero */}
			<section
				className={`grid grid-cols-1 sm:grid-cols-3 gap-unit border-2 ${won ? "border-primary-fixed neon-glow" : "border-error"} bg-surface-container-low p-unit`}
			>
				<div className="border-2 border-surface-variant bg-black p-3 flex flex-col justify-end h-24">
					<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
						DEPLOYED
					</div>
					<div className="font-financial-display text-financial-display text-on-surface text-right mt-auto tracking-widest">
						{formatUSD(deployed)}
					</div>
				</div>
				<div className="border-2 border-primary-fixed bg-black p-3 flex flex-col justify-end h-24">
					<div className="font-label-caps text-label-caps text-primary-fixed uppercase">
						FINAL NAV
					</div>
					<div className="font-financial-display text-financial-display text-primary-fixed text-right mt-auto tracking-widest led-text">
						{formatUSD(final)}
					</div>
				</div>
				<div
					className={`border-2 ${won ? "border-primary-fixed" : "border-error"} bg-black p-3 flex flex-col justify-end h-24`}
				>
					<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
						NET P&amp;L
					</div>
					<div
						className={`font-financial-display text-financial-display text-right mt-auto tracking-widest led-text ${won ? "text-primary-fixed" : "text-error"}`}
					>
						{won ? "+" : ""}
						{formatUSD(pnl)}
					</div>
				</div>
			</section>

			{/* Charity */}
			<section className="border-2 border-secondary bg-surface-container p-4 flex items-start gap-4">
				<span
					className="material-symbols-outlined text-secondary text-[32px]"
					style={{ fontVariationSettings: "'FILL' 1" }}
				>
					{charity?.icon ?? "volunteer_activism"}
				</span>
				<div className="flex-1">
					<h3 className="font-headline-lg-mobile text-headline-lg-mobile text-secondary uppercase leading-none">
						{charity?.name ?? "NO CAUSE SELECTED"}
					</h3>
					<p className="font-body-md text-body-md text-on-surface-variant mt-1">
						{donation > 0
							? "Your simulated gains convert entirely to this cause."
							: "No gains this run, so no donation was generated. The chaos giveth and taketh."}
					</p>
				</div>
				<div className="text-right shrink-0">
					<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
						DONATED
					</div>
					<div className="font-financial-display text-financial-display text-secondary">
						{formatUSD(donation)}
					</div>
				</div>
			</section>

			{/* Agent breakdown */}
			<section className="flex flex-col gap-unit">
				<h2 className="font-headline-lg text-headline-lg text-on-surface uppercase">
					AGENT BREAKDOWN
				</h2>
				{rows.map(({ agent, buy, end, pnl: aPnl }) => {
					const aWon = aPnl >= 0;
					return (
						<div
							key={agent.rank}
							className="border-2 border-surface-variant bg-surface-container p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
						>
							<div className="flex items-center gap-3">
								<span className="font-headline-lg text-headline-lg text-surface-variant leading-none">
									{agent.rank}
								</span>
								<div>
									<div className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase leading-none">
										{agent.name}
									</div>
									<div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">
										{agent.buy} // {agent.market}
									</div>
								</div>
							</div>
							<div className="flex gap-6 justify-between sm:justify-end">
								<div className="text-right">
									<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
										BOUGHT AT
									</div>
									<div className="font-financial-display text-financial-display text-on-surface">
										{formatUSD(buy)}
									</div>
								</div>
								<div className="text-right">
									<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
										ENDED AT
									</div>
									<div className="font-financial-display text-financial-display text-on-surface">
										{formatUSD(end)}
									</div>
								</div>
								<div className="text-right">
									<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
										P&amp;L
									</div>
									<div
										className={`font-financial-display text-financial-display ${aWon ? "text-primary-fixed" : "text-error"}`}
									>
										{aWon ? "+" : ""}
										{formatUSD(aPnl)}
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</section>

			{/* Actions */}
			<section className="flex flex-col sm:flex-row gap-4">
				<button
					type="button"
					onClick={emailReport}
					className="flex-1 btn-neon font-headline-lg text-headline-lg py-4 uppercase flex items-center justify-center gap-3"
				>
					<span className="material-symbols-outlined">mail</span>
					EMAIL REPORT
				</button>
			</section>

			<button
				type="button"
				onClick={() => navigate("/")}
				className="self-center font-label-caps text-label-caps text-on-surface-variant uppercase border border-outline-variant px-4 py-2 hover:text-primary-fixed hover:border-primary-fixed transition-colors"
			>
				START A NEW RUN
			</button>
		</div>
	);
}
