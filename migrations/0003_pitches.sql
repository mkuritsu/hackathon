-- Pitches: analyst output per research cycle. Written by the ResearchWorkflow,
-- read by the DO brain (which sizes + commits trades). Owned by the AI slice.

CREATE TABLE IF NOT EXISTS pitches (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_id   TEXT NOT NULL,
  ts         TEXT NOT NULL DEFAULT (datetime('now')),
  adapter    TEXT NOT NULL,
  instrument TEXT NOT NULL,
  action     TEXT NOT NULL,
  confidence REAL NOT NULL,
  thesis     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pitches_cycle ON pitches(cycle_id);
