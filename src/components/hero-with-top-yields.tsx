"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

const ASSET_ICON_MAP: Record<string, string> = {
  "USD Stablecoins": "/assets/usdt0.png", // Use USDT0 icon for aggregated stablecoins
  "USDT": "/assets/tether.svg",
  "USDC": "/assets/usdc.png",
  "sUSDe": "/assets/susde.png",
  "USDe": "/assets/usde.png",
  "USD0": "/assets/usd0.png",
  "USD0++": "/assets/usd0++.png",
  "USDT0": "/assets/usdt0.png",
  "WETH": "/assets/weth.svg",
  "XPL": "/Plasma.png",
  "schUSD": "/assets/schusd.png",
  "USDAI": "/assets/usdai.png",
  "pBTC": "/assets/wbtc.png",
  "WBTC": "/assets/wbtc.png",
};

const ALL_ASSETS = [
  "USD Stablecoins",
  "WETH",
  "XPL",
  "WBTC",
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

export function HeroWithTopYields({ pools }: { pools: Pool[] }) {
  const [selectedAsset, setSelectedAsset] = useState<string>(ALL_ASSETS[0]);

  // Filter pools by selected asset and sort by APY
  const topPools = pools
    .filter((pool) => {
      if (selectedAsset === "USD Stablecoins") {
        // For USD Stablecoins, include pools that have any USD stablecoin
        return pool.assets.some((asset) => USD_STABLECOINS.includes(asset));
      }
      return pool.assets.includes(selectedAsset);
    })
    .filter((pool) => pool.apy != null && pool.apy > 0)
    .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0));

  return (
    <section className="flex w-full flex-col items-center gap-12 text-center">
      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8">
        <div className="flex flex-col gap-4 lg:flex-1">
          <div className="flex items-center justify-center gap-4 lg:justify-start">
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Find the best yields on Plasma.
            </h1>
            <Image
              src="/Plasma.png"
              alt="Plasma"
              width={48}
              height={48}
              style={{ mixBlendMode: 'difference' }}
              priority
              className="hidden lg:block"
            />
          </div>
          <div className="flex items-center justify-center gap-3 text-xl text-muted-foreground sm:text-2xl lg:justify-start">
            <span>The best yields for</span>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-auto inline-flex items-center gap-2 border-none bg-transparent px-2 text-xl sm:text-2xl font-normal text-muted-foreground hover:bg-accent focus:ring-1 focus:ring-ring transition-colors">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {ASSET_ICON_MAP[selectedAsset] && (
                      <Image
                        src={ASSET_ICON_MAP[selectedAsset]}
                        alt={selectedAsset}
                        width={24}
                        height={24}
                        className="inline-block rounded-full"
                      />
                    )}
                    <span className="font-semibold text-foreground">{selectedAsset}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-400">
                {ALL_ASSETS.map((asset) => (
                  <SelectItem key={asset} value={asset} className="text-base">
                    <div className="flex items-center gap-2">
                      {ASSET_ICON_MAP[asset] && (
                        <Image
                          src={ASSET_ICON_MAP[asset]}
                          alt={asset}
                          width={20}
                          height={20}
                          className="inline-block rounded-full"
                        />
                      )}
                      {asset}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Image
          src="/Plasma.png"
          alt="Plasma"
          width={60}
          height={60}
          style={{ mixBlendMode: 'difference' }}
          priority
          className="lg:hidden"
        />
      </div>

      {topPools.length > 0 ? (
        <div className="w-full">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
              <h3 className="text-left text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {selectedAsset} Yields
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/20">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">APY % (30d)</th>
                    <th className="px-6 py-3 font-semibold">Protocol</th>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 text-right font-semibold">TVL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {topPools.map((pool, index) => (
                    <tr
                      key={`${pool.project}-${pool.symbol}-${index}`}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-6 py-4">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-semibold text-green-500">
                          {formatPercent(pool.apy)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{pool.project}</td>
                      <td className="px-6 py-4 text-muted-foreground">{pool.symbol}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatUsd(pool.tvlUsd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border/60 bg-muted/20 px-6 py-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all {selectedAsset} pools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-12">
          <p className="text-sm text-muted-foreground">
            No {selectedAsset} pools available at this time.
          </p>
        </div>
      )}
    </section>
  );
}
