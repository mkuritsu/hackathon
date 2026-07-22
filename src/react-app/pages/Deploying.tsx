import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Simulated workflow stages. Swap this for real progress polling
// (e.g. GET /api/workflow/:id/status) when the Workflow is wired up.
const STAGES = [
	"FETCHING MARKET UNIVERSE",
	"PULLING CONTEXT + NEWS FEEDS",
	"REASONING // WORKERS AI",
	"SCORING PITCHES",
	"APPLYING RISK SIZING",
	"SIMULATING FILLS",
	"COMMITTING TO LEDGER",
];

const STAGE_MS = 850;
const DONE = STAGES.length;

export default function Deploying() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const amount = params.get("amount") ?? "";
	// stage counts completed stages: 0..STAGES.length (DONE means finished)
	const [stage, setStage] = useState(0);
	const logRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const next = amount ? `/arena?amount=${amount}` : "/arena";
		const id = setInterval(() => {
			setStage((s) => {
				if (s + 1 >= DONE) {
					clearInterval(id);
					window.setTimeout(() => navigate(next, { replace: true }), 700);
				}
				return Math.min(s + 1, DONE);
			});
		}, STAGE_MS);

		return () => clearInterval(id);
	}, [navigate, amount]);

	// Derive the console log from the stage counter (no extra state).
	const log: { text: string; kind: "done" | "active" | "complete" }[] = [];
	for (let i = 0; i < Math.min(stage, DONE); i++) {
		log.push({ text: `> ${STAGES[i]}... OK`, kind: "done" });
	}
	if (stage < DONE) {
		log.push({ text: `> ${STAGES[stage]}...`, kind: "active" });
	} else {
		log.push({
			text: "> DEPLOYMENT COMPLETE. ROUTING TO ARENA.",
			kind: "complete",
		});
	}

	useEffect(() => {
		logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
	}, [stage]);

	const pct = Math.round((stage / DONE) * 100);

	return (
		<div className="px-margin-mobile md:px-margin-desktop max-w-3xl mx-auto flex flex-col items-center justify-center gap-8 py-16">
			{/* Status pill */}
			<div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest border border-primary-fixed/20 rounded-full w-fit">
				<span className="w-2 h-2 rounded-full bg-primary-fixed data-stream-pulse" />
				<span className="font-label-caps text-[10px] text-primary-fixed tracking-widest">
					WORKFLOW RUNNING // DO NOT CLOSE TERMINAL
				</span>
			</div>

			<h1 className="font-headline-xl text-headline-xl md:text-[64px] text-primary-fixed tracking-tight led-text text-center uppercase leading-none">
				DEPLOYING AGENTS
			</h1>

			{/* Console */}
			<div className="w-full bg-surface-container border-2 border-primary-fixed p-1 noise-bg relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
				<div className="bg-surface-container-lowest border-b-2 border-primary-fixed p-3 flex justify-between items-center">
					<div className="flex items-center gap-2">
						<div className="w-2 h-2 bg-primary-fixed rounded-full animate-pulse shadow-[0_0_8px_#c3f400]" />
						<span className="font-label-caps text-[11px] text-primary-fixed tracking-tighter">
							RESEARCH_PIPELINE // WORKFLOW_07
						</span>
					</div>
					<span className="font-financial-display text-[18px] text-primary-fixed tracking-widest">
						{String(pct).padStart(3, "0")}%
					</span>
				</div>

				{/* Log stream */}
				<div
					ref={logRef}
					className="p-4 h-56 overflow-y-auto no-scrollbar font-label-caps text-label-caps text-on-surface-variant flex flex-col gap-2"
				>
					{log.map((line, i) => (
						<div
							key={i}
							className={
								line.kind === "complete"
									? "text-primary-fixed"
									: line.kind === "active"
										? "text-primary-fixed animate-pulse"
										: "text-on-surface"
							}
						>
							{line.text}
						</div>
					))}
				</div>

				{/* Progress bar */}
				<div className="p-3 bg-surface-container-lowest border-t border-primary-fixed/20">
					<div className="h-3 w-full bg-black border border-primary-fixed/30 relative overflow-hidden">
						<div
							className="h-full bg-primary-fixed neon-glow-primary transition-all duration-500 ease-out"
							style={{ width: `${pct}%` }}
						/>
					</div>
					<div className="flex justify-between items-center font-label-caps text-[9px] text-on-surface-variant uppercase tracking-tighter mt-2">
						<span>
							STAGE {Math.min(stage + 1, DONE)}/{DONE}
						</span>
						<span className="text-primary-fixed">SIMULATED // NO REAL FILLS</span>
					</div>
				</div>
			</div>

			<p className="font-body-md text-body-md text-on-surface-variant text-center max-w-lg border-l-4 border-secondary pl-4 py-1">
				The research pipeline is fetching universes across active adapters,
				reasoning with Workers AI, and committing simulated fills to the ledger.
			</p>
		</div>
	);
}
