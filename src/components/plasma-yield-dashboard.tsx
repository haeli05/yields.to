"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type DashboardPool = {
  id: string;
  pool: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyPct30d: number | null;
  category: string;
  assets: string[];
};

const ASSET_OPTIONS = ["All assets", "USDT", "USDC", "XPL"] as const;
const CATEGORY_OPTIONS = ["All categories", "DeFi", "RWA", "Protocol"] as const;

const USD_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const PERCENT_FORMAT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2,
});

const formatUsd = (value: number | null | undefined) => {
  if (!value) return "—";
  return USD_FORMAT.format(value);
};

const formatPercent = (value: number | null | undefined) => {
  if (value == null) return "—";
  return PERCENT_FORMAT.format(value / 100);
};

export function PlasmaYieldDashboard({ pools }: { pools: DashboardPool[] }) {
  const [assetFilter, setAssetFilter] =
    useState<(typeof ASSET_OPTIONS)[number]>("All assets");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("All categories");
  const [search, setSearch] = useState("");

  const filteredPools = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return pools.filter((pool) => {
      const matchesAsset =
        assetFilter === "All assets" || pool.assets.includes(assetFilter);

      const matchesCategory =
        categoryFilter === "All categories" || pool.category === categoryFilter;

      const matchesSearch =
        normalizedSearch.length === 0 ||
        pool.project.toLowerCase().includes(normalizedSearch) ||
        pool.symbol.toLowerCase().includes(normalizedSearch) ||
        pool.pool.toLowerCase().includes(normalizedSearch);

      return matchesAsset && matchesCategory && matchesSearch;
    });
  }, [assetFilter, categoryFilter, pools, search]);

  const totalTvl = useMemo(
    () => filteredPools.reduce((acc, pool) => acc + (pool.tvlUsd ?? 0), 0),
    [filteredPools],
  );

  return (
    <div className="flex flex-col gap-10">
      <Card className="border border-border/60 bg-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Narrow the dataset by asset, category, or keyword search.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label
              htmlFor="asset-select"
              className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Asset
            </label>
            <select
              id="asset-select"
              value={assetFilter}
              onChange={(event) =>
                setAssetFilter(event.target.value as (typeof ASSET_OPTIONS)[number])
              }
              className="h-11 w-full rounded-md border border-border/70 bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {ASSET_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="category-select"
              className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Category
            </label>
            <select
              id="category-select"
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value as (typeof CATEGORY_OPTIONS)[number])
              }
              className="h-11 w-full rounded-md border border-border/70 bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="search"
              className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
            >
              Search
            </label>
            <Input
              id="search"
              placeholder="Search by protocol or pool…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 border-border/70 bg-background/80"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 bg-card">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            {filteredPools.length} pools · Total TVL {formatUsd(totalTvl)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-3xl border-t border-border/60">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60 text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-6 py-4">Pool</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Symbol</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Assets</th>
                    <th className="px-6 py-4">APY</th>
                    <th className="px-6 py-4">30d Δ</th>
                    <th className="px-6 py-4">TVL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredPools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 font-medium">{pool.pool}</td>
                      <td className="px-6 py-4">{pool.project}</td>
                      <td className="px-6 py-4">{pool.symbol}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-dashed">
                          {pool.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {pool.assets.map((asset) => (
                            <Badge key={asset} variant="secondary" className="bg-muted/60">
                              {asset}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatPercent(pool.apy)}</td>
                      <td className="px-6 py-4">{formatPercent(pool.apyPct30d)}</td>
                      <td className="px-6 py-4">{formatUsd(pool.tvlUsd)}</td>
                    </tr>
                  ))}
                  {filteredPools.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-10 text-center text-sm text-muted-foreground"
                      >
                        No pools found. Adjust your filters or search criteria.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

