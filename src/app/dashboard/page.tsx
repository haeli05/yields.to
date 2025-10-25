import type { Metadata } from "next";

import { PlasmaYieldDashboard, type DashboardPool } from "@/components/plasma-yield-dashboard";
import { loadPlasmaYields, type PlasmaYieldPool } from "@/lib/plasma-yields";

const PROJECT_CATEGORY_MAP: Record<string, "DeFi" | "RWA" | "Protocol"> = {
  "plasma saving vaults": "Protocol",
  "plasma usd vault": "Protocol",
  pendle: "DeFi",
  "pendle plasma": "DeFi",
  fluid: "DeFi",
  aave: "DeFi",
  ethena: "DeFi",
  "ethena plasma": "DeFi",
  "plasma rwa": "RWA",
  "usd0": "RWA",
};

const detectCategory = (project: string): "DeFi" | "RWA" | "Protocol" => {
  const normalized = project.toLowerCase();
  const direct = PROJECT_CATEGORY_MAP[normalized];
  if (direct) return direct;

  if (normalized.includes("rwa")) return "RWA";
  if (normalized.includes("protocol")) return "Protocol";
  return "DeFi";
};

const detectAssets = (symbol: string, project: string) => {
  const searchText = `${symbol} ${project}`;

  // Check for specific assets in order of specificity (more specific first)
  const assets: string[] = [];

  // Check for compound tokens first (e.g., USD0++ before USD0)
  if (/USD0\+\+/i.test(searchText)) assets.push("USD0++");
  else if (/USD0/i.test(searchText)) assets.push("USD0");

  // Check for USDT0
  if (/USDT0/i.test(searchText)) assets.push("USDT0");

  // Check for Ethena tokens
  if (/sUSDe/i.test(searchText)) assets.push("sUSDe");
  else if (/USDe/i.test(searchText)) assets.push("USDe");

  // Check for Sky tokens
  if (/sUSDS/i.test(searchText)) assets.push("sUSDS");
  else if (/USDS/i.test(searchText)) assets.push("USDS");

  // Check for stablecoins
  if (/USDT/i.test(searchText)) assets.push("USDT");
  if (/USDC/i.test(searchText)) assets.push("USDC");
  if (/DAI/i.test(searchText)) assets.push("DAI");

  // Check for ETH variants
  if (/WETH/i.test(searchText)) assets.push("WETH");
  else if (/\bETH\b/i.test(searchText)) assets.push("ETH");

  // Check for BTC variants
  if (/WBTC/i.test(searchText)) assets.push("WBTC");
  else if (/\bBTC\b/i.test(searchText)) assets.push("BTC");

  // Check for XPL
  if (/XPL/i.test(searchText)) assets.push("XPL");

  return assets.length > 0 ? assets : ["Other"];
};

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Interactive Plasma yield dashboard powered by DeFiLlama data.",
};

export default async function DashboardPage() {
  let apiData: PlasmaYieldPool[] = [];
  try {
    const { data } = await loadPlasmaYields();
    apiData = data;
  } catch {
    // swallow and show empty dataset
  }

  const pools = (apiData ?? [])
    .filter((pool) => pool.chain === "Plasma")
    .map<DashboardPool>((pool) => {
      const project = pool.project || "Unknown";
      const symbol = pool.symbol || "—";
      const id = pool.pool || `${project}:${symbol}`;
      const assets = detectAssets(symbol, project);
      return {
        id,
        pool: pool.pool || project,
        project,
        symbol,
        tvlUsd: pool.tvlUsd ?? 0,
        apy: pool.apy ?? null,
        apyBase: pool.apyBase ?? null,
        apyReward: pool.apyReward ?? null,
        apyPct1d: pool.apyPct1D ?? null,
        apyPct7d: pool.apyPct7D ?? null,
        apyPct30d: pool.apyPct30D ?? null,
        apyMean30d: pool.apyMean30d ?? null,
        il7d: pool.il7d ?? null,
        volumeUsd1d: pool.volumeUsd1d ?? null,
        volumeUsd7d: pool.volumeUsd7d ?? null,
        url: pool.url ?? null,
        rewardTokens: pool.rewardTokens ?? null,
        category: detectCategory(project),
        assets,
      };
    })
    .sort((a, b) => b.tvlUsd - a.tvlUsd);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:px-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Plasma Yield Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Live yield data sourced from the DeFiLlama public API. Filter by asset,
          category, or keyword to discover the most compelling opportunities on
          the Plasma chain.
        </p>
      </div>

      <PlasmaYieldDashboard pools={pools} />
    </main>
  );
}
