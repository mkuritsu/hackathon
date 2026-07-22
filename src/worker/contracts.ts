// Shared cross-team contracts. Changing these is a team-wide decision
// (see AGENTS.md). The analyst produces a Pitch; the DO sizes and commits it.

export type Action = "buy" | "sell" | "hold";

// The analyst's output. Note: no size — the DO derives size from confidence.
export interface Pitch {
	adapter: string;
	instrument: string;
	action: Action;
	confidence: number; // 0..1
	thesis: string;
}

// Portfolio snapshot the DO passes into research so the analyst can reason
// about holds/averaging. Position is per-instrument for the one being analyzed.
export interface PortfolioContext {
	cash: number;
	nav: number;
	position?: {
		qty: number;
		avgPrice: number;
		unrealizedPnl: number;
	};
}

// Storage seam: research depends on this, not on D1 directly, so the AI slice
// runs and demos before the DB binding exists. Swap MemoryPitchStore for
// D1PitchStore once ACCOUNTS_DB is wired.
export interface PitchStore {
	save(cycleId: string, pitches: Pitch[]): Promise<void>;
}

export class MemoryPitchStore implements PitchStore {
	readonly saved: { cycleId: string; pitches: Pitch[] }[] = [];

	async save(cycleId: string, pitches: Pitch[]): Promise<void> {
		this.saved.push({ cycleId, pitches });
	}
}
