-- Per-user funds: every user is their own simulated account. Cash, positions,
-- trades, NAV history, and the per-market leaderboard are now scoped by user_id
-- so reports reflect each user's own account spending (see PROJECT.md idea log).

-- Per-user account balances. Each user starts with the $100k mandate.
CREATE TABLE IF NOT EXISTS accounts (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  starting_cash REAL NOT NULL DEFAULT 100000,
  cash          REAL NOT NULL DEFAULT 100000,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Backfill an account for every existing user.
INSERT INTO accounts (user_id)
  SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM accounts);

-- Scope positions and trades to a user. Existing global rows (user_id NULL) are
-- orphaned by design: the fund is now per-user and those legacy rows match no
-- account.
ALTER TABLE positions ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE trades ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);

-- NAV snapshots become per-user time series. Recreated to add user_id to the
-- primary key (SQLite can't alter a primary key in place).
DROP TABLE IF EXISTS nav_snapshots;
CREATE TABLE nav_snapshots (
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ts              TEXT NOT NULL DEFAULT (datetime('now')),
  cash            REAL NOT NULL,
  positions_value REAL NOT NULL,
  nav             REAL NOT NULL,
  PRIMARY KEY (user_id, ts)
);

-- Per-market leaderboard becomes per-user (one row per user per adapter).
DROP TABLE IF EXISTS agent_pnl;
CREATE TABLE agent_pnl (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adapter        TEXT NOT NULL,
  realized_pnl   REAL NOT NULL DEFAULT 0,
  unrealized_pnl REAL NOT NULL DEFAULT 0,
  trade_count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, adapter)
);
