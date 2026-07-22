# Hedge Fund of Agents — Project Knowledge Base

> Autonomous, self-directed trading desk running entirely on Cloudflare.
> Give it fake capital and a mandate ("make money"); a team of AI agents
> hunts opportunities across every market we can find a free feed for.
> All trades simulated. Fully autonomous. This doc is the living source of truth.

## One-liner
"We gave AI agents a fake $100k and told them to get rich. Here's the desk they built."

## Guiding principles
- **Cloudflare-maximalist**: use as many CF products as make honest sense.
- **Everything is simulated**: no real money, no real broker. Mock fills.
- **Everything must be free**: only free / free-tier data sources.
- **Fully autonomous**: no human in the loop; runs on a schedule.
- **Breadth via one abstraction**: every market is "just one more adapter."
- **Hackathon scope**: ship the spine end-to-end, prove extensibility with stubs.
- **main is always demoable**: prod branch must always build and run (see GIT_HYGIENE.md).

---

## Product framing (locked)
- Framing: **one smart analyst agent, many markets** (not multi-agent negotiation
  drama — kept simple deliberately).
- Markets: **all of them are just "one more agent/adapter"** — meme coins/crypto,
  stocks, ETFs, options, prediction markets (Polymarket), sports betting, and
  outlandish/novel markets. Ship the spine + as many adapters as time allows.
- Winning metric: **total P&L + per-agent (per-market) leaderboard.**
  Headline = "started at $100k, now worth $X"; leaderboard ranks which
  market/adapter made the most money.

---

## Canonical Cloudflare products (the 10, locked)
| # | Product | Role in the bot |
|---|---|---|
| 1 | **Workers AI** | Analyst reasoning → structured pitches `{action,size,confidence,thesis}` |
| 2 | **D1** | System of record: positions, trades, nav_snapshots, agent_pnl (leaderboard) |
| 3 | **Email** | End-of-day report send (Email Routing binding) |
| 4 | **Workflows** | Durable research pipelines: fetch → context → reason → score → simulate fill |
| 5 | **Workers** | API, cron heartbeat, glue |
| 6 | **Pages** | Frontend dashboard (team's Figma build) |
| 7 | **R2** | Generated charts/images + (future) video recaps |
| 8 | **Browser Rendering** | HTML → **PDF** daily report (with embedded charts) |
| 9 | **Containers** | **FFmpeg** video pipeline — scaffolded but deferred (no video content yet) |
| 10 | **Durable Objects** | The live "fund brain": hot state, coordinates the loop, kicks off Workflows, serves WebSocket to Pages |
| 11 | **KV** | Centralized model registry (`MODELS` namespace, key `models`): declare/read model ids once, swap models via config not code |

> Deliberately not in scope (to keep the list curated): Queues, Vectorize,
> AI Gateway, MCP. Workflows owns orchestration + durability; D1 holds all state;
> cron is a Workers feature (implicit).

### Local dev / accounts (per-person)
- Each dev uses their own Cloudflare account: `wrangler login`, then wrangler
  targets it. Local dev uses local D1/KV, so the resource ids in
  `wrangler.jsonc` (D1 `database_id`, KV `id`) are ignored with `--local`.
- The `AI` binding always connects to a **remote** account even in local dev,
  so you must be logged into an account with Workers AI.
- Resource ids committed in `wrangler.jsonc` point at individual dev accounts
  for now; consolidate to one account before the shared demo deploy.

---

## Architecture

### How Durable Objects + Workflows coexist
- **Durable Object = the CIO brain.** Persistent live state, the autonomous
  heartbeat (DO alarm), coordination, and a WebSocket feed for the Pages
  dashboard. Writes durable facts to **D1**.
- **Workflows = the research muscle.** For each candidate market/instrument, the
  DO starts a Workflow that durably runs fetch → context → Workers AI reasoning →
  score, with retries. Returns a pitch to the DO, which applies risk sizing and
  commits a simulated trade to D1.
- **Cron (Workers)** pokes the DO on schedule; DO alarms handle intra-cycle
  follow-ups.

### The universal market adapter (core idea)
Every market implements one interface, so adding an asset class = one adapter.
The analyst, risk logic, ledger, leaderboard, and reporting never change.

```ts
interface MarketAdapter {
  id: string;                       // "crypto", "polymarket", "stocks", ...
  getUniverse(): Instrument[];      // candidate instruments to consider
  getQuote(id): Quote;              // current price / odds / implied prob
  getContext(id): Context;          // news, stats, whatever's relevant
  simulateFill(order): Fill;        // price we "got"; feeds the ledger
}
```

Live adapter #1 = crypto (CoinGecko). Stub others (Polymarket, stocks/ETFs,
options, sports) for breadth to prove extensibility.

### Agent design (simplified: one analyst, many markets)
- **CIO / Orchestrator (DO)** — fund state (cash, positions, mandate, narrative),
  autonomous loop, risk sizing, commits simulated trades.
- **Analyst (reusable, Workflow step)** — given any adapter + instrument, pulls
  data + context, reasons with Workers AI, returns a pitch
  `{ action: buy|sell|hold, size, confidence, thesis }`.
- **Risk sizing** — simple guardrails (cash-only, per-position cap) before commit.

---

## Media / reporting pipeline
- Daily cron **and** manual `POST /report/run` (for live demo) trigger the report.
- Query D1 → generate chart images (P&L curve, leaderboard) → store in **R2**.
- **Browser Rendering** renders a branded HTML report → **PDF** (trades,
  per-trade & per-market P&L, EOD NAV vs prior day, leaderboard, embedded R2
  charts) → store in R2.
- **Email** (Email Routing binding) sends the PDF + headline numbers to the
  recipient. Recipient must be a verified Email Routing destination address.
- **Containers/FFmpeg**: pipeline scaffolded, video content TBD (deferred).

---

## Data model (D1, draft)
- `accounts(user_id, starting_cash, cash, created_at)` — per-user fund balance
- `positions(id, user_id, adapter, instrument, qty, avg_price, opened_at)`
- `trades(id, user_id, ts, adapter, instrument, action, qty, price, thesis, confidence)`
- `nav_snapshots(user_id, ts, cash, positions_value, nav)` — per-user P&L over time
- `agent_pnl(user_id, adapter, realized_pnl, unrealized_pnl, trade_count)` — per-user leaderboard
- `config(key, value)` — mandate, cadence (global)

> Per-user funds (migration 0004): each registered user is their own simulated
> fund starting at $100k. Cash, positions, trades, NAV history, and the
> per-market leaderboard are all scoped by `user_id`, and reports are generated,
> stored in R2 (`report-{userId}-{date}.pdf`), and emailed per account.

---

## Autonomous loop
1. Cron fires → pokes the DO brain.
2. DO selects universes across active adapters.
3. For each candidate, DO starts a Workflow: fetch → context → Workers AI reason → score.
4. Workflow returns pitch; DO applies risk sizing.
5. `simulateFill` → update D1 ledger; write NAV snapshot.
6. DO alarm schedules the next follow-up / cycle.

---

## Scope plan
- **Spine (must ship)**: DO brain, Workflows research pipeline, adapter interface,
  D1 ledger, autonomous loop, JSON API, daily report (charts → R2 → PDF → Email).
- **Live adapters (target 2)**: crypto (CoinGecko) + Polymarket (freest + fun).
- **Stubbed adapters**: stocks/ETFs, options, sports — prove extensibility.
- **Deferred**: Containers/FFmpeg video content.

## Data sources (all free / free-tier)
- Crypto: CoinGecko / DEX screeners (no or free key).
- Prediction: Polymarket public API.
- Stocks/ETFs: a free market-data tier (TBD).
- Sports odds: free odds feed (flaky; TBD).
- News: one free news API key + Browser Rendering scraping.

## Stack
- Fresh Cloudflare Workers project, TypeScript, Wrangler.
- Frontend: separate Pages build (team's Figma). This repo exposes a clean JSON
  API (+ optional DO WebSocket).

---

## Team & responsibilities (4 people)
Nail the shared contracts first so everyone builds in parallel against stubs.

- **Backend / Platform** — Cloudflare plumbing + data contracts everyone depends on.
  DO brain, Workflows, D1 schema, adapter interface + `simulateFill`, cron, JSON
  API. Owns the reporting pipeline (R2 charts + Browser Rendering PDF + Email).
  Ships D1 schema + API contract first so others can mock.
- **AI / Agents** — analyst prompts, Workers AI wiring, structured pitch output,
  adapter `getContext` data-fetching, risk-sizing heuristic, reasoning quality.
- **Frontend** — Pages dashboard against the JSON API (+ optional DO WebSocket).
  Builds against a mock API from day one.
- **Product / Presentation** — maintains this `PROJECT.md`, validates which free
  feeds actually work, scripts the live demo (incl. firing the report on stage),
  builds slides, floats to gaps. Owns the deferred video idea if time allows.

## Shared contracts (define hour 1, together)
1. **`MarketAdapter` interface** — unblocks AI + Backend.
2. **D1 schema** (`positions`, `trades`, `nav_snapshots`, `agent_pnl`) — unblocks reporting + API.
3. **JSON API shape** (`/portfolio`, `/trades`, `/decisions`, `/leaderboard`) — unblocks Frontend.
4. **Pitch object** `{action, size, confidence, thesis}` — the AI↔Backend handoff.

## Rough phasing
- **Phase 0 (all, ~30 min):** agree the 4 contracts.
- **Phase 1 (parallel):** BE builds DO+D1+API+Workflows; AI builds analyst vs stub adapter; FE builds vs mock JSON; Product locks data sources + demo script.
- **Phase 2 (integrate):** wire real crypto adapter → analyst → ledger → API → FE.
- **Phase 3:** reporting pipeline (charts → R2 → PDF → Email) + leaderboard + 1-2 stub adapters.
- **Phase 4:** polish, seed demo scenario, rehearse (fire `POST /report/run` live).

---

## Execution order
1. `PROJECT.md` + `GIT_HYGIENE.md` (this).
2. Lock the 4 contracts.
3. Scaffold Workers project + `wrangler.jsonc` bindings for all 10 products.
4. Spine: DO brain + D1 + crypto adapter + analyst Workflow + autonomous loop.
5. Reporting: charts → R2 → Browser Rendering PDF → Email, with `POST /report/run`.
6. JSON API + stub adapters for breadth; scaffold Containers/FFmpeg placeholder.

---

## Open questions / TODO
- Heartbeat: confirm Cron → DO alarm cadence for the demo.
- Which free stock + sports feeds actually work.
- Email: verified Email Routing destination + routed domain.
- Video concept for the Containers/FFmpeg pipeline (deferred).

## Idea log (append-only — throw ideas here)
- [seed] Universal market adapter so "everything is just one more agent."
- [seed] Per-market leaderboard as a demo hook.
- [seed] Daily end-of-day email: trades, per-trade P&L, EOD balance.
- [seed] Daily PDF report via Browser Rendering with embedded R2 charts.
- [seed] Deferred: Containers/FFmpeg daily recap video stored in R2.
- [added] KV model registry: centralize model ids in KV so models are swappable
  via config, not code (also one more Cloudflare product). GET /api/models.
- [added] One analyst impl run as 4 market-scoped instances (crypto/meme,
  stocks, prediction, sports) with per-market personas; one free source each
  (CoinGecko, Yahoo, Polymarket, ESPN). Orchestrator ranks non-hold pitches by
  confidence into "final calls".
- [added] Execution model (POC): a single frontend button press triggers one
  research cycle that executes the final buy/sells immediately (confidence-scaled
  sizing) into D1 (positions/trades/cash), then holds. GET /api/portfolio feeds
  the frontend from D1 (cash, positions, cost-basis NAV, trades).
- [added] Per-user funds (migration 0004): every registered user is their own
  simulated fund ($100k start). Cash/positions/trades/NAV/leaderboard are scoped
  by user_id; research trades into the caller's account; /api/portfolio and all
  report routes are auth-scoped. Reports are generated + stored in R2 as
  `report-{userId}-{date}.pdf` and emailed to each user (their own only).
- [future] End-of-month liquidation + final report: NOT implemented
  (ledger.liquidateAndReport is a stub). Mark-to-market NAV also future.
