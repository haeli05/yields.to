"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Star,
  StarOff,
  Download,
} from "lucide-react";

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
  apyBase?: number | null;
  apyReward?: number | null;
  apyPct1d?: number | null;
  apyPct7d?: number | null;
  apyPct30d: number | null;
  apyMean30d?: number | null;
  il7d?: number | null;
  volumeUsd1d?: number | null;
  volumeUsd7d?: number | null;
  url?: string | null;
  rewardTokens?: string[] | null;
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

const getTrendIndicator = (apyPct7d: number | null | undefined) => {
  if (apyPct7d == null) return null;
  if (apyPct7d > 5) return { icon: TrendingUp, color: "text-green-500", label: "Rising" };
  if (apyPct7d < -5) return { icon: TrendingDown, color: "text-red-500", label: "Falling" };
  return { icon: Minus, color: "text-muted-foreground", label: "Stable" };
};

const getRiskBadge = (tvlUsd: number, il7d: number | null | undefined) => {
  // Simple risk heuristic: Low TVL or high IL = higher risk
  const hasIL = il7d != null && Math.abs(il7d) > 1;
  const lowTVL = tvlUsd < 100_000;

  if (hasIL || lowTVL) return { label: "HIGH", variant: "destructive" as const };
  if (tvlUsd < 1_000_000) return { label: "MED", variant: "secondary" as const };
  return { label: "LOW", variant: "outline" as const };
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
  const [minApy, setMinApy] = useState<number>(0);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("plasma-yield-favorites");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const toggleFavorite = (poolId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(poolId)) {
      newFavorites.delete(poolId);
    } else {
      newFavorites.add(poolId);
    }
    setFavorites(newFavorites);
    if (typeof window !== "undefined") {
      localStorage.setItem("plasma-yield-favorites", JSON.stringify([...newFavorites]));
    }
  };

  const exportToCSV = () => {
    const headers = ["Project", "Symbol", "Category", "Assets", "APY", "30d Change", "TVL", "Risk", "URL"];
    const rows = filteredAndSortedPools.map((pool) => [
      pool.project,
      pool.symbol,
      pool.category,
      pool.assets.join("; "),
      pool.apy?.toFixed(2) || "—",
      pool.apyPct30d?.toFixed(2) || "—",
      pool.tvlUsd.toFixed(2),
      getRiskBadge(pool.tvlUsd, pool.il7d).label,
      pool.url || "—",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plasma-yields-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  // Step 1: Filter pools
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

      const matchesMinApy = (pool.apy ?? 0) >= minApy;

      return matchesAsset && matchesCategory && matchesSearch && matchesMinApy;
    });
  }, [assetFilter, categoryFilter, pools, search, minApy]);

  // Step 2: Sort filtered pools
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filteredAndSortedPools = useMemo(() => {
    if (!sortDirection) {
      return filteredPools;
    }

    return [...filteredPools].sort((a, b) => {
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
  }, [filteredPools, sortField, sortDirection]);

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
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 space-y-2">
              <label
                htmlFor="min-apy"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Min APY (%)
              </label>
              <Input
                id="min-apy"
                type="number"
                min="0"
                step="0.5"
                value={minApy}
                onChange={(event) => setMinApy(Number(event.target.value))}
                className="h-11 border-border/70 bg-background/80"
                placeholder="0"
              />
            </div>
            <button
              onClick={exportToCSV}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-border/70 bg-background/80 px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
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
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Risk
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Actions
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {formatPercent(pool.apy)}
                          {(() => {
                            const trend = getTrendIndicator(pool.apyPct7d);
                            if (!trend) return null;
                            const Icon = trend.icon;
                            return (
                              <span title={trend.label}>
                                <Icon className={`h-3.5 w-3.5 ${trend.color}`} />
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">{formatPercent(pool.apyPct30d)}</td>
                      <td className="px-6 py-4">{formatUsd(pool.tvlUsd)}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={getRiskBadge(pool.tvlUsd, pool.il7d).variant}
                          className="text-xs"
                        >
                          {getRiskBadge(pool.tvlUsd, pool.il7d).label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleFavorite(pool.id)}
                            className="transition-colors hover:text-primary"
                            title={favorites.has(pool.id) ? "Remove from favorites" : "Add to favorites"}
                          >
                            {favorites.has(pool.id) ? (
                              <Star className="h-4 w-4 fill-primary text-primary" />
                            ) : (
                              <StarOff className="h-4 w-4" />
                            )}
                          </button>
                          {pool.url && (
                            <Link
                              href={pool.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="transition-colors hover:text-primary"
                              title="Visit protocol"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedPools.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
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

