-- Hedge Fund of Agents: ACCOUNTS_DB schema (required system-of-record + user data).

-- Required data: fund system of record (see PROJECT.md data model).

CREATE TABLE IF NOT EXISTS config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  adapter    TEXT NOT NULL,
  instrument TEXT NOT NULL,
  qty        REAL NOT NULL,
  avg_price  REAL NOT NULL,
  opened_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trades (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         TEXT NOT NULL DEFAULT (datetime('now')),
  adapter    TEXT NOT NULL,
  instrument TEXT NOT NULL,
  action     TEXT NOT NULL,
  qty        REAL NOT NULL,
  price      REAL NOT NULL,
  thesis     TEXT,
  confidence REAL
);

CREATE TABLE IF NOT EXISTS nav_snapshots (
  ts              TEXT PRIMARY KEY DEFAULT (datetime('now')),
  cash            REAL NOT NULL,
  positions_value REAL NOT NULL,
  nav             REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_pnl (
  adapter        TEXT PRIMARY KEY,
  realized_pnl   REAL NOT NULL DEFAULT 0,
  unrealized_pnl REAL NOT NULL DEFAULT 0,
  trade_count    INTEGER NOT NULL DEFAULT 0
);

-- User data: username-only authentication (no passwords).

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_adapter ON trades(adapter);
CREATE INDEX IF NOT EXISTS idx_positions_adapter ON positions(adapter);
