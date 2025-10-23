"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type YieldEntry = {
  protocol: string;
  assetType:
    | "Structured yield"
    | "Lending"
    | "Stablecoin allocator"
    | "Liquidity";
  asset: string;
  apr1M: string;
  tvl: string;
  dataSource: string;
  link: string;
  notes?: string;
};

const YIELD_PROGRAMS: YieldEntry[] = [
  {
    protocol: "Syrup USD Vault",
    assetType: "Structured yield",
    asset: "syrupUSDT",
    apr1M: "7.8%",
    tvl: "$401M",
    dataSource: "Stablewatch Plasma Dashboard",
    link: "https://plasma.stablewatch.io/",
    notes:
      "Pendle structured vault backed by Plasma USD collateral; Stablewatch surfaces Merkl emissions.",
  },
  {
    protocol: "Pendle PT-sUSDe Vaults",
    assetType: "Structured yield",
    asset: "PT-sUSDe",
    apr1M: "6.0–9.0%",
    tvl: "$344M",
    dataSource: "Stablewatch Plasma Dashboard",
    link: "https://plasma.stablewatch.io/",
    notes:
      "Ethena principal tokens bridged to Plasma with incentives observable via Stablewatch and Pendle subgraphs.",
  },
  {
    protocol: "Ethena sUSDe on Aave",
    assetType: "Lending",
    asset: "sUSDe",
    apr1M: "2.5%",
    tvl: "$293M",
    dataSource: "Aave Reserve + Stablewatch",
    link: "https://plasma.stablewatch.io/",
    notes:
      "Aave reserve analytics mirrored in Goldsky/Codex; Stablewatch reports blended Plasma lending rates.",
  },
  {
    protocol: "Plasma Saving Vaults",
    assetType: "Stablecoin allocator",
    asset: "aPlaUSDT0",
    apr1M: "4.4%",
    tvl: "$833M",
    dataSource: "DeFiLlama Saving Vaults API",
    link: "https://api.llama.fi/protocol/plasma-saving-vaults",
    notes:
      "Plasma’s flagship allocator with historical TVL and performance exposed by DeFiLlama’s public API.",
  },
  {
    protocol: "Fluid USDT Markets",
    assetType: "Lending",
    asset: "USDT0",
    apr1M: "2.6% supply / 0.3% borrow",
    tvl: "$572M",
    dataSource: "Stablewatch + Goldsky indexers",
    link: "https://plasma.stablewatch.io/",
    notes:
      "Native Plasma money market; Stablewatch aggregates APY while indexers power custom analytics.",
  },
  {
    protocol: "Plasma USDT Locked Product",
    assetType: "Stablecoin allocator",
    asset: "USDT",
    apr1M: "Campaign-dependent",
    tvl: "$250M cap",
    dataSource: "Binance Earn Campaigns",
    link: "https://www.plasma.to/insights/plasma-and-binance-earn",
    notes:
      "Exchange distribution channel into Plasma vaults; apr and caps published through Binance Earn.",
  },
  {
    protocol: "Pendle YT Plasma USD",
    assetType: "Structured yield",
    asset: "YT-PENDLE",
    apr1M: "5.8K% (inc.)",
    tvl: "$372K",
    dataSource: "Stablewatch Plasma Dashboard",
    link: "https://plasma.stablewatch.io/",
    notes:
      "High-incentive yield tokens tracked via Stablewatch; pair with Merkl/Pendle APIs for exact emissions.",
  },
  {
    protocol: "Ethena SY-sUSDe Curve Pool",
    assetType: "Liquidity",
    asset: "sUSDe / USDT0",
    apr1M: "8.4%",
    tvl: "$1.6M",
    dataSource: "Stablewatch + Curve Subgraph",
    link: "https://plasma.stablewatch.io/",
    notes:
      "Curve gauge data mirrored to Stablewatch; raw pool analytics available through Curve and Goldsky subgraphs.",
  },
];

const assetTypes = [
  "All asset types",
  ...new Set(YIELD_PROGRAMS.map((item) => item.assetType)),
];

const dataSources = [
  "All data sources",
  ...new Set(YIELD_PROGRAMS.map((item) => item.dataSource)),
];

export default function PlasmaYieldsPage() {
  const [search, setSearch] = useState("");
  const [assetFilter, setAssetFilter] =
    useState<(typeof assetTypes)[number]>("All asset types");
  const [sourceFilter, setSourceFilter] =
    useState<(typeof dataSources)[number]>("All data sources");

  const filteredPrograms = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return YIELD_PROGRAMS.filter((entry) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        entry.protocol.toLowerCase().includes(normalizedSearch) ||
        entry.asset.toLowerCase().includes(normalizedSearch) ||
        entry.dataSource.toLowerCase().includes(normalizedSearch) ||
        (entry.notes ?? "").toLowerCase().includes(normalizedSearch);

      const matchesAssetType =
        assetFilter === "All asset types" || entry.assetType === assetFilter;

      const matchesSource =
        sourceFilter === "All data sources" || entry.dataSource === sourceFilter;

      return matchesSearch && matchesAssetType && matchesSource;
    });
  }, [assetFilter, search, sourceFilter]);

  const activeFilters =
    (assetFilter !== "All asset types" ? 1 : 0) +
    (sourceFilter !== "All data sources" ? 1 : 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,0.6fr)_1fr] lg:items-start">
        <Card className="border border-border/60 bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Plasma yield intelligence
            </CardTitle>
            <CardDescription>
              Scan leading Plasma chain yield sources alongside asset type,
              recent 30-day APR, and TVL. Use filters or free-text search to
              focus on the strategies you care about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Programs tracked
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {filteredPrograms.length} of {YIELD_PROGRAMS.length}
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Active filters
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {activeFilters > 0 ? activeFilters : "None"}
                </p>
              </div>
            </div>
            <CardDescription className="text-sm">
              Source coverage spans Stablewatch dashboards, DeFiLlama APIs,
              Goldsky/Codex indexers, and Binance Earn distribution feeds.
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card">
          <CardHeader>
            <CardTitle>Filter yield feeds</CardTitle>
            <CardDescription>
              Combine search with asset type and data source filters to narrow
              the dataset.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label
                htmlFor="search"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Search
              </label>
              <Input
                id="search"
                placeholder="Search by protocol, asset, or data source…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 border-border/70 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="assetType"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Asset type
              </label>
              <select
                id="assetType"
                value={assetFilter}
                onChange={(event) =>
                  setAssetFilter(
                    event.target.value as (typeof assetTypes)[number],
                  )
                }
                className="h-11 w-full rounded-md border border-border/70 bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {assetTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="source"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Data source
              </label>
              <select
                id="source"
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(
                    event.target.value as (typeof dataSources)[number],
                  )
                }
                className="h-11 w-full rounded-md border border-border/70 bg-background/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {dataSources.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="w-full border border-border/60 bg-muted/40 hover:bg-muted/60"
                onClick={() => {
                  setSearch("");
                  setAssetFilter("All asset types");
                  setSourceFilter("All data sources");
                }}
              >
                Clear filters
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border/60 bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-6 py-4">Yield source</th>
                <th className="px-6 py-4">Asset type</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Recent 1M APR</th>
                <th className="px-6 py-4">TVL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPrograms.map((item) => (
                <tr key={item.protocol} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">
                    <div className="flex flex-col gap-1">
                      <span>{item.protocol}</span>
                      <Link
                        href={item.link}
                        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        View source
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="border-dashed">
                      {item.assetType}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">{item.asset}</td>
                  <td className="px-6 py-4">{item.apr1M}</td>
                  <td className="px-6 py-4">{item.tvl}</td>
                </tr>
              ))}
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No programs match the current filters. Adjust your search or
                    reset the filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
