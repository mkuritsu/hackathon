import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../lib/api";

type Stake = {
	value: number;
	label: string;
	accent: "primary" | "secondary";
	badge?: string;
};

const STAKES: Stake[] = [
	{ value: 25, label: "W$25", accent: "primary" },
	{ value: 50, label: "W$50", accent: "primary" },
	{ value: 100, label: "W$100", accent: "secondary", badge: "STRATEGIC ENTRY" },
	{ value: 250, label: "W$250", accent: "primary" },
];

export default function Allocate() {
	const navigate = useNavigate();
	const [selected, setSelected] = useState<number | null>(250);
	const [custom, setCustom] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function pick(value: number) {
		setSelected(value);
		setCustom("");
	}

	function onCustomChange(v: string) {
		setCustom(v);
		setSelected(null);
	}

	const amount = custom.trim() ? Number(custom) : (selected ?? 0);
	const canDeploy = Number.isFinite(amount) && amount > 0 && !busy;

	async function deploy() {
		if (!canDeploy) return;
		setBusy(true);
		setError(null);
		try {
			// Kick off the real ResearchWorkflow; the analyst reasons across every
			// market and commits simulated fills into this operator's account.
			const run = await api.runResearch();
			navigate(`/deploying?id=${encodeURIComponent(run.id)}&amount=${amount}`);
		} catch (err) {
			const message =
				err instanceof api.ApiError && err.status === 401
					? "Session expired. Head back and re-enter the desk."
					: "Failed to start the run. Try again.";
			setError(message);
			setBusy(false);
		}
	}

	return (
		<div className="flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop w-full max-w-4xl mx-auto relative">
			{/* Back / terminate */}
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="self-start flex items-center gap-2 text-primary-fixed border-2 border-primary-fixed bg-surface p-2 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors mb-6"
			>
				<span
					className="material-symbols-outlined"
					style={{ fontVariationSettings: "'FILL' 1" }}
				>
					arrow_back
				</span>
				<span className="font-label-caps text-label-caps">TERMINATE</span>
			</button>

			{/* Header */}
			<div className="text-center mb-8 relative">
				<div className="absolute -top-4 -right-4 bg-error-container text-on-error-container font-label-caps text-label-caps px-2 py-1 rotate-[3deg] border border-error z-20 shadow-md">
					RISK ADVISORY: ACTIVE
				</div>
				<h1 className="font-headline-xl text-headline-xl md:text-[72px] text-primary-fixed tracking-tight led-text drop-shadow-md">
					CHOOSE YOUR DELUSION
				</h1>
				<p className="font-label-caps text-label-caps text-secondary-fixed-dim mt-2">
					LIQUIDITY DEPLOYMENT PORTAL
				</p>
			</div>

			{/* Stake grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8">
				{STAKES.map((stake) => {
					const isSelected = selected === stake.value;
					const isSecondary = stake.accent === "secondary";
					const borderColor = isSecondary
						? "border-secondary"
						: "border-primary-fixed";
					const glow = isSelected
						? isSecondary
							? "neon-glow-secondary bg-secondary text-on-secondary"
							: "neon-glow-primary bg-primary-fixed text-on-primary-fixed"
						: "bg-surface-container";
					const hover = isSecondary
						? "hover:bg-secondary hover:text-on-secondary"
						: "hover:bg-primary-fixed hover:text-on-primary-fixed";
					const labelColor = isSelected
						? isSecondary
							? "text-on-secondary"
							: "text-on-primary-fixed"
						: isSecondary
							? "text-secondary group-hover:text-on-secondary"
							: "text-primary-fixed group-hover:text-on-primary-fixed";

					return (
						<button
							key={stake.value}
							type="button"
							onClick={() => pick(stake.value)}
							className={`relative border-2 ${borderColor} h-24 flex items-center justify-center transition-colors group ${glow} ${hover}`}
						>
							{stake.badge && (
								<div className="absolute -top-3 -right-2 bg-tertiary-container text-on-tertiary-container font-label-caps text-label-caps px-2 py-0.5 rotate-[-2deg] border border-on-tertiary-container z-20">
									{stake.badge}
								</div>
							)}
							<span
								className={`ghost-led font-financial-display text-[40px] ${isSecondary ? "!text-secondary/10" : ""}`}
							>
								888
							</span>
							<span
								className={`relative z-10 font-headline-lg text-headline-lg led-text ${labelColor}`}
							>
								{stake.label}
							</span>
						</button>
					);
				})}
			</div>

			{/* Custom input */}
			<div className="w-full max-w-md mb-8 relative group">
				<label
					htmlFor="manual-allocation"
					className="absolute top-0 left-0 text-primary-fixed font-label-caps text-[10px] transform -translate-y-1/2 translate-x-2 bg-background px-1 z-10"
				>
					MANUAL ALLOCATION
				</label>
				<div className="relative flex items-end h-16 border-b-[3px] border-primary-fixed bg-surface-container-low px-4 pb-2 focus-within:bg-surface-container focus-within:border-secondary transition-colors">
					<span className="text-primary-fixed font-financial-display text-financial-display mr-2 mb-1">
						W$
					</span>
					<input
						id="manual-allocation"
						type="number"
						min={1}
						max={10000}
						placeholder="0"
						value={custom}
						onChange={(e) => onCustomChange(e.target.value)}
						className="w-full bg-transparent border-none text-primary-fixed font-financial-display text-[32px] led-text text-right focus:ring-0 p-0 mb-[-4px]"
					/>
					<span className="ghost-led font-financial-display text-[32px] right-4 bottom-1">
						88888
					</span>
				</div>
			</div>

			{/* Protocol section */}
			<div className="w-full bg-surface-container-highest border-2 border-outline-variant p-4 mb-12 relative overflow-hidden">
				<div className="absolute inset-0 opacity-10 mix-blend-overlay noise-bg" />
				<div className="absolute top-2 right-2 w-3 h-3 bg-primary-fixed rounded-full animate-pulse shadow-[0_0_8px_#c3f400]" />
				<div className="relative z-10 flex gap-4 items-start">
					<span
						className="material-symbols-outlined text-secondary text-[32px]"
						style={{ fontVariationSettings: "'FILL' 1" }}
					>
						security
					</span>
					<div>
						<h3 className="font-headline-lg-mobile text-headline-lg-mobile text-secondary mb-2 uppercase">
							Platform Protocol &amp; Governance
						</h3>
						<p className="font-body-md text-body-md text-on-surface-variant">
							By deploying liquidity, you acknowledge all simulated gains are for
							philanthropic conversion. Eligible exits are capped at the initial
							W$ allocation value. The terminal remains a synthetic environment
							for strategic agent-driven portfolios.
						</p>
					</div>
				</div>
			</div>

			{/* Deploy */}
			{error && (
				<div className="w-full max-w-md mb-4 border border-error bg-error/10 text-error font-label-caps text-label-caps px-3 py-2 text-center">
					{error}
				</div>
			)}
			<button
				type="button"
				onClick={deploy}
				disabled={!canDeploy}
				className="w-full max-w-md border-2 border-primary-fixed bg-surface text-primary-fixed font-headline-lg text-headline-lg py-4 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors active:scale-95 neon-glow-primary disabled:opacity-40 disabled:cursor-not-allowed"
			>
				{busy ? "DEPLOYING..." : "DEPLOY AGENTS"}
			</button>
		</div>
	);
}
