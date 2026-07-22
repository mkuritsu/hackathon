import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatUSD, readAmount } from "../lib/format";

const SYMBOLS = ["7", "$", "W", "★", "◆", "▲"];
const SPIN_MS = 2600;
const JACKPOT: [string, string, string] = ["7", "7", "7"];

function randomSymbol(): string {
	return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

export default function Slot() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const amount = readAmount(params.get("amount"));
	const charity = params.get("charity") ?? "";
	const final = readAmount(params.get("final"), amount);

	const [reels, setReels] = useState<[string, string, string]>(["7", "$", "W"]);
	const [spinning, setSpinning] = useState(true);

	useEffect(() => {
		const cycle = setInterval(() => {
			setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
		}, 90);

		// Always lands on triple seven.
		const stop = window.setTimeout(() => {
			clearInterval(cycle);
			setReels(JACKPOT);
			setSpinning(false);
		}, SPIN_MS);

		return () => {
			clearInterval(cycle);
			clearTimeout(stop);
		};
	}, []);

	function seeResults() {
		const q = new URLSearchParams({
			amount: String(amount),
			charity,
			final: String(final),
		});
		navigate(`/overview?${q.toString()}`);
	}

	return (
		<div className="px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto flex flex-col items-center gap-8 py-10">
			<div className="text-center relative">
				<div className="absolute -top-4 -right-8 bg-hot-pink text-surface font-label-caps text-label-caps px-2 py-1 sticker-rotate-2 border border-surface z-20 shadow-md">
					HOUSE OF CHAOS
				</div>
				<h1 className="font-headline-xl text-headline-xl md:text-[56px] text-primary-fixed tracking-tight led-text uppercase leading-none">
					THE RECKONING
				</h1>
				<p className="font-label-caps text-label-caps text-secondary-fixed-dim mt-2">
					{spinning ? "SPINNING THE WHEEL OF FATE..." : "THE MARKET HAS SPOKEN"}
				</p>
			</div>

			{/* Slot cabinet */}
			<div className="w-full max-w-lg bg-surface-container border-2 border-primary-fixed p-1 noise-bg shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
				<div className="bg-surface-container-lowest border-b-2 border-primary-fixed p-3 flex justify-between items-center">
					<span className="font-label-caps text-[11px] text-primary-fixed tracking-tighter">
						SLOT_777 // SIMULATED
					</span>
					<span
						className={`font-label-caps text-[11px] ${spinning ? "text-on-surface-variant animate-pulse" : "text-primary-fixed"}`}
					>
						{spinning ? "RUNNING" : "JACKPOT"}
					</span>
				</div>

				<div className="p-6 flex justify-center gap-3 bg-black">
					{reels.map((sym, i) => (
						<div
							key={i}
							className={`w-24 h-32 md:w-28 md:h-36 flex items-center justify-center border-2 bg-surface-container-lowest font-financial-display text-[64px] md:text-[72px] ${
								spinning
									? "border-primary-fixed/40 text-on-surface animate-pulse"
									: "border-primary-fixed text-primary-fixed led-text neon-glow-primary"
							}`}
						>
							{sym}
						</div>
					))}
				</div>

				{/* Result banner */}
				<div className="p-4 bg-surface-container-lowest border-t-2 border-primary-fixed text-center">
					{spinning ? (
						<span className="font-label-caps text-label-caps text-on-surface-variant animate-pulse">
							LET IT RIDE...
						</span>
					) : (
						<div className="flex flex-col gap-1">
							<span className="font-headline-lg text-headline-lg text-primary-fixed uppercase led-text">
								TRIPLE SEVEN // YOU MADE MONEY
							</span>
							<span className="font-financial-display text-financial-display text-primary-fixed">
								{formatUSD(final)}{" "}
								<span className="text-on-surface-variant text-[14px]">
									(+{formatUSD(final - amount)})
								</span>
							</span>
						</div>
					)}
				</div>
			</div>

			<button
				type="button"
				onClick={seeResults}
				disabled={spinning}
				className="w-full max-w-md border-2 border-primary-fixed bg-surface text-primary-fixed font-headline-lg text-headline-lg py-4 uppercase flex items-center justify-center gap-3 hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors active:scale-95 neon-glow-primary disabled:opacity-40 disabled:cursor-not-allowed group"
			>
				SEE FULL RECAP
				<span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
					arrow_forward
				</span>
			</button>
		</div>
	);
}
