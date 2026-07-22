// Per-user account balances. Each user is their own simulated fund: cash and
// starting capital live here (migration 0004), keyed by user_id.

export const DEFAULT_STARTING_CASH = 100_000;

export interface Account {
	user_id: number;
	starting_cash: number;
	cash: number;
}

// Return the user's account, creating it with the default starting capital if it
// does not exist yet (new users, or users created before the accounts table).
export async function ensureAccount(db: D1Database, userId: number): Promise<Account> {
	await db
		.prepare(
			"INSERT INTO accounts (user_id, starting_cash, cash) VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING",
		)
		.bind(userId, DEFAULT_STARTING_CASH, DEFAULT_STARTING_CASH)
		.run();
	const account = await db
		.prepare("SELECT user_id, starting_cash, cash FROM accounts WHERE user_id = ?")
		.bind(userId)
		.first<Account>();
	// The INSERT above guarantees a row exists.
	return account!;
}

export async function setCash(db: D1Database, userId: number, cash: number): Promise<void> {
	await db.prepare("UPDATE accounts SET cash = ? WHERE user_id = ?").bind(cash, userId).run();
}
