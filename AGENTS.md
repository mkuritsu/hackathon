# Agent Instructions — Hedge Fund of Agents

Project-specific rules for working in this repo. `PROJECT.md` is the source of
truth for product scope; `GIT_HYGIENE.md` is the source of truth for branching.
Read both.

## What this project is
An autonomous, fully-simulated trading desk built to **maximize use of Cloudflare
products**. AI agents research many markets (crypto, stocks, ETFs, options,
prediction markets, sports, etc.) via one universal adapter, place mock trades,
track P&L, and email a daily report. See `PROJECT.md`.

## Hard constraints (do not violate)
- **Simulated only.** No real money, no real broker, no live order execution.
- **Free only.** Only free / free-tier data sources and APIs. No paid keys.
- **Cloudflare-first.** Prefer the 10 canonical products in `PROJECT.md`
  (Workers AI, D1, Email, Workflows, Workers, Pages, R2, Browser Rendering,
  Containers, Durable Objects). Don't pull in non-Cloudflare infra without a
  strong reason.
- **`main` is always demoable.** Never push directly to `main`. It must always
  build and run. See `GIT_HYGIENE.md`.

## Architecture guardrails
- Every market implements the `MarketAdapter` interface
  (`getUniverse/getQuote/getContext/simulateFill`). Add a market = add an
  adapter; never fork the analyst, ledger, or reporting per asset class.
- Durable Object = live fund brain + coordination + WebSocket to Pages.
  Workflows = durable research pipelines. State of record lives in **D1**.
- Analyst returns the pitch contract `{action, size, confidence, thesis}`.
- Keep the 4 shared contracts stable (adapter interface, D1 schema, JSON API
  shape, pitch object). Changing them is a team-wide decision.

## Git workflow
- Work on a per-person branch off `staging`; open an MR into `staging`.
- Commits need **no approval**. **MRs need approval/review** (especially the
  `staging -> main` promotion). Use `glab` (see `GIT_HYGIENE.md`).
- Keep commit subjects short and one-line.

## Style
- TypeScript + Wrangler. Comment sparingly (only non-obvious reasoning).
- No em dashes in output or files.
- When you add or change scope, update `PROJECT.md` (and its idea log) in the
  same change.
