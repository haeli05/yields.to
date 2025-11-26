"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Pool = {
  project: string;
  symbol: string;
  apy: number | null;
  tvlUsd: number;
  assets: string[];
};

type Insight = {
  label: string;
  value: string;
  detail: string;
};

const DEFAULT_ICON = "/Plasma.png";

const ASSET_ICON_MAP: Record<string, string> = {
  "All Pools": "/Plasma.png",
  "USD Stablecoins": "/assets/usdt0.png",
  "USDT": "/assets/tether.svg",
  "USDC": "/assets/usdc.png",
  "sUSDe": "/assets/susde.png",
  "USDe": "/assets/usde.png",
  "USD0": "/assets/usd0.png",
  "USD0++": "/assets/usd0++.png",
  "USDT0": "/assets/usdt0.png",
  "WETH": "/assets/weth.svg",
  "ETH": "/assets/weth.svg",
  "XPL": "/Plasma.png",
  "schUSD": "/assets/schusd.png",
  "USDAI": "/assets/usdai.png",
  "pBTC": "/assets/wbtc.png",
  "WBTC": "/assets/wbtc.png",
  "BTC": "/assets/wbtc.png",
};

const ASSET_FILTERS = [
  "USD Stablecoins",
  "WETH",
  "XPL",
  "WBTC",
  "All Pools",
];

// All stablecoins that should be aggregated under "USD Stablecoins"
const USD_STABLECOINS = [
  "USDT",
  "USDC",
  "USDe",
  "USD0",
  "USDT0",
  "sUSDe",
  "USD0++",
  "schUSD",
  "USDAI",
];

const PERCENT_FORMAT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

const USD_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const formatPercent = (value: number | null | undefined) => {
  if (value == null) return "—";
  return PERCENT_FORMAT.format(value / 100);
};

const formatUsd = (value: number | null | undefined) => {
  if (!value) return "—";
  return USD_FORMAT.format(value);
};

export function HeroWithTopYields({ pools, insights }: { pools: Pool[]; insights: Insight[] }) {
  const [selectedAsset, setSelectedAsset] = useState<string>(ASSET_FILTERS[0]);

  const filteredPools = useMemo(() => {
    if (selectedAsset === "All Pools") {
      return pools;
    }

    if (selectedAsset === "USD Stablecoins") {
      return pools.filter((pool) =>
        pool.assets.some((asset) => USD_STABLECOINS.includes(asset))
      );
    }

    return pools.filter((pool) => pool.assets.includes(selectedAsset));
  }, [pools, selectedAsset]);

  const rankedPools = useMemo(() => {
    return filteredPools
      .filter((pool) => pool.apy != null && pool.apy > 0)
      .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));
  }, [filteredPools]);

  const heroStats = useMemo(() => {
    if (!filteredPools.length) {
      return {
        totalPools: 0,
        totalProtocols: 0,
        totalTvl: 0,
        topApy: null as number | null,
        topApyProtocol: null as string | null,
        topApySymbol: null as string | null,
        topApyAssets: [] as string[],
      };
    }

    const totalTvl = filteredPools.reduce((acc, pool) => acc + (pool.tvlUsd ?? 0), 0);
    const totalProtocols = new Set(filteredPools.map((pool) => pool.project)).size;

    const bestPool =
      rankedPools[0] ??
      filteredPools
        .slice()
        .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))[0] ??
      null;

    return {
      totalPools: filteredPools.length,
      totalProtocols,
      totalTvl,
      topApy: bestPool?.apy ?? null,
      topApyProtocol: bestPool?.project ?? null,
      topApySymbol: bestPool?.symbol ?? null,
      topApyAssets: bestPool?.assets ?? [],
    };
  }, [filteredPools, rankedPools]);

  const selectedAssetLabel = selectedAsset === "All Pools" ? "Plasma" : selectedAsset;

  const insightIcons = [
    // Network breadth - honeycomb/network icon
    <svg key="network" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </svg>,
    // Average APY - percentage icon
    <svg key="apy" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5 5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>,
    // Dominant sector - pie chart icon
    <svg key="sector" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>,
  ];

  return (
    <section className="space-y-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        {/* Left column */}
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Live yields
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Find the best yields.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Stream live APYs, compare liquidity, and focus on the assets that matter most with a
              clean interface built for daily monitoring.
            </p>
          </div>

          <a
            href="#dashboard"
            className="group inline-block text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400"
          >
            Explore all pools
            <span className="mt-1 block h-0.5 w-full bg-emerald-600 dark:bg-emerald-400" />
          </a>

          <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-muted-foreground">
            <span className="text-xs uppercase tracking-[0.3em]">Focus asset</span>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-fit rounded-full border-0 bg-muted/30 px-5 py-2 text-sm font-medium dark:bg-muted/20">
                <SelectValue>
                  <div className="flex items-center gap-3">
                    <Image
                      src={ASSET_ICON_MAP[selectedAsset] ?? DEFAULT_ICON}
                      alt={selectedAsset}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <span className="uppercase tracking-wide">{selectedAsset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="w-56 rounded-2xl">
                {ASSET_FILTERS.map((asset) => (
                  <SelectItem key={asset} value={asset} className="text-sm">
                    <div className="flex items-center gap-3">
                      <Image
                        src={ASSET_ICON_MAP[asset] ?? DEFAULT_ICON}
                        alt={asset}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      {asset}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground/70">
              Updated every 20m
            </span>
          </div>
        </div>

        {/* Right column - Stats */}
        <div className="space-y-6">
          {/* Highest APY */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              Highest APY
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-5xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-6xl">
                {formatPercent(heroStats.topApy)}
              </p>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </svg>
            </div>
            <p className="mt-1 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {heroStats.topApyProtocol
                ? `${heroStats.topApyProtocol} • ${heroStats.topApySymbol}`
                : `No live yields for ${selectedAssetLabel}`}
            </p>
          </div>

          {/* TVL and Coverage row */}
          <div className="flex gap-10">
            {/* TVL Scanned */}
            <div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14a9 3 0 0 0 18 0V5" />
                  <path d="M3 12a9 3 0 0 0 18 0" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  TVL scanned
                </p>
              </div>
              <p className="mt-2 text-3xl font-semibold">{formatUsd(heroStats.totalTvl)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Across {selectedAssetLabel}
              </p>
            </div>

            {/* Coverage */}
            <div>
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Coverage
                </p>
              </div>
              <div className="mt-2 flex gap-4">
                <div>
                  <p className="text-3xl font-semibold">{heroStats.totalPools}</p>
                  <p className="text-xs text-muted-foreground">Pools</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold">{heroStats.totalProtocols}</p>
                  <p className="text-xs text-muted-foreground">Protocols</p>
                </div>
              </div>
              <div className="mt-2 flex gap-4">
                <span className="block h-0.5 w-10 bg-emerald-600 dark:bg-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights row */}
      <div className="grid gap-6 border-t border-border/50 pt-8 md:grid-cols-3">
        {insights.map((insight, index) => (
          <div key={insight.label} className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                {insight.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">{insight.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
              <span className="mt-3 block h-0.5 w-16 bg-emerald-600 dark:bg-emerald-400" />
            </div>
            <div className="text-muted-foreground/50">
              {insightIcons[index]}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
