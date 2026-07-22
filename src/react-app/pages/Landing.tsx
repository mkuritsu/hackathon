import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import { useAuth } from "../lib/auth";

type AgentRow = {
	rank: string;
	name: string;
	desc: string;
	roi: string;
	roiLabel: string;
	accent: "primary" | "secondary" | "muted" | "error";
};

const AGENTS: AgentRow[] = [
	{
		rank: "01",
		name: "ALPHA_DOGE_V4",
		desc: "HFT // AGGRESSIVE ARB",
		roi: "+8,420.1%",
		roiLabel: "Realized ROI",
		accent: "primary",
	},
	{
		rank: "02",
		name: "QUANT_PEPE_ULTRA",
		desc: "NEURAL // SENTIMENT_SWARM",
		roi: "+1,204.4%",
		roiLabel: "Realized ROI",
		accent: "secondary",
	},
	{
		rank: "03",
		name: "YIELD_FARMER_X",
		desc: "DELTA_NEUTRAL // STAKING",
		roi: "+42.8%",
		roiLabel: "Realized ROI",
		accent: "muted",
	},
	{
		rank: "04",
		name: "BEAR_TRAP_99",
		desc: "CONTRA // REVERSION",
		roi: "-99.9%",
		roiLabel: "Liquidated",
		accent: "error",
	},
];

const ACCENT = {
	primary: {
		border: "border-primary-fixed",
		text: "text-primary-fixed",
		hoverName: "group-hover:text-primary-fixed",
		roi: "text-primary-fixed",
		roiSub: "text-primary-fixed/60",
		numBorder: "border-primary-fixed/20",
	},
	secondary: {
		border: "border-secondary",
		text: "text-secondary",
		hoverName: "group-hover:text-secondary",
		roi: "text-secondary",
		roiSub: "text-secondary/60",
		numBorder: "border-secondary/20",
	},
	muted: {
		border: "border-surface-variant",
		text: "text-on-surface-variant",
		hoverName: "",
		roi: "text-on-surface-variant",
		roiSub: "text-on-surface-variant/60",
		numBorder: "border-on-surface-variant/20",
	},
	error: {
		border: "border-error",
		text: "text-error",
		hoverName: "",
		roi: "text-error",
		roiSub: "text-error/60",
		numBorder: "border-error/20",
	},
} as const;

function useDeskClock() {
	const [clock, setClock] = useState("00:00:00:00");
	useEffect(() => {
		const tick = () => {
			const now = new Date();
			const p = (n: number) => String(n).padStart(2, "0");
			// day-of-month : hours : minutes : seconds for that terminal cadence
			setClock(
				`${p(now.getDate())}:${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
			);
		};
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, []);
	return clock;
}

export default function Landing() {
	const navigate = useNavigate();
	const clock = useDeskClock();
	const { user } = useAuth();
	const [authOpen, setAuthOpen] = useState(false);

	function initializeRun() {
		if (user) {
			navigate("/allocate");
		} else {
			setAuthOpen(true);
		}
	}

	return (
		<div className="px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center justify-center py-8">
			{/* Left: value proposition */}
			<div className="flex-1 flex flex-col gap-8 relative z-20">
				<div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest border border-primary-fixed/20 rounded-full w-fit">
					<span className="w-2 h-2 rounded-full bg-primary-fixed data-stream-pulse" />
					<span className="font-label-caps text-[10px] text-primary-fixed tracking-widest">
						NETWORK LIVE // AGENTS DEPLOYED
					</span>
				</div>

				<h2 className="font-headline-xl text-headline-xl text-primary md:text-[80px] leading-[0.9] uppercase relative">
					EXPLOITING THE <br />
					<span className="text-secondary">ALGORITHMIC</span> <br />
					<span className="text-primary-fixed border-b-4 border-primary-fixed">
						CHAOS.
					</span>{" "}
					<br />
					FOR HUMANITY.
				</h2>

				<p className="font-body-md text-body-md text-on-surface-variant max-w-xl border-l-4 border-secondary pl-4 py-1">
					W Yields deploys high-frequency AI agents into extreme volatility meme
					markets. Our proprietary swarm logic extracts value from
					irrationality, redirecting execution profits to verified global impact
					initiatives.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 mt-4">
					<button
						type="button"
						onClick={initializeRun}
						className="btn-neon font-headline-lg text-headline-lg px-10 py-5 uppercase flex items-center justify-center gap-3 group"
					>
						INITIALIZE RUN
						<span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
							rocket_launch
						</span>
					</button>
					<button
						type="button"
						onClick={() => navigate("/arena")}
						className="font-headline-lg text-headline-lg px-10 py-5 uppercase border-2 border-surface-container-highest hover:bg-surface-container-highest transition-all"
					>
						VIEW AUDITS
					</button>
				</div>

				<div className="flex items-center gap-8 mt-4">
					<div>
						<div className="font-financial-display text-primary">$1.4B+</div>
						<div className="font-label-caps text-[10px] text-on-surface-variant">
							TOTAL VOLUME
						</div>
					</div>
					<div>
						<div className="font-financial-display text-secondary">842K</div>
						<div className="font-label-caps text-[10px] text-on-surface-variant">
							AGENT EXECUTIONS
						</div>
					</div>
					<div>
						<div className="font-financial-display text-primary-fixed">$22M</div>
						<div className="font-label-caps text-[10px] text-on-surface-variant">
							CHARITY DONATED
						</div>
					</div>
				</div>
			</div>

			{/* Right: real-time dashboard panel */}
			<div className="flex-1 w-full max-w-xl relative z-10">
				<div className="bg-surface-container border-2 border-primary-fixed p-1 noise-bg relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
					{/* Status bar */}
					<div className="bg-surface-container-lowest border-b-2 border-primary-fixed p-3 flex justify-between items-center">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-primary-fixed rounded-full animate-pulse shadow-[0_0_8px_#c3f400]" />
							<span className="font-label-caps text-[11px] text-primary-fixed tracking-tighter">
								NODE_LIVE // SECTOR_07
							</span>
						</div>
						<span className="font-financial-display text-[20px] text-primary-fixed tracking-widest">
							{clock}
						</span>
					</div>

					<div className="p-4 flex flex-col gap-3">
						{AGENTS.map((agent) => {
							const a = ACCENT[agent.accent];
							return (
								<div
									key={agent.rank}
									className={`flex justify-between items-center bg-surface-container-high p-4 border-l-4 ${a.border} hover:bg-surface-container-highest transition-all group cursor-pointer relative overflow-hidden ${agent.accent === "muted" ? "opacity-80" : ""}`}
								>
									{agent.accent === "error" && (
										<div className="absolute inset-0 bg-error/5" />
									)}
									<div className="flex items-center gap-4 relative z-10">
										<div
											className={`bg-surface-container-lowest w-10 h-10 flex items-center justify-center font-headline-lg-mobile ${a.text} border ${a.numBorder}`}
										>
											{agent.rank}
										</div>
										<div>
											<div
												className={`font-label-caps text-label-caps ${agent.accent === "error" ? "text-error" : "text-primary"} ${a.hoverName} transition-colors`}
											>
												{agent.name}
											</div>
											<div className="font-label-caps text-[9px] text-on-surface-variant tracking-widest mt-1">
												{agent.desc}
											</div>
										</div>
									</div>
									<div className="text-right relative z-10">
										<div className={`font-financial-display text-[22px] ${a.roi}`}>
											{agent.roi}
										</div>
										<div
											className={`font-label-caps text-[9px] ${a.roiSub} uppercase`}
										>
											{agent.roiLabel}
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{/* Footer data bar */}
					<div className="p-3 bg-surface-container-lowest border-t border-primary-fixed/20 flex justify-between items-center font-label-caps text-[9px] text-on-surface-variant uppercase tracking-tighter">
						<span>Block: #19482751</span>
						<span>Gas: 12 Gwei</span>
						<span className="text-primary-fixed">Slippage: 0.05%</span>
					</div>
				</div>

				{/* Performance sticker */}
				<div className="absolute -bottom-6 -right-6 z-30 sticker-rotate-2 hidden sm:block">
					<div className="bg-primary-fixed text-surface font-label-caps text-label-caps px-4 py-2 border-2 border-surface uppercase flex items-center gap-2 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
						<span className="material-symbols-outlined text-[16px]">
							verified
						</span>
						SYSTEMS_OPTIMIZED
					</div>
				</div>
			</div>

			<AuthModal
				open={authOpen}
				onClose={() => setAuthOpen(false)}
				onSuccess={() => {
					setAuthOpen(false);
					navigate("/allocate");
				}}
			/>
		</div>
	);
}
