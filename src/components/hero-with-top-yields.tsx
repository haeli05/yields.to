"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, TrendingUp, Wallet } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

const getDisplayAssets = (assets: string[]) => {
  if (!assets.length) return [];
  return assets.slice(0, 3);
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
    <section className="relative w-full overflow-hidden rounded-3xl border border-border/50 bg-muted/10 p-8 text-left shadow-xl shadow-black/10 backdrop-blur-sm sm:p-10 lg:p-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(56,189,248,0.12),transparent_55%)]" />
      </div>

      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-6 text-center lg:text-left">
            <Badge
              variant="secondary"
              className="mx-auto w-auto rounded-full border-none bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary shadow-sm lg:mx-0"
            >
              Live Plasma Yields
            </Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Finds the best yields on Plasma.
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Compare live APYs across protocols and assets in one place.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="text-sm text-muted-foreground">Show me</span>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger className="w-fit rounded-full border border-border/50 bg-background/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-background">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <Image
                        src={ASSET_ICON_MAP[selectedAsset] ?? DEFAULT_ICON}
                        alt={selectedAsset}
                        width={28}
                        height={28}
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
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-[360px] lg:grid-cols-1">
            <div className="rounded-2xl border border-border/40 bg-background/80 p-5 shadow-lg shadow-black/5">
              <div className="flex items-center justify-between">
                {heroStats.topApyAssets.length > 0 ? (
                  <Image
                    src={getPrimaryAssetIcon(heroStats.topApyAssets)}
                    alt={heroStats.topApySymbol || "Asset"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                )}
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Highest APY
                </span>
              </div>
              <div className="mt-5 text-3xl font-semibold">
                {formatPercent(heroStats.topApy)}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {heroStats.topApyProtocol
                  ? `${heroStats.topApyProtocol} • ${heroStats.topApySymbol}`
                  : `No live yields for ${selectedAssetLabel}`}
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/80 p-5 shadow-lg shadow-black/5">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Total TVL
                </span>
              </div>
              <div className="mt-5 text-3xl font-semibold">
                {formatUsd(heroStats.totalTvl)}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Active liquidity across {selectedAssetLabel} strategies.
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/80 p-5 shadow-lg shadow-black/5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-sky-500/10 p-2 text-sky-500">
                  <Layers className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Coverage
                </span>
              </div>
              <div className="mt-5 flex items-end gap-4">
                <div>
                  <div className="text-3xl font-semibold">{heroStats.totalPools}</div>
                  <p className="text-sm text-muted-foreground">Active pools</p>
                </div>
                <div className="text-muted-foreground">•</div>
                <div>
                  <div className="text-3xl font-semibold">{heroStats.totalProtocols}</div>
                  <p className="text-sm text-muted-foreground">Protocols tracked</p>
                </div>
              </div>
            </div>
          </div>
        </div>


        {rankedPools.length > 0 ? (
          <div className="w-full">
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-2xl shadow-black/10">
              <div className="border-b border-border/60 bg-muted/20 px-6 py-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  {selectedAssetLabel} Yields
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sorted by 30d APY • Refreshed every 20 minutes
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/10 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">#</th>
                      <th className="px-6 py-3 text-left font-semibold">Protocol &amp; pool</th>
                      <th className="px-6 py-3 text-left font-semibold">Assets</th>
                      <th className="px-6 py-3 text-left font-semibold">APY % (30d)</th>
                      <th className="px-6 py-3 text-right font-semibold">TVL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {rankedPools.map((pool, index) => {
                      const displayAssets = getDisplayAssets(pool.assets);
                      return (
                        <tr
                          key={`${pool.project}-${pool.symbol}-${index}`}
                          className="transition-colors hover:bg-muted/30"
                        >
                          <td className="px-6 py-4">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={getPrimaryAssetIcon(pool.assets)}
                                alt={pool.symbol}
                                width={36}
                                height={36}
                                className="rounded-full border border-border/40 bg-background p-1"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{pool.project}</span>
                                <span className="text-xs text-muted-foreground">{pool.symbol}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              {displayAssets.map((asset) => (
                                <Badge
                                  key={`${pool.project}-${pool.symbol}-${asset}`}
                                  variant="outline"
                                  className="rounded-full border-border/40 bg-background/60 px-3 py-1 text-[11px] font-medium"
                                >
                                  {asset}
                                </Badge>
                              ))}
                              {pool.assets.length > displayAssets.length && (
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-dashed border-border/40 bg-background/60 px-3 py-1 text-[11px] font-medium"
                                >
                                  +{pool.assets.length - displayAssets.length}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-base font-semibold text-emerald-500">
                              {formatPercent(pool.apy)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-medium">
                            {formatUsd(pool.tvlUsd)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border/60 bg-muted/10 px-6 py-5 text-right">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  View the full dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-2xl border border-dashed border-border/60 bg-muted/10 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No {selectedAssetLabel} pools available at this time.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
