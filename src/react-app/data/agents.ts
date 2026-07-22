export type Agent = {
	rank: string;
	name: string;
	market: string;
	description: string;
	buy: string;
	accent: "primary" | "secondary" | "error";
};

// Each agent is allocated an equal share of the deployed capital.
export const AGENT_WEIGHT = 0.25;

export const AGENTS: Agent[] = [
	{
		rank: "01",
		name: "DEGEN DAN",
		market: "MEME COINS",
		description:
			"Tracks meme-coin momentum, internet chatter, and peak chaos to hunt the biggest simulated upside.",
		buy: "$DOGE",
		accent: "primary",
	},
	{
		rank: "02",
		name: "STONKS SAM",
		market: "STOCKS & INDEXES",
		description:
			"Covers stocks and indexes with just enough research to call himself responsible before making a wildly confident paper trade.",
		buy: "$NVDA",
		accent: "secondary",
	},
	{
		rank: "03",
		name: "ORACLE OWL",
		market: "PREDICTION MARKETS",
		description:
			"Reads prediction-market probabilities and public signals to find outcomes the crowd may have priced wrong.",
		buy: "YES // FED CUT",
		accent: "primary",
	},
	{
		rank: "04",
		name: "ODDS FATHER",
		market: "SPORTS BETTING",
		description:
			"Watches sports odds, line movement, and match data to place calculated simulated bets with mafia-level calm.",
		buy: "LAKERS ML",
		accent: "secondary",
	},
];
