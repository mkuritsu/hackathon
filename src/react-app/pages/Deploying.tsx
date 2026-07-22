import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as api from "../lib/api";

// Console flavour stages. The animation advances on a timer but pauses at the
// last stage until the real ResearchWorkflow reports "complete".
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
const POLL_MS = 1500;
const DONE = STAGES.length;

export default function Deploying() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const amount = params.get("amount") ?? "";
	const id = params.get("id") ?? "";
	// stage counts completed stages: 0..STAGES.length (DONE means finished)
	const [stage, setStage] = useState(0);
	const [done, setDone] = useState(false);
	// Missing id (deep-link without starting a run) is a failure from the start.
	const [failed, setFailed] = useState(!id);
	const logRef = useRef<HTMLDivElement>(null);

	// Poll the real workflow status until it finishes (or errors).
	useEffect(() => {
		if (!id) {
			return;
		}
		let cancelled = false;
		const tick = async () => {
			try {
				const res = await api.getResearch(id);
				const status = res.status?.status ?? "";
				if (cancelled) return;
				if (status === "complete") {
					setDone(true);
				} else if (status === "errored" || status === "terminated") {
					setFailed(true);
				}
			} catch {
				// transient errors are fine; keep polling
			}
		};
		void tick();
		const poll = setInterval(tick, POLL_MS);
		return () => {
			cancelled = true;
			clearInterval(poll);
		};
	}, [id]);

	// Visual stage animation: advance until the penultimate stage, then hold on
	// the final stage until the workflow actually completes.
	useEffect(() => {
		const anim = setInterval(() => {
			setStage((s) => Math.min(s + 1, done ? DONE : DONE - 1));
		}, STAGE_MS);
		return () => clearInterval(anim);
	}, [done]);

	// Once complete AND the animation has caught up, route to the arena.
	useEffect(() => {
		if (done && stage >= DONE) {
			const next = amount ? `/arena?amount=${amount}` : "/arena";
			const t = window.setTimeout(() => navigate(next, { replace: true }), 700);
			return () => clearTimeout(t);
		}
	}, [done, stage, amount, navigate]);

	// Derive the console log from the stage counter (no extra state).
	const log: { text: string; kind: "done" | "active" | "complete" | "error" }[] = [];
	for (let i = 0; i < Math.min(stage, DONE); i++) {
		log.push({ text: `> ${STAGES[i]}... OK`, kind: "done" });
	}
	if (failed) {
		log.push({ text: "> RESEARCH PIPELINE FAILED. RETURN TO DESK.", kind: "error" });
	} else if (stage < DONE) {
		log.push({ text: `> ${STAGES[stage]}...`, kind: "active" });
	} else {
		log.push({
			text: "> DEPLOYMENT COMPLETE. ROUTING TO ARENA.",
			kind: "complete",
		});
	}

	useEffect(() => {
		logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
	}, [stage, failed]);

	const pct = failed ? 100 : Math.round((stage / DONE) * 100);

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
								line.kind === "error"
									? "text-error"
									: line.kind === "complete"
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

			{failed && (
				<button
					type="button"
					onClick={() => navigate("/allocate", { replace: true })}
					className="border-2 border-error text-error bg-surface font-headline-lg text-headline-lg px-8 py-3 uppercase hover:bg-error hover:text-on-error transition-colors"
				>
					RETURN TO DESK
				</button>
			)}
		</div>
	);
}
