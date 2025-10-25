"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Pool = {
  project: string;
  symbol: string;
  apy: number | null;
  tvlUsd: number;
  assets: string[];
};

const ASSET_ICON_MAP: Record<string, string> = {
  "USDT": "/assets/tether.svg",
  "USDC": "/assets/usdc.png",
  "sUSDe": "/assets/susde.png",
  "USDe": "/assets/usde.png",
  "USD0": "/assets/usd0.png",
  "USD0++": "/assets/usd0++.png",
  "USDT0": "/assets/usdt0.png",
  "WETH": "/assets/weth.svg",
};

const ALL_ASSETS = [
  "USDT",
  "USDC",
  "sUSDe",
  "USDe",
  "USD0",
  "USD0++",
  "USDT0",
  "WETH",
  "XPL",
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

export function HeroWithTopYields({ pools }: { pools: Pool[] }) {
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);
  const currentAsset = ALL_ASSETS[currentAssetIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAssetIndex((prev) => (prev + 1) % ALL_ASSETS.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter pools by current asset and get top 5 by APY
  const topPools = pools
    .filter((pool) => pool.assets.includes(currentAsset))
    .filter((pool) => pool.apy != null && pool.apy > 0)
    .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))
    .slice(0, 5);

  return (
    <section className="flex w-full flex-col items-center gap-12 text-center">
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:gap-12">
        <Image
          src="/Plasma.png"
          alt="Plasma"
          width={120}
          height={120}
          style={{ mixBlendMode: 'difference' }}
          priority
        />
        <div className="flex flex-col gap-4">
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Find the best yields on Plasma.
          </h1>
          <p className="text-xl text-muted-foreground sm:text-2xl">
            The best yields for{" "}
            <span
              key={currentAsset}
              className="inline-flex items-center gap-2 font-semibold text-foreground animate-in fade-in duration-500"
            >
              {ASSET_ICON_MAP[currentAsset] && (
                <Image
                  src={ASSET_ICON_MAP[currentAsset]}
                  alt={currentAsset}
                  width={24}
                  height={24}
                  className="inline-block rounded-full"
                />
              )}
              {currentAsset}
            </span>
          </p>
        </div>
      </div>

      {topPools.length > 0 ? (
        <div className="w-full max-w-3xl">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
              <h3 className="text-left text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Top 5 {currentAsset} Yields
              </h3>
            </div>
            <div className="divide-y divide-border/60">
              {topPools.map((pool, index) => (
                <div
                  key={`${pool.project}-${pool.symbol}-${index}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div className="text-left">
                      <div className="font-medium">{pool.project}</div>
                      <div className="text-sm text-muted-foreground">
                        {pool.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-500">
                      {formatPercent(pool.apy)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatUsd(pool.tvlUsd)} TVL
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/60 bg-muted/20 px-6 py-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all {currentAsset} pools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-3xl rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12">
          <p className="text-sm text-muted-foreground">
            No {currentAsset} pools available at this time.
          </p>
        </div>
      )}
    </section>
  );
}
