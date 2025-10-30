import type { Metadata } from "next";

import { PlasmaYieldDashboard, type DashboardPool } from "@/components/plasma-yield-dashboard";
import { loadPlasmaYields, type PlasmaYieldPool } from "@/lib/plasma-yields";
import { loadPendlePools } from "@/lib/pendle";
import type { ChateauMetrics } from "@/app/api/yields/chateau/route";

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

  // Check for LP pairs with mixed assets (e.g., WXPL-USDT0, XUSD-WAPLAUSDT0)
  // These should only be tagged with non-stablecoin asset
  // WAPLAUSDT0 = Wrapped Aura Plasma USDT0 (contains XPL)
  const isMixedLPPair = /(?:WXPL|WETH|WBTC|XPL|WAPL)[-\/](?:USDT0|USDC|USDT|USDe|USD0)/i.test(searchText) ||
                        /(?:USDT0|USDC|USDT|USDe|USD0)[-\/](?:WXPL|WETH|WBTC|XPL|WAPL)/i.test(searchText) ||
                        /(?:XUSD|schUSD|sUSDe|USD0\+\+|USDT0|USDC|USDT)[-\/]WAPL/i.test(searchText) ||
                        /WAPL[-\/](?:XUSD|schUSD|sUSDe|USD0\+\+|USDT0|USDC|USDT)/i.test(searchText);

  if (isMixedLPPair) {
    // For mixed LP pairs, only tag the non-stablecoin asset
    // WAPL tokens contain XPL exposure
    if (/XPL|WAPL/i.test(searchText)) assets.push("XPL");
    if (/WETH/i.test(searchText)) assets.push("WETH");
    if (/WBTC/i.test(searchText)) assets.push("WBTC");
    return assets.length > 0 ? assets : ["Other"];
  }

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

  // Check for schUSD
  if (/schUSD/i.test(searchText)) assets.push("schUSD");
  else if (/chUSD/i.test(searchText)) assets.push("chUSD");

  // Check for USDAI
  if (/USDAI/i.test(searchText)) assets.push("USDAI");

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

  // Fetch Pendle pools
  let pendlePools: DashboardPool[] = [];
  try {
    const { pools } = await loadPendlePools();
    pendlePools = pools.map((pool) => ({
      id: pool.pool,
      pool: pool.pool,
      project: pool.project,
      symbol: pool.symbol,
      tvlUsd: pool.tvlUsd,
      apy: pool.apy,
      apyBase: pool.apyBase,
      apyReward: pool.apyReward,
      apyPct1d: pool.apyPct1d,
      apyPct7d: pool.apyPct7d,
      apyPct30d: pool.apyPct30d,
      apyMean30d: null,
      il7d: null,
      volumeUsd1d: null,
      volumeUsd7d: null,
      url: `https://app.pendle.finance/trade/pools/${pool.pool}/zap/in?chain=plasma`,
      rewardTokens: null,
      category: "DeFi",
      assets: pool.assets,
    }));
  } catch (error) {
    console.error("Failed to load Pendle pools:", error);
  }

  // Fetch Chateau Capital schUSD yields
  let chateauData: ChateauMetrics | null = null;
  try {
    const response = await fetch('https://app.chateau.capital/api/metrics', {
      next: { revalidate: 1200 }, // Cache for 20 minutes
    });
    if (response.ok) {
      chateauData = await response.json();
    }
  } catch {
    // swallow and continue
  }

  // Convert Chateau data to pool format
  const chateauPools: DashboardPool[] = [];
  if (chateauData) {
    // Using the 52-week IRR as the main APY (annualized)
    const yearlyAPY = chateauData.schUsdFiftyTwoWeekIRR;
    const fourWeekAPY = chateauData.schUsdFourWeekIRR;
    const oneWeekAPY = chateauData.schUsdOneWeekIRR;

    // Calculate percentage changes: (current - previous) / previous * 100
    // 7d change: how much 1-week IRR differs from 52-week IRR as a percentage
    const apyPct7d = yearlyAPY > 0
      ? ((oneWeekAPY - yearlyAPY) / yearlyAPY * 100)
      : null;

    // 30d change: how much 4-week IRR differs from 52-week IRR as a percentage
    const apyPct30d = yearlyAPY > 0
      ? ((fourWeekAPY - yearlyAPY) / yearlyAPY * 100)
      : null;

    chateauPools.push({
      id: "chateau-schusd",
      pool: "schUSD Vault",
      project: "CHATEAU",
      symbol: "schUSD",
      tvlUsd: chateauData.schUsdNav,
      apy: yearlyAPY,
      apyBase: yearlyAPY,
      apyReward: null,
      apyPct1d: null,
      apyPct7d,
      apyPct30d,
      apyMean30d: fourWeekAPY, // 4-week average APY
      il7d: null,
      volumeUsd1d: null,
      volumeUsd7d: null,
      url: "https://app.chateau.capital",
      rewardTokens: null,
      category: "RWA",
      assets: ["schUSD"],
    });
  }

  // Process DeFiLlama pools (filter by Plasma chain)
  const defiLlamaPools = (apiData ?? [])
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
    });

  // Combine all pools
  const pools = [...chateauPools, ...pendlePools, ...defiLlamaPools].sort(
    (a, b) => b.tvlUsd - a.tvlUsd
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:px-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Plasma Yield Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Live yield data sourced from DeFiLlama and Chateau Capital APIs. Filter by asset,
          category, or keyword to discover the most compelling opportunities on
          the Plasma chain.
        </p>
      </div>

      <PlasmaYieldDashboard pools={pools} />
    </main>
  );
}
