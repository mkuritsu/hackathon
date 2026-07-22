import { useNavigate, useSearchParams } from "react-router-dom";
import { AGENTS, AGENT_WEIGHT } from "../data/agents";
import { formatUSD, readAmount } from "../lib/format";

const ACCENT = {
	primary: {
		border: "border-surface-variant",
		hoverBorder: "hover:border-primary-fixed",
		rank: "text-surface-variant",
		rankHover: "group-hover:text-primary-fixed",
		buy: "text-primary-fixed",
	},
	secondary: {
		border: "border-surface-variant",
		hoverBorder: "hover:border-secondary",
		rank: "text-surface-variant",
		rankHover: "group-hover:text-secondary",
		buy: "text-secondary",
	},
	error: {
		border: "border-error",
		hoverBorder: "hover:border-error",
		rank: "text-error",
		rankHover: "",
		buy: "text-error",
	},
} as const;

export default function Arena() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const deployed = readAmount(params.get("amount"));

	function next() {
		navigate(`/charity?amount=${deployed}`);
	}

	return (
		<div className="px-gutter lg:px-margin-desktop max-w-7xl mx-auto flex flex-col gap-6">
			{/* Deployed capital summary */}
			<section className="border-2 border-primary-fixed bg-black p-4 flex flex-wrap items-end justify-between gap-4 neon-glow">
				<div>
					<div className="font-label-caps text-label-caps text-primary-fixed uppercase">
						DEPLOYED CAPITAL
					</div>
					<div className="font-financial-display text-[40px] text-primary-fixed led-text tracking-widest mt-1">
						{formatUSD(deployed)}
					</div>
				</div>
				<div className="font-label-caps text-label-caps text-on-surface-variant uppercase text-right">
					{AGENTS.length} AGENTS // SIMULATED BUYS
				</div>
			</section>

			{/* Agent buys */}
			<section className="flex flex-col gap-unit">
				<div className="flex justify-between items-end mb-2">
					<h2 className="font-headline-xl text-headline-xl text-on-surface uppercase">
						AGENT BUYS
					</h2>
					<span className="font-label-caps text-label-caps text-primary-fixed">
						PENDING EXECUTION
					</span>
				</div>

				{AGENTS.map((agent) => {
					const a = ACCENT[agent.accent];
					const buyAmount = deployed * AGENT_WEIGHT;
					return (
						<div
							key={agent.rank}
							className={`relative border-2 ${a.border} bg-surface-container p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group ${a.hoverBorder} transition-colors`}
						>
							<div className="flex items-start gap-4 md:max-w-2xl">
								<div
									className={`font-headline-lg text-headline-lg ${a.rank} ${a.rankHover} transition-colors leading-none`}
								>
									{agent.rank}
								</div>
								<div>
									<div className="flex flex-wrap items-baseline gap-x-3">
										<h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface uppercase m-0 leading-none">
											{agent.name}
										</h3>
										<span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
											{agent.market}
										</span>
									</div>
									<p className="font-body-md text-body-md text-on-surface-variant mt-2">
										{agent.description}
									</p>
								</div>
							</div>

							<div className="flex gap-8 md:flex-col md:gap-1 md:text-right md:min-w-[10rem] shrink-0">
								<div>
									<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
										BUYS
									</div>
									<div
										className={`font-financial-display text-financial-display ${a.buy}`}
									>
										{agent.buy}
									</div>
								</div>
								<div>
									<div className="font-label-caps text-label-caps text-on-surface-variant uppercase">
										BOUGHT AT
									</div>
									<div className="font-financial-display text-financial-display text-on-surface">
										{formatUSD(buyAmount)}
									</div>
								</div>
							</div>
						</div>
					);
				})}

				<p className="font-body-md text-body-md text-on-surface-variant border-l-4 border-secondary pl-4 py-1 mt-2">
					Each agent's buy is a simulated allocation of your deployed capital. No
					real trades are placed.
				</p>
			</section>

			{/* Advance to charity selection */}
			<button
				type="button"
				onClick={next}
				className="self-center w-full max-w-md border-2 border-primary-fixed bg-surface text-primary-fixed font-headline-lg text-headline-lg py-4 uppercase flex items-center justify-center gap-3 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors active:scale-95 neon-glow-primary group"
			>
				PICK YOUR CAUSE
				<span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
					favorite
				</span>
			</button>
		</div>
	);
}
