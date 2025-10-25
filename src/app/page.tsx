import { ChainMetricsCharts } from '@/components/chain-metrics-charts';
import { HeroWithTopYields } from '@/components/hero-with-top-yields';
import { loadPlasmaYields } from '@/lib/plasma-yields';

const detectAssets = (symbol: string, project: string) => {
  const searchText = `${symbol} ${project}`;
  const assets: string[] = [];

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

  if (/WBTC/i.test(searchText)) assets.push("WBTC");
  else if (/\bBTC\b/i.test(searchText)) assets.push("BTC");

  if (/XPL/i.test(searchText)) assets.push("XPL");

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

  const pools = (apiData ?? [])
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-24 sm:px-8 lg:px-12">
      <HeroWithTopYields pools={pools} />
      <div className="w-full">
        <ChainMetricsCharts />
      </div>
    </main>
  );
}
