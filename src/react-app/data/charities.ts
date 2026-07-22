export type Charity = {
	id: string;
	name: string;
	tag: string;
	blurb: string;
	icon: string; // Material Symbols name
};

export const CHARITIES: Charity[] = [
	{
		id: "ocean",
		name: "OCEAN CLEANUP COLLECTIVE",
		tag: "PLANET // OCEANS",
		blurb:
			"Pulls plastic out of the sea and coastlines. Every simulated dollar of yield funds one more net haul.",
		icon: "waves",
	},
	{
		id: "foodbank",
		name: "OPEN SOURCE FOOD BANK",
		tag: "PEOPLE // HUNGER",
		blurb:
			"Turns volatile paper gains into very real meals. Transparent, on-chain-verified distribution.",
		icon: "volunteer_activism",
	},
	{
		id: "rainforest",
		name: "RAINFOREST NODE",
		tag: "PLANET // FORESTS",
		blurb:
			"Protects and replants rainforest by the hectare. Chaos in, carbon capture out.",
		icon: "forest",
	},
];

export function findCharity(id: string | null): Charity | undefined {
	return CHARITIES.find((c) => c.id === id);
}
