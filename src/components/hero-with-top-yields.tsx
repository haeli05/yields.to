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

const getPrimaryAssetIcon = (assets: string[]) => {
  const firstWithIcon = assets.find((asset) => ASSET_ICON_MAP[asset]);
  if (firstWithIcon) {
    return ASSET_ICON_MAP[firstWithIcon];
  }
  return DEFAULT_ICON;
};

export function HeroWithTopYields({ pools }: { pools: Pool[] }) {
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

  return (
    <section className="w-full rounded-2xl border border-border/60 bg-card/40 p-8 text-left sm:p-10 lg:p-12">
      <div className="flex flex-col gap-8">
        <div className="space-y-4 text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Live yields
          </p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Find the best yields on Plasma.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Compare real-time APYs across every tracked protocol and asset class.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground lg:justify-start">
          <span>Show me</span>
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-fit rounded-full border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground">
              <SelectValue>
                <div className="flex items-center gap-3">
                  <Image
                    src={ASSET_ICON_MAP[selectedAsset] ?? DEFAULT_ICON}
                    alt={selectedAsset}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="font-semibold">{selectedAsset}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="w-56">
              {ASSET_FILTERS.map((asset) => (
                <SelectItem key={asset} value={asset} className="text-sm">
                  <div className="flex items-center gap-3">
                    <Image
                      src={ASSET_ICON_MAP[asset] ?? DEFAULT_ICON}
                      alt={asset}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    {asset}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/40 bg-background/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Highest APY
            </p>
            <div className="mt-4 flex items-center gap-4">
              {heroStats.topApyAssets.length > 0 ? (
                <Image
                  src={getPrimaryAssetIcon(heroStats.topApyAssets)}
                  alt={heroStats.topApySymbol || "Asset"}
                  width={40}
                  height={40}
                  className="rounded-full border border-border/40 bg-background p-1"
                />
              ) : (
                <div className="h-10 w-10 rounded-full border border-dashed border-border/60" />
              )}
              <div>
                <p className="text-3xl font-semibold">{formatPercent(heroStats.topApy)}</p>
                <p className="text-xs text-muted-foreground">
                  {heroStats.topApyProtocol
                    ? `${heroStats.topApyProtocol} • ${heroStats.topApySymbol}`
                    : `No live yields for ${selectedAssetLabel}`}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Total TVL
            </p>
            <p className="mt-4 text-3xl font-semibold">{formatUsd(heroStats.totalTvl)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Active liquidity across {selectedAssetLabel} strategies.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Coverage
            </p>
            <div className="mt-4 flex gap-6">
              <div>
                <p className="text-3xl font-semibold">{heroStats.totalPools}</p>
                <p className="text-xs text-muted-foreground">Pools</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{heroStats.totalProtocols}</p>
                <p className="text-xs text-muted-foreground">Protocols</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
