import { HeroWithTopYields } from '@/components/hero-with-top-yields';
import { loadPlasmaYields } from '@/lib/plasma-yields';
import type { ChateauMetrics } from '@/app/api/yields/chateau/route';

const detectAssets = (symbol: string, project: string) => {
  const searchText = `${symbol} ${project}`;
  const assets: string[] = [];

  const pendleMatch = symbol.match(/^(?:PT|YT)[-_]?([A-Za-z0-9]+)/i);
  if (pendleMatch?.[1]) {
    assets.push(pendleMatch[1].toUpperCase());
  }

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
    if (/pBTC/i.test(searchText)) assets.push("pBTC");
    return assets.length > 0 ? assets : ["Other"];
  }

  // Regular asset detection for non-mixed pairs
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

type ApiPool = {
  chain: string;
  project: string | null;
  symbol: string | null;
  tvlUsd: number;
  apy: number | null;
};

export default async function Home() {
  let apiData: ApiPool[] = [];
  try {
    const { data } = await loadPlasmaYields();
    apiData = data;
  } catch {
    // swallow and show empty dataset
  }

  // Fetch Chateau Capital schUSD yields
  let chateauData: ChateauMetrics | null = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/yields/chateau`, {
      next: { revalidate: 1200 }, // Cache for 20 minutes
    });
    if (response.ok) {
      chateauData = await response.json();
    }
  } catch {
    // swallow and continue
  }

  // Build pools array from DeFiLlama data
  const defiLlamaPools = (apiData ?? [])
    .filter((pool) => pool.chain === "Plasma")
    .map((pool) => {
      const project = pool.project || "Unknown";
      const symbol = pool.symbol || "—";
      const assets = detectAssets(symbol, project);
      return {
        project,
        symbol,
        tvlUsd: pool.tvlUsd ?? 0,
        apy: pool.apy ?? null,
        assets,
      };
    });

  // Add Chateau schUSD pool
  const chateauPools = chateauData ? [{
    project: "CHATEAU",
    symbol: "schUSD",
    tvlUsd: chateauData.schUsdNav,
    apy: chateauData.schUsdFiftyTwoWeekIRR,
    assets: ["schUSD"],
  }] : [];

  // Combine all pools
  const pools = [...chateauPools, ...defiLlamaPools];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-24 sm:px-8 lg:px-12">
      <HeroWithTopYields pools={pools} />
    </main>
  );
}
