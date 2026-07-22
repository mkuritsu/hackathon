import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CHARITIES } from "../data/charities";
import { readAmount } from "../lib/format";

export default function Charity() {
	const navigate = useNavigate();
	const [params] = useSearchParams();
	const amount = readAmount(params.get("amount"));

	const [index, setIndex] = useState(0);
	const [chosen, setChosen] = useState<string | null>(null);
	const [lastAction, setLastAction] = useState<"like" | "skip" | null>(null);

	const deck = CHARITIES;
	const current = deck[index % deck.length];
	const chosenCharity = deck.find((c) => c.id === chosen);

	function advance() {
		setIndex((i) => (i + 1) % deck.length);
	}

	function skip() {
		setLastAction("skip");
		advance();
	}

	function like() {
		setLastAction("like");
		setChosen(current.id);
		advance();
	}

	function finish() {
		if (!chosen) return;
		navigate(`/selling?amount=${amount}&charity=${chosen}`);
	}

	return (
		<div className="px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto flex flex-col items-center gap-6 py-6">
			{/* Header */}
			<div className="text-center relative">
				<div className="absolute -top-4 -right-6 bg-hot-pink text-surface font-label-caps text-label-caps px-2 py-1 sticker-rotate-1 border border-surface z-20 shadow-md">
					SWIPE FOR GOOD
				</div>
				<h1 className="font-headline-xl text-headline-xl md:text-[56px] text-primary-fixed tracking-tight led-text uppercase leading-none">
					CHARITY TINDER
				</h1>
				<p className="font-label-caps text-label-caps text-secondary-fixed-dim mt-2">
					MATCH THE CAUSE THAT GETS YOUR SIMULATED YIELD
				</p>
			</div>

			{/* Card */}
			<div className="w-full max-w-md relative">
				<div
					className={`bg-surface-container border-2 border-primary-fixed p-1 noise-bg relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${lastAction === "like" ? "sticker-rotate-2" : lastAction === "skip" ? "sticker-rotate-1" : ""}`}
				>
					<div className="bg-surface-container-lowest border-b-2 border-primary-fixed p-3 flex justify-between items-center">
						<span className="font-label-caps text-[11px] text-primary-fixed tracking-tighter">
							{current.tag}
						</span>
						<span className="font-label-caps text-[11px] text-on-surface-variant">
							{(index % deck.length) + 1}/{deck.length}
						</span>
					</div>

					<div className="p-6 flex flex-col items-center text-center gap-4 min-h-[19rem] justify-center">
						<span
							className="material-symbols-outlined text-primary-fixed"
							style={{ fontSize: "72px", fontVariationSettings: "'FILL' 1" }}
						>
							{current.icon}
						</span>
						<h2 className="font-headline-lg text-headline-lg text-on-surface uppercase leading-none">
							{current.name}
						</h2>
						<p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
							{current.blurb}
						</p>
						{chosen === current.id && (
							<span className="font-label-caps text-label-caps text-primary-fixed border border-primary-fixed px-3 py-1">
								MATCHED
							</span>
						)}
					</div>
				</div>

				{/* Swipe actions */}
				<div className="flex justify-center gap-6 mt-6">
					<button
						type="button"
						onClick={skip}
						aria-label="Skip"
						className="w-16 h-16 flex items-center justify-center border-2 border-error text-error bg-surface hover:bg-error hover:text-on-error transition-colors active:scale-95"
					>
						<span className="material-symbols-outlined text-[32px]">close</span>
					</button>
					<button
						type="button"
						onClick={like}
						aria-label="Like"
						className="w-16 h-16 flex items-center justify-center border-2 border-primary-fixed text-primary-fixed bg-surface hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors active:scale-95 neon-glow-primary"
					>
						<span
							className="material-symbols-outlined text-[32px]"
							style={{ fontVariationSettings: "'FILL' 1" }}
						>
							favorite
						</span>
					</button>
				</div>
			</div>

			{/* Chosen + finish */}
			<div className="w-full max-w-md flex flex-col gap-3 items-center">
				<div className="font-label-caps text-label-caps text-on-surface-variant uppercase text-center">
					{chosenCharity ? (
						<>
							CAUSE LOCKED:{" "}
							<span className="text-primary-fixed">{chosenCharity.name}</span>
						</>
					) : (
						"TAP THE HEART TO MATCH A CAUSE"
					)}
				</div>
				<button
					type="button"
					onClick={finish}
					disabled={!chosen}
					className="w-full border-2 border-primary-fixed bg-surface text-primary-fixed font-headline-lg text-headline-lg py-4 uppercase hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors active:scale-95 neon-glow-primary disabled:opacity-40 disabled:cursor-not-allowed"
				>
					FINISH THE BETS
				</button>
			</div>
		</div>
	);
}
