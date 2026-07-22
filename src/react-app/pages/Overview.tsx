import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AGENTS } from "../data/agents";
import { findCharity } from "../data/charities";
import * as api from "../lib/api";
import { buysByAdapter, formatUSD } from "../lib/format";

type EmailState =
	| { status: "idle" }
	| { status: "sending" }
	| { status: "sent"; to: string }
	| { status: "error"; message: string };

export default function Overview() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const charity = findCharity(params.get("charity"));

	const [portfolio, setPortfolio] = useState<api.Portfolio | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [email, setEmail] = useState<EmailState>({ status: "idle" });

	useEffect(() => {
		api
			.getPortfolio()
			.then(setPortfolio)
			.catch((err) => {
				if (err instanceof api.ApiError && err.status === 401) {
					navigate("/", { replace: true });
					return;
				}
				setLoadError("Could not load your recap.");
			});
	}, [navigate]);

	async function emailReport() {
		if (email.status === "sending") return;
		setEmail({ status: "sending" });
		try {
			const res = await api.emailReport();
			setEmail({ status: "sent", to: res.emailed });
		} catch (err) {
			const message =
				err instanceof api.ApiError ? err.message : "Failed to send report.";
			setEmail({ status: "error", message });
		}
	}

	if (loadError) {
		return (
			<div className="px-margin-mobile max-w-2xl mx-auto text-center py-16">
				<p className="font-label-caps text-label-caps text-error">{loadError}</p>
			</div>
		);
	}

	if (!portfolio) {
		return (
			<div className="px-margin-mobile max-w-2xl mx-auto text-center py-16">
				<p className="font-label-caps text-label-caps text-primary-fixed animate-pulse">
					TALLYING RESULTS...
				</p>
			</div>
		);
	}

	const deployed = portfolio.startingCash - portfolio.cash;
	const final = portfolio.nav;
	const pnl = final - portfolio.startingCash;
	const won = pnl >= 0;
	const donation = Math.max(pnl, 0);
	const byAdapter = buysByAdapter(portfolio.trades);

	const rows = AGENTS.map((agent) => {
		const data = byAdapter[agent.adapter];
		return {
			agent,
			notional: data?.notional ?? 0,
			fills: data?.count ?? 0,
			instruments: data?.instruments ?? [],
		};
	});

	return (
		<div className="px-gutter lg:px-margin-desktop max-w-4xl mx-auto flex flex-col gap-6">
			{/* Header */}
			<div className="text-center relative py-2">
				<h1 className="font-headline-xl text-headline-xl md:text-[56px] text-primary-fixed tracking-tight led-text uppercase leading-none">
					THE FULL RECAP
				</h1>
				<p className="font-label-caps text-label-caps text-secondary-fixed-dim mt-2">
					LIVE FROM YOUR LEDGER // D1
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
							: "No realized gains yet (positions marked at cost). The chaos giveth in time."}
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
				{rows.map(({ agent, notional, fills, instruments }) => (
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
									{instruments.length ? instruments.join(", ") : "HELD"} //{" "}
									{agent.market}
								</div>
							</div>
						</div>
						<div className="flex gap-6 justify-between sm:justify-end">
							<div className="text-right">
								<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
									NOTIONAL
								</div>
								<div className="font-financial-display text-financial-display text-on-surface">
									{formatUSD(notional)}
								</div>
							</div>
							<div className="text-right">
								<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
									FILLS
								</div>
								<div className="font-financial-display text-financial-display text-primary-fixed">
									{fills}
								</div>
							</div>
						</div>
					</div>
				))}
			</section>

			{/* Actions */}
			<section className="flex flex-col gap-2">
				<button
					type="button"
					onClick={emailReport}
					disabled={email.status === "sending"}
					className="flex-1 btn-neon font-headline-lg text-headline-lg py-4 uppercase flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<span className="material-symbols-outlined">mail</span>
					{email.status === "sending"
						? "SENDING REPORT..."
						: email.status === "sent"
							? "REPORT SENT"
							: "EMAIL REPORT"}
				</button>
				{email.status === "sent" && (
					<p className="font-label-caps text-label-caps text-primary-fixed text-center">
						PDF report emailed to {email.to}
					</p>
				)}
				{email.status === "error" && (
					<p className="font-label-caps text-label-caps text-error text-center">
						{email.message}
					</p>
				)}
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
