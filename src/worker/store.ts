import type { Pitch, PitchStore } from "./contracts";

// D1-backed pitch store. Writes to the shared ACCOUNTS_DB (pitches table,
// migration 0003). The DO reads pitches by cycle_id.
export class D1PitchStore implements PitchStore {
	constructor(private readonly db: D1Database) {}

	async save(cycleId: string, pitches: Pitch[]): Promise<void> {
		if (pitches.length === 0) {
			return;
		}
		const stmt = this.db.prepare(
			`INSERT INTO pitches (cycle_id, adapter, instrument, action, confidence, thesis)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		);
		await this.db.batch(
			pitches.map((p) => stmt.bind(cycleId, p.adapter, p.instrument, p.action, p.confidence, p.thesis)),
		);
	}
}
