import { Link } from "react-router-dom";

const TICKER_ITEMS = [
	{ label: "AGENT_ALPHA: +420.69%", loss: false },
	{ label: "AGENT_BETA: -18.4%", loss: true },
	{ label: "POOL_TVL: $1.33B", loss: false },
	{ label: "CHARITY_YIELD: $2.4M", loss: false },
	{ label: "SHORTS_REKT: 42.1K", loss: true },
];

export default function Header() {
	return (
		<header className="fixed top-0 left-0 w-full z-40 bg-surface">
			{/* Top stats ticker */}
			<div className="ticker-wrap h-8 flex items-center">
				<div className="ticker font-label-caps text-label-caps">
					{[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
						<span
							key={i}
							className={`ticker-item${item.loss ? " loss" : ""}`}
						>
							{item.label}
						</span>
					))}
				</div>
			</div>

			{/* Nav bar */}
			<div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 border-b-2 border-primary-fixed bg-surface noise-bg">
				<Link to="/" className="flex items-center gap-2 group">
					<span
						className="material-symbols-outlined text-primary-fixed"
						style={{ fontVariationSettings: "'FILL' 1" }}
					>
						sensors
					</span>
					<h1 className="font-headline-lg text-headline-lg text-primary-fixed italic uppercase m-0 leading-none">
						W YIELDS
					</h1>
				</Link>

				<div className="hidden lg:flex font-label-caps text-[10px] text-on-surface-variant gap-6 uppercase tracking-widest">
					<span>Infrastructure: Verified</span>
					<span>Oracle: Latency 14ms</span>
					<span>Protocol: V2.4.0</span>
				</div>

				<div className="flex items-center gap-4">
					<button
						type="button"
						className="hidden sm:block font-label-caps text-label-caps text-primary-fixed border border-primary-fixed/30 px-3 py-1 hover:bg-primary-fixed/10 transition-all"
					>
						CONNECT WALLET
					</button>
					<button
						type="button"
						className="material-symbols-outlined text-primary-fixed hover:bg-primary-fixed hover:text-on-primary-fixed p-2 transition-all"
					>
						menu
					</button>
				</div>
			</div>
		</header>
	);
}
