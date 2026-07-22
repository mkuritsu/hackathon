const FOOTER_ITEMS = [
	{ label: "SYS_STATUS: OPERATIONAL", cls: "" },
	{ label: "VOLATILITY: EXTREME", cls: "" },
	{ label: "ACTIVE_AGENTS: 1,402", cls: "" },
	{ label: "UPTIME: 99.99%", cls: "" },
	{ label: "CHARITY_TOTAL: $22,109,241.00", cls: "text-secondary" },
];

export default function Footer() {
	return (
		<footer className="fixed bottom-0 left-0 w-full z-40 bg-surface">
			<div className="ticker-wrap h-8 flex items-center border-t-2 border-b-0 border-primary-fixed">
				<div
					className="ticker font-label-caps text-label-caps"
					style={{ animationDirection: "reverse", animationDuration: "25s" }}
				>
					{[...FOOTER_ITEMS, ...FOOTER_ITEMS].map((item, i) => (
						<span key={i} className={`ticker-item ${item.cls}`}>
							{item.label}
						</span>
					))}
				</div>
			</div>
		</footer>
	);
}
