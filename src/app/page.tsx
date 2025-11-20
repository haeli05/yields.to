import { HeroWithTopYields } from "@/components/hero-with-top-yields";
import {
  PlasmaYieldDashboard,
  type DashboardPool,
} from "@/components/plasma-yield-dashboard";
import {
  loadPlasmaYields,
  type PlasmaYieldPool,
} from "@/lib/plasma-yields";
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
  usd0: "RWA",
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
  const assets: string[] = [];

  const pendleMatch = symbol.match(/^(?:PT|YT)[-_]?([A-Za-z0-9]+)/i);
  if (pendleMatch?.[1]) {
    assets.push(pendleMatch[1].toUpperCase());
  }

  const isMixedLPPair =
    /(?:WXPL|WETH|WBTC|XPL|WAPL)[-\/](?:USDT0|USDC|USDT|USDe|USD0)/i.test(searchText) ||
    /(?:USDT0|USDC|USDT|USDe|USD0)[-\/](?:WXPL|WETH|WBTC|XPL|WAPL)/i.test(searchText) ||
    /(?:XUSD|schUSD|sUSDe|USD0\+\+|USDT0|USDC|USDT)[-\/]WAPL/i.test(searchText) ||
    /WAPL[-\/](?:XUSD|schUSD|sUSDe|USD0\+\+|USDT0|USDC|USDT)/i.test(searchText);

  if (isMixedLPPair) {
    if (/XPL|WAPL/i.test(searchText)) assets.push("XPL");
    if (/WETH/i.test(searchText)) assets.push("WETH");
    if (/WBTC/i.test(searchText)) assets.push("WBTC");
    if (/pBTC/i.test(searchText)) assets.push("pBTC");
    return assets.length > 0 ? assets : ["Other"];
  }

  if (/USD0\+\+/i.test(searchText)) assets.push("USD0++");
  else if (/USD0/i.test(searchText)) assets.push("USD0");

  if (/USDT0/i.test(searchText)) assets.push("USDT0");

  if (/sUSDe/i.test(searchText)) assets.push("sUSDe");
  else if (/USDe/i.test(searchText)) assets.push("USDe");

  if (/sUSDS/i.test(searchText)) assets.push("sUSDS");
  else if (/USDS/i.test(searchText)) assets.push("USDS");

  if (/USDT/i.test(searchText)) assets.push("USDT");
  if (/USDC/i.test(searchText)) assets.push("USDC");
  if (/DAI/i.test(searchText)) assets.push("DAI");

  if (/WETH/i.test(searchText)) assets.push("WETH");
  else if (/\bETH\b/i.test(searchText)) assets.push("ETH");

  if (/pBTC/i.test(searchText)) assets.push("pBTC");
  else if (/WBTC/i.test(searchText)) assets.push("WBTC");
  else if (/\bBTC\b/i.test(searchText)) assets.push("BTC");

  if (/XPL/i.test(searchText)) assets.push("XPL");

  if (/schUSD/i.test(searchText)) assets.push("schUSD");
  else if (/chUSD/i.test(searchText)) assets.push("chUSD");

  if (/USDAI/i.test(searchText)) assets.push("USDAI");

  return assets.length > 0 ? assets : ["Other"];
};

export default async function Home() {
  let apiData: PlasmaYieldPool[] = [];
  try {
    const { data } = await loadPlasmaYields();
    apiData = data;
  } catch {
    // swallow and show empty dataset
  }

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

  let chateauData: ChateauMetrics | null = null;
  let chateauHistorical: any[] = [];
  try {
    const [metricsRes, yieldsRes] = await Promise.all([
      fetch("https://app.chateau.capital/api/metrics", {
        next: { revalidate: 1200 },
      }),
      fetch("https://app.chateau.capital/api/yields", {
        next: { revalidate: 1200 },
      }),
    ]);

    if (metricsRes.ok) {
      chateauData = await metricsRes.json();
    }

    if (yieldsRes.ok) {
      const yieldsData = await yieldsRes.json();
      if (yieldsData?.success && Array.isArray(yieldsData.data)) {
        chateauHistorical = yieldsData.data;
      }
    }
  } catch {
    // swallow and continue
  }

  const chateauPools: DashboardPool[] = [];
  if (chateauData) {
    const yearlyAPY = chateauData.schUsdFiftyTwoWeekIRR;
    const fourWeekAPY = chateauData.schUsdFourWeekIRR;

    let apyPct7d = null;
    let apyPct30d = null;

    if (chateauHistorical.length >= 2) {
      const currentAPY = chateauHistorical[0]?.schUSDFiftyTwoWeekAPY;
      const oneWeekAgoAPY = chateauHistorical[1]?.schUSDFiftyTwoWeekAPY;

      if (currentAPY != null && oneWeekAgoAPY != null && oneWeekAgoAPY !== 0) {
        apyPct7d = ((currentAPY - oneWeekAgoAPY) / Math.abs(oneWeekAgoAPY)) * 100;
      }
    }

    if (chateauHistorical.length >= 5) {
      const currentAPY = chateauHistorical[0]?.schUSDFiftyTwoWeekAPY;
      const fourWeeksAgoAPY = chateauHistorical[4]?.schUSDFiftyTwoWeekAPY;

      if (currentAPY != null && fourWeeksAgoAPY != null && fourWeeksAgoAPY !== 0) {
        apyPct30d = ((currentAPY - fourWeeksAgoAPY) / Math.abs(fourWeeksAgoAPY)) * 100;
      }
    }

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
      apyMean30d: fourWeekAPY,
      il7d: null,
      volumeUsd1d: null,
      volumeUsd7d: null,
      url: "https://app.chateau.capital",
      rewardTokens: null,
      category: "RWA",
      assets: ["schUSD"],
    });
  }

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

  const pools = [...chateauPools, ...pendlePools, ...defiLlamaPools].sort(
    (a, b) => b.tvlUsd - a.tvlUsd,
  );

  const heroPools = pools.map((pool) => ({
    project: pool.project,
    symbol: pool.symbol,
    apy: pool.apy,
    tvlUsd: pool.tvlUsd,
    assets: pool.assets ?? [],
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-8 lg:px-12">
      <HeroWithTopYields pools={heroPools} />
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Live Plasma data
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Plasma yield dashboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Drill into every tracked pool with filters for asset, category, and on-chain activity.
          </p>
        </div>
        <PlasmaYieldDashboard pools={pools} />
      </section>
    </main>
  );
}
