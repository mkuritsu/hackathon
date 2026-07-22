-- Required config: fund mandate and defaults (see PROJECT.md).

INSERT INTO config (key, value) VALUES
  ('mandate', 'Make money. Hunt opportunities across every market with a free feed. All trades simulated.'),
  ('starting_cash', '100000'),
  ('cash', '100000'),
  ('cadence', 'daily'),
  ('recipients', '[]')
ON CONFLICT(key) DO NOTHING;
