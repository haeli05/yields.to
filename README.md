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

## Deployment

Deploy the app with any platform that supports Next.js (Vercel, Netlify, etc.).  
The default configuration targets Node.js 18+ and includes metadata for the yields.to domain.

[^stablewatch]: https://plasma.stablewatch.io/
[^defillama-api]: https://api.llama.fi/protocol/plasma-saving-vaults
[^plasma-doc-analytics]: https://docs.plasma.to/docs/plasma-chain/tools/analytics
[^plasma-doc-indexers]: https://docs.plasma.to/docs/plasma-chain/tools/indexers
[^plasma-binance-article]: https://www.plasma.to/insights/plasma-and-binance-earn
