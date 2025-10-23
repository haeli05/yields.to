import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ChartPoint = {
  date: number | string;
  totalLiquidityUSD: number;
};

type ProtocolResponse = {
  name: string;
  chainTvls?: {
    Plasma?: {
      tvl?: ChartPoint[];
    };
  };
  tokensInUsd?: {
    date: number | string;
    tokens: Record<string, number>;
  }[];
};

type YieldPool = {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase?: number | null;
  apyPct30D?: number | null;
  pool: string;
};

type PlasmaAggregateRow = {
  ts: string;
  chain_latest_tvl_usd: number | null;
  chain_prev_tvl_usd: number | null;
  chain_last_date: number | string | null;
  protocol_latest_tvl_usd: number | null;
  protocol_last_date: number | string | null;
  top_pools: YieldPool[] | null;
};

const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

const USD_STANDARD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const DATA_SOURCES = [
  {
    name: "Plasma Chain TVL",
    endpoint: "https://api.llama.fi/charts/Plasma",
    description:
      "Historical total value locked for the Plasma chain across all tracked protocols.",
  },
  {
    name: "Plasma Saving Vaults",
    endpoint: "https://api.llama.fi/protocol/plasma-saving-vaults",
    description:
      "Vault-level metrics including historical TVL and token composition for Plasma’s flagship allocator.",
  },
  {
    name: "Plasma Yield Pools",
    endpoint: "https://yields.llama.fi/pools?chain=Plasma",
    description:
      "Programmatic list of yield-bearing pools available on the Plasma chain with APY statistics.",
  },
];

export const metadata: Metadata = {
  title: "Data sources",
  description:
    "Live Plasma chain metrics sourced from DeFiLlama and surfaced in an at-a-glance dashboard.",
};

const formatUsd = (value: number | null | undefined) => {
  if (value == null) return "—";
  if (value >= 1_000_000) return USD_COMPACT.format(value);
  return USD_STANDARD.format(value);
};

const formatPercent = (value: number | null | undefined) => {
  if (value == null) return "—";
  return `${value.toFixed(2)}%`;
};

const unixToDate = (value: number | string | undefined) => {
  if (!value) return "—";
  const timestamp =
    typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (Number.isNaN(timestamp)) return "—";
  return new Date(timestamp * 1000).toLocaleDateString();
};

export default async function DataSourcesPage() {
  // Prefer Supabase hourly snapshot; gracefully fallback to upstream
  let latestChainTvl = 0;
  let chainDailyChange = 0;
  let latestChainDate: number | string | undefined;
  let latestProtocolTvl = 0;
  let latestProtocolDate: number | string | undefined;
  let topPools: YieldPool[] = [];

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnon = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) throw new Error("Supabase not configured");
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .from<PlasmaAggregateRow>("plasma_aggregate")
      .select(
        "ts, chain_latest_tvl_usd, chain_prev_tvl_usd, chain_last_date, protocol_latest_tvl_usd, protocol_last_date, top_pools"
      )
      .order("ts", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = data?.[0];
    if (!row) throw new Error("No snapshot yet");
    latestChainTvl = row.chain_latest_tvl_usd ?? 0;
    chainDailyChange =
      (row.chain_latest_tvl_usd ?? 0) - (row.chain_prev_tvl_usd ?? 0);
    latestChainDate = row.chain_last_date ?? undefined;
    latestProtocolTvl = row.protocol_latest_tvl_usd ?? 0;
    latestProtocolDate = row.protocol_last_date ?? undefined;
    topPools = (row.top_pools ?? []).slice(0, 10);
  } catch {
    const [chainRes, protocolRes, yieldsRes] = await Promise.all([
      fetch("https://api.llama.fi/charts/Plasma", {
        next: { revalidate: 60 * 30 },
      }),
      fetch("https://api.llama.fi/protocol/plasma-saving-vaults", {
        next: { revalidate: 60 * 30 },
      }),
      // Prefer our trimmed + cached KV-backed endpoint to avoid large cache sizes
      fetch("/api/yields/plasma", { cache: "no-store" }),
    ]);

    if (!chainRes.ok || !protocolRes.ok || !yieldsRes.ok) {
      throw new Error("Unable to load Plasma data.");
    }

    const chainData = (await chainRes.json()) as ChartPoint[];
    const protocolData = (await protocolRes.json()) as ProtocolResponse;
    const yieldsData = (await yieldsRes.json()) as { data?: YieldPool[] };

    const latestChain = chainData.at(-1);
    const previousChain = chainData.at(-2);
    latestChainTvl = latestChain?.totalLiquidityUSD ?? 0;
    chainDailyChange =
      latestChain && previousChain
        ? latestChain.totalLiquidityUSD - previousChain.totalLiquidityUSD
        : 0;
    latestChainDate = latestChain?.date ?? undefined;

    const plasmaTvl = protocolData.chainTvls?.Plasma as
      | { tvl?: ChartPoint[] }
      | ChartPoint[]
      | undefined;
    const protocolTvlSeries: ChartPoint[] = Array.isArray(plasmaTvl)
      ? plasmaTvl
      : plasmaTvl?.tvl ?? [];
    latestProtocolTvl =
      protocolTvlSeries.at(-1)?.totalLiquidityUSD ?? 0;
    latestProtocolDate = protocolTvlSeries.at(-1)?.date ?? undefined;

    topPools = (yieldsData.data ?? [])
      .filter((pool) => pool.chain === "Plasma")
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, 10);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:px-10 lg:px-12">
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border border-border/60 bg-card">
          <CardHeader>
            <CardTitle>Plasma chain TVL</CardTitle>
            <CardDescription>
              Aggregated total value locked across all Plasma protocols.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">
                {formatUsd(latestChainTvl)}
              </span>
              <Badge variant="outline" className="border-dashed">
                Updated {unixToDate(latestChainDate)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              24h change:{" "}
              <span
                className={
                  chainDailyChange >= 0 ? "text-emerald-500" : "text-rose-500"
                }
              >
                {formatUsd(chainDailyChange)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card">
          <CardHeader>
            <CardTitle>Plasma Saving Vaults</CardTitle>
            <CardDescription>
              TVL within the flagship Plasma Saving Vaults product on DeFiLlama.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">
                {formatUsd(latestProtocolTvl)}
              </span>
              <Badge variant="outline" className="border-dashed">
                Updated {unixToDate(latestProtocolDate)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Source:{" "}
              <Link
                href="https://api.llama.fi/protocol/plasma-saving-vaults"
                className="text-primary underline-offset-4 hover:underline"
              >
                DeFiLlama protocol API
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Top Plasma yield pools
          </h2>
          <p className="text-sm text-muted-foreground">
            Live data pulled from{" "}
            <Link
              href="https://yields.llama.fi/pools?chain=Plasma"
              className="text-primary underline-offset-4 hover:underline"
            >
              yields.llama.fi
            </Link>
            . Showing the ten largest pools by TVL.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <th className="px-6 py-4">Pool</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">APY (1M)</th>
                  <th className="px-6 py-4">TVL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {topPools.map((pool) => (
                  <tr key={pool.pool} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{pool.pool}</td>
                    <td className="px-6 py-4">{pool.project}</td>
                    <td className="px-6 py-4">{pool.symbol}</td>
                    <td className="px-6 py-4">{formatPercent(pool.apy)}</td>
                    <td className="px-6 py-4">{formatUsd(pool.tvlUsd)}</td>
                  </tr>
                ))}
                {topPools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-sm text-muted-foreground"
                    >
                      No Plasma yield pools found via DeFiLlama.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            DeFiLlama data sources
          </h2>
          <p className="text-sm text-muted-foreground">
            Endpoints referenced on this page with brief descriptions of what
            each returns.
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card">
          <table className="min-w-full divide-y divide-border/60 text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Endpoint</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {DATA_SOURCES.map((source) => (
                <tr key={source.endpoint} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium">{source.name}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={source.endpoint}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {source.endpoint}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {source.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
