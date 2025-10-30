"use client";

import React, { useMemo, useState } from "react";
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
  Download,
  ChevronDown,
  ChevronUp,
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
  "schUSD",
  "USDAI",
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
  "schUSD": "/assets/schusd.png",
  "USDAI": "/assets/usdai.png",
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

const getRiskBadge = (tvlUsd: number, il7d: number | null | undefined, project?: string) => {
  // Special cases for specific protocols
  if (project === "CHATEAU" || project === "Chateau Capital") {
    return { label: "LOW", variant: "outline" as const };
  }

  // Simple risk heuristic: Low TVL or high IL = higher risk
  const hasIL = il7d != null && Math.abs(il7d) > 1;
  const lowTVL = tvlUsd < 100_000;

  if (hasIL || lowTVL) return { label: "HIGH", variant: "destructive" as const };
  if (tvlUsd < 1_000_000) return { label: "MED", variant: "secondary" as const };
  return { label: "LOW", variant: "outline" as const };
};

// Map project names to their websites
const PROJECT_WEBSITE_MAP: Record<string, string> = {
  "Pendle": "https://app.pendle.finance",
  "Fluid": "https://fluid.instadapp.io",
  "Aave": "https://app.aave.com",
  "Ethena": "https://app.ethena.fi",
  "CHATEAU": "https://app.chateau.capital",
  "Chateau Capital": "https://app.chateau.capital",
};

const getProtocolUrl = (project: string, poolUrl: string | null | undefined): string | null => {
  if (poolUrl) return poolUrl;

  // Try to find a matching website from the map
  const normalizedProject = project.toLowerCase();
  for (const [key, url] of Object.entries(PROJECT_WEBSITE_MAP)) {
    if (normalizedProject.includes(key.toLowerCase())) {
      return url;
    }
  }

  return null;
};

type SortField = "assets" | "project" | "symbol" | "category" | "apy" | "apyPct30d" | "tvlUsd";
type SortDirection = "asc" | "desc" | null;

// Expandable row detail component
function PoolDetailPanel({ pool }: { pool: DashboardPool }) {
  return (
    <div className="bg-muted/20 p-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Protocol & Asset Details */}
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Protocol Information
            </h4>
            <div className="space-y-2 rounded-lg border border-border/40 bg-card/50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Project</span>
                <span className="text-sm font-medium">{pool.project}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pool Name</span>
                <span className="text-sm font-medium">{pool.pool}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Symbol</span>
                <span className="text-sm font-medium">{pool.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="outline" className="border-dashed">
                  {pool.category}
                </Badge>
              </div>
              {pool.url && (
                <div className="flex justify-between pt-2">
                  <Link
                    href={pool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Visit Pool
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Assets
            </h4>
            <div className="flex flex-wrap gap-2 rounded-lg border border-border/40 bg-card/50 p-4">
              {pool.assets.map((asset) => {
                const iconPath = ASSET_ICON_MAP[asset];
                return iconPath ? (
                  <div
                    key={asset}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-background/60 px-3 py-2"
                  >
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
          </div>
        </div>

        {/* Right Column: Metrics */}
        <div className="space-y-4">
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Yield Metrics
            </h4>
            <div className="grid gap-3">
              <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Current APY
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-500">
                    {formatPercent(pool.apy)}
                  </span>
                  {(() => {
                    const trend = getTrendIndicator(pool.apyPct7d);
                    if (!trend) return null;
                    const Icon = trend.icon;
                    return (
                      <span title={trend.label} className="flex items-center gap-1">
                        <Icon className={`h-4 w-4 ${trend.color}`} />
                        <span className="text-xs text-muted-foreground">{trend.label}</span>
                      </span>
                    );
                  })()}
                </div>
                {pool.apyBase != null && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Base: {formatPercent(pool.apyBase)}
                    {pool.apyReward != null && ` | Rewards: ${formatPercent(pool.apyReward)}`}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    7d Change
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatPercent(pool.apyPct7d)}
                  </div>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    30d Change
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatPercent(pool.apyPct30d)}
                  </div>
                </div>
              </div>

              {pool.apyMean30d != null && (
                <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    30d Mean APY
                  </div>
                  <div className="mt-1 text-lg font-semibold">
                    {formatPercent(pool.apyMean30d)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              TVL & Volume
            </h4>
            <div className="grid gap-3">
              <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total Value Locked
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {formatUsd(pool.tvlUsd)}
                </div>
              </div>

              {(pool.volumeUsd1d != null || pool.volumeUsd7d != null) && (
                <div className="grid grid-cols-2 gap-3">
                  {pool.volumeUsd1d != null && (
                    <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        24h Volume
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {formatUsd(pool.volumeUsd1d)}
                      </div>
                    </div>
                  )}
                  {pool.volumeUsd7d != null && (
                    <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        7d Volume
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        {formatUsd(pool.volumeUsd7d)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pool.il7d != null && (
                <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    7d Impermanent Loss
                  </div>
                  <div className="mt-1 text-lg font-semibold text-amber-500">
                    {formatPercent(pool.il7d)}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border/40 bg-card/50 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Risk Level
                </div>
                <div className="mt-2">
                  <Badge variant={getRiskBadge(pool.tvlUsd, pool.il7d, pool.project).variant}>
                    {getRiskBadge(pool.tvlUsd, pool.il7d, pool.project).label}
                  </Badge>
                </div>
              </div>

              {getProtocolUrl(pool.project, pool.url) && (
                <a
                  href={getProtocolUrl(pool.project, pool.url) || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Protocol
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {pool.rewardTokens && pool.rewardTokens.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Reward Tokens
          </h4>
          <div className="flex flex-wrap gap-2 rounded-lg border border-border/40 bg-card/50 p-4">
            {pool.rewardTokens.map((token) => (
              <Badge key={token} variant="secondary">
                {token}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlasmaYieldDashboard({ pools }: { pools: DashboardPool[] }) {
  const [assetFilter, setAssetFilter] =
    useState<(typeof ASSET_OPTIONS)[number]>("All assets");
  const [categoryFilter, setCategoryFilter] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("All categories");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("tvlUsd");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [minApy, setMinApy] = useState<number>(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
      getRiskBadge(pool.tvlUsd, pool.il7d, pool.project).label,
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
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredAndSortedPools.map((pool) => {
                    const isExpanded = expandedRow === pool.id;
                    return (
                      <React.Fragment key={pool.id}>
                        <tr
                          onClick={() => setExpandedRow(isExpanded ? null : pool.id)}
                          className="cursor-pointer transition-colors hover:bg-muted/30"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRow(isExpanded ? null : pool.id);
                                }}
                                className="text-muted-foreground transition-colors hover:text-foreground"
                                aria-label={isExpanded ? "Collapse row" : "Expand row"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
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
                              variant={getRiskBadge(pool.tvlUsd, pool.il7d, pool.project).variant}
                              className="text-xs"
                            >
                              {getRiskBadge(pool.tvlUsd, pool.il7d, pool.project).label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {(() => {
                              const url = getProtocolUrl(pool.project, pool.url);
                              return url ? (
                                <Link
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                                >
                                  {pool.url ? "Visit Pool" : "Visit Protocol"}
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              );
                            })()}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <PoolDetailPanel pool={pool} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
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

