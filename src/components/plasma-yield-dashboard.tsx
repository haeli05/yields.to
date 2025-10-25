"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

const ASSET_OPTIONS = [
  "All assets",
  "USDT",
  "USDC",
  "XPL",
  "sUSDe",
  "USDe",
  "WETH",
  "ETH",
  "WBTC",
  "BTC",
  "DAI",
  "USDS",
  "sUSDS",
  "USD0",
  "USD0++",
  "USDT0",
] as const;
const CATEGORY_OPTIONS = ["All categories", "DeFi", "RWA", "Protocol"] as const;

// Map asset names to icon paths
const ASSET_ICON_MAP: Record<string, string> = {
  "USDT": "/assets/tether.svg",
  "USDC": "/assets/usdc.png",
  "sUSDe": "/assets/susde.png",
  "USDe": "/assets/usde.png",
  "USD0": "/assets/usd0.png",
  "USD0++": "/assets/usd0++.png",
  "USDT0": "/assets/usdt0.png",
  "WETH": "/assets/weth.svg",
  "XPL": "/Plasma.png",
};

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

type SortField = "assets" | "project" | "symbol" | "category" | "apy" | "apyPct30d" | "tvlUsd";
type SortDirection = "asc" | "desc" | null;

export function PlasmaYieldDashboard({ pools }: { pools: DashboardPool[] }) {
  const [assetFilter, setAssetFilter] =
    useState<(typeof ASSET_OPTIONS)[number]>("All assets");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("All categories");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("tvlUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: desc -> asc -> null (default)
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortField("tvlUsd");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredAndSortedPools = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = pools.filter((pool) => {
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

    // Apply sorting
    if (!sortDirection) {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      let aValue: string | number | null;
      let bValue: string | number | null;

      switch (sortField) {
        case "assets":
          aValue = a.assets[0] || "";
          bValue = b.assets[0] || "";
          break;
        case "project":
          aValue = a.project;
          bValue = b.project;
          break;
        case "symbol":
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case "category":
          aValue = a.category;
          bValue = b.category;
          break;
        case "apy":
          aValue = a.apy ?? -Infinity;
          bValue = b.apy ?? -Infinity;
          break;
        case "apyPct30d":
          aValue = a.apyPct30d ?? -Infinity;
          bValue = b.apyPct30d ?? -Infinity;
          break;
        case "tvlUsd":
          aValue = a.tvlUsd;
          bValue = b.tvlUsd;
          break;
        default:
          return 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [assetFilter, categoryFilter, pools, search, sortField, sortDirection]);

  const totalTvl = useMemo(
    () => filteredAndSortedPools.reduce((acc, pool) => acc + (pool.tvlUsd ?? 0), 0),
    [filteredAndSortedPools],
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
            {filteredAndSortedPools.length} pools · Total TVL {formatUsd(totalTvl)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden rounded-b-3xl border-t border-border/60">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border/60 text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("assets")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Assets
                        {sortField === "assets" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "assets" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "assets" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("project")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Project
                        {sortField === "project" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "project" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "project" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("symbol")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Symbol
                        {sortField === "symbol" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "symbol" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "symbol" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("category")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        Category
                        {sortField === "category" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "category" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "category" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("apy")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        APY
                        {sortField === "apy" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "apy" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "apy" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("apyPct30d")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        30d Δ
                        {sortField === "apyPct30d" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "apyPct30d" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "apyPct30d" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                    <th className="px-6 py-4">
                      <button
                        onClick={() => handleSort("tvlUsd")}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        TVL
                        {sortField === "tvlUsd" && sortDirection === "desc" && <ArrowDown className="h-3 w-3" />}
                        {sortField === "tvlUsd" && sortDirection === "asc" && <ArrowUp className="h-3 w-3" />}
                        {sortField !== "tvlUsd" && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAndSortedPools.map((pool) => (
                    <tr key={pool.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {pool.assets.map((asset) => {
                            const iconPath = ASSET_ICON_MAP[asset];
                            return iconPath ? (
                              <div key={asset} className="flex items-center gap-1.5">
                                <Image
                                  src={iconPath}
                                  alt={asset}
                                  width={20}
                                  height={20}
                                  className="rounded-full"
                                />
                                <span className="text-sm font-medium">{asset}</span>
                              </div>
                            ) : (
                              <Badge key={asset} variant="secondary" className="bg-muted/60">
                                {asset}
                              </Badge>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">{pool.project}</td>
                      <td className="px-6 py-4">{pool.symbol}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="border-dashed">
                          {pool.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{formatPercent(pool.apy)}</td>
                      <td className="px-6 py-4">{formatPercent(pool.apyPct30d)}</td>
                      <td className="px-6 py-4">{formatUsd(pool.tvlUsd)}</td>
                    </tr>
                  ))}
                  {filteredAndSortedPools.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
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

