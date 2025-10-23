import type { Metadata } from "next";

import { PlasmaYieldDashboard, type DashboardPool } from "@/components/plasma-yield-dashboard";

type YieldApiResponse = {
  data?: {
    chain: string;
    project: string;
    symbol: string;
    tvlUsd: number;
    apy: number | null;
    apyBase?: number | null;
    apyPct30D?: number | null;
    pool: string;
  }[];
};

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

const KNOWN_ASSETS = ["USDT", "USDC", "XPL"] as const;

const detectAssets = (symbol: string, project: string) => {
  const upper = `${symbol} ${project}`.toUpperCase();
  const assets = KNOWN_ASSETS.filter((asset) => upper.includes(asset));
  return assets.length > 0 ? assets : ["Other"];
};

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Interactive Plasma yield dashboard powered by DeFiLlama data.",
};

export default async function DashboardPage() {
  let apiData: YieldApiResponse["data"] = [];
  try {
    const response = await fetch(`/api/yields/plasma`, { cache: "no-store" });
    if (response.ok) {
      const json = (await response.json()) as YieldApiResponse;
      apiData = json.data ?? [];
    }
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
        apyPct30d: pool.apyPct30D ?? null,
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
