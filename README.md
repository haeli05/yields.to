yields.to is a Next.js application that surfaces yield opportunities across the Plasma chain.  
The UI is powered by **shadcn/ui**, Tailwind CSS (v4), and Next.js App Router.

## Running locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the live Plasma strategy dashboard.

## Scripts

- `npm run dev` – start the development server.
- `npm run build` – create a production build.
- `npm run start` – run the production build.
- `npm run lint` – run ESLint with the Next.js config.

## UI toolkit

The project is initialized with shadcn/ui. Common primitives such as `button`, `card`, `badge`, `input`, and `tabs`
are already installed in `src/components/ui`.

To scaffold additional components:

```bash
npx shadcn@latest add <component>
```

The component registry is configured in `components.json`.

## Project structure

- `src/app` – Next.js App Router routes and layouts.
- `src/components/ui` – shared shadcn/ui components.
- `src/lib/utils.ts` – utility helpers used by the UI layer.
- `public` – static assets.

## Plasma yield data sources

| Source | Data provided | Access pattern | Strengths | Limitations / notes |
| --- | --- | --- | --- | --- |
| Stablewatch Plasma Yield Dashboard[^stablewatch] | Ranked list of Plasma yield farms with live TVL, APY, and direct links to Merkl opportunity IDs. | Public web dashboard; exportable by scraping the static JSON rendered client side. | Gives an immediate picture of the highest-yield strategies on Plasma without building your own indexer. | Currently read-only UI; no public REST export yet and rates inherit Merkl’s methodology. |
| DeFiLlama Plasma Saving Vaults API[^defillama-api] | Historical TVL and token mix for Plasma’s flagship vaults. | Free JSON API (`api.llama.fi/protocol/plasma-saving-vaults`). | Easy to automate snapshots, integrates with the wider DeFiLlama dataset. | Only covers the Plasma Saving Vault adapter; additional pools need to be requested or contributed. |
| Dune / Token Terminal / Artemis analytics[^plasma-doc-analytics] | Queryable Plasma chain metrics, including protocol yields once dashboards are authored. | Requires creating dashboards or using existing ones; Dune has SQL, Token Terminal & Artemis offer APIs on paid tiers. | Institutional-grade tooling with charting, alerting, and data hygiene. | Setup time and, for some providers, subscription costs; APY logic must be implemented in queries. |
| Goldsky, Codex, thirdweb Insight, Zerion, Ormi indexers[^plasma-doc-indexers] | Raw Plasma transaction and state data transformed into queryable APIs, SQL, or subgraphs. | Managed indexing services (most offer REST/GraphQL and hosted subgraphs). | Best choice when you need custom yield calculations or to join on protocol-specific events. | Pricing and rate limits vary; you must model vault math yourself to extract APY. |
| Binance Earn Plasma USDT Locked Product[^plasma-binance-article] | Official distribution data for the onchain USD₮ yield product that seeded Plasma liquidity (caps, schedule, incentive split). | Binance Earn UI and announcement feed; program stats accessible via Binance Earn once authenticated. | Direct line into the exchange-native flow that drives the “headline” Plasma yield product. | Requires Binance account for API/UI details; APR is campaign-dependent and not exposed in a public feed. |

Follow-up ideas:
- Prototype a scraper for the Stablewatch dashboard to seed demo data locally.
- Backfill vault TVL from DeFiLlama on a cron to power historical charts.
- Stand up a Goldsky or Codex subgraph targeting the Merkl distributor contracts driving the top-yield pools.

### Key Plasma yield programs

| Protocol | Segment | Primary data source | Observability surface | Notes |
| --- | --- | --- | --- | --- |
| Syrup USD vaults | Structured yield | Stablewatch Plasma Dashboard[^stablewatch] | Merkl opportunity feeds[^merkl] | High-velocity Pendle vault incentives denominated in syrupUSDT; requires combining Stablewatch UI with Merkl emissions JSON. |
| Pendle PT-sUSDe strategies | Structured yield | Stablewatch Plasma Dashboard[^stablewatch] | Goldsky & Codex Pendle subgraphs[^plasma-doc-indexers] | Principal token yields on Ethena collateral bridged to Plasma; subgraphs expose trade, fee, and reward data for custom dashboards. |
| Ethena sUSDe on Aave Plasma | Lending | Aave protocol subgraphs via Goldsky/Codex[^plasma-doc-indexers] | Stablewatch dashboard[^stablewatch] | Captures the dominant Plasma lending market for sUSDe; combine Aave reserve metrics with Stablewatch APY summaries. |
| Plasma Saving Vaults | Stablecoin allocator | DeFiLlama Saving Vaults API[^defillama-api] | API + Stablewatch overview[^stablewatch] | Core onchain treasury product with historical TVL, deposit mix, and performance exposed through an open JSON endpoint. |
| Fluid USDT markets | Lending | Stablewatch Plasma Dashboard[^stablewatch] | Goldsky/Codex indexers[^plasma-doc-indexers] | Native Plasma liquidity market; event-level data comes from indexers while Stablewatch aggregates supply/borrow APY headlines. |
| Binance Earn Plasma USDT | Exchange distribution | Binance Earn announcement feed[^plasma-binance-article] | Binance Earn internal analytics | Exchange-native conduit into Plasma vaults; caps and incentive schedules defined by Binance’s Earn APIs. |

## Deployment

Deploy the app with any platform that supports Next.js (Vercel, Netlify, etc.).  
The default configuration targets Node.js 18+ and includes metadata for the yields.to domain.

### Supabase hourly aggregation

This project can aggregate upstream Plasma data hourly and serve it from Supabase to avoid hammering public APIs.

1) Create a Supabase project and run the schema in `supabase/schema.sql`.

2) Configure env vars (Vercel or local `.env`):

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
AGGREGATOR_SECRET=long-random-string
```

3) Schedule the hourly sync (Vercel Cron example):

```
Path: /api/aggregate/sync
Method: GET
Headers: x-cron-secret: ${AGGREGATOR_SECRET}
Schedule: 0 * * * *  (every hour)
```

The UI reads from Supabase when configured; if unavailable it falls back to the public APIs.

### Sumcap Plasma API ingestion

Endpoint: `GET /api/sumcap/sync`

- Pulls JSON from `https://api-plasma.sumcap.xyz` across key endpoints (see OpenAPI `/openapi.json`) and stores raw payloads in `sumcap_snapshots` with the current hour timestamp.
- Protected by `AGGREGATOR_SECRET` (header `x-cron-secret` or `?secret=` param).

DB table (created by `supabase/schema.sql`):
- `sumcap_snapshots(ts timestamptz, endpoint text, status int, ok bool, payload jsonb, updated_at timestamptz)`

Cron example (hourly):

```
Path: /api/sumcap/sync
Method: GET
Headers: x-cron-secret: ${AGGREGATOR_SECRET}
Schedule: 0 * * * *
```

### KV caching (Vercel KV / Upstash Redis)

To avoid Next.js data cache limits and reduce upstream calls, `/api/yields/plasma` caches the trimmed (top 50) Plasma yields in KV for 15 minutes. If KV is not configured, an in-memory fallback is used.

Set one of the following (Vercel KV or Upstash REST):

```
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
# or
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Keys used:
- `defillama:plasma:yields:top50:v1` – trimmed yields list (15m TTL)
- `stablewatch:plasma:pools:v1` – cached Stablewatch scrape (10m TTL)

### Stablewatch scraper

Endpoint: `GET /api/sources/stablewatch`

- Attempts to scrape `https://plasma.stablewatch.io/` and heuristically extract embedded pool JSON from the app bundle. Results are cached in KV for 10 minutes to be polite.
- Force refresh: `?refresh=1`
- Optional TTL override: `?ttl=600` (in seconds)

Notes:
- Stablewatch does not expose a public JSON API; structure may change. The scraper is defensive: if it cannot find embedded data, it returns an empty array and still caches the result briefly to avoid hammering.

### Source health checks

Endpoint: `GET /api/sources/health`

- Pings primary providers (DeFiLlama chain/protocol/yields, Stablewatch UI, Merkl, Ethena, Pendle) and records results in `source_health` when `SUPABASE_SERVICE_ROLE_KEY` is configured.
- Useful for monitoring upstream availability and whether a provider exposes a usable public API for Plasma.

Optional cron schedule (daily):

```
Path: /api/sources/health
Method: GET
Schedule: 0 3 * * *
```

[^stablewatch]: https://plasma.stablewatch.io/
[^defillama-api]: https://api.llama.fi/protocol/plasma-saving-vaults
[^plasma-doc-analytics]: https://docs.plasma.to/docs/plasma-chain/tools/analytics
[^plasma-doc-indexers]: https://docs.plasma.to/docs/plasma-chain/tools/indexers
[^plasma-binance-article]: https://www.plasma.to/insights/plasma-and-binance-earn
[^merkl]: https://app.merkl.xyz/opportunities/plasma
