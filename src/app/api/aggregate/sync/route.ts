import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";
import { kvSetJson } from "@/lib/kv";
import { scrapeStablewatchPools, type StablewatchPool } from "@/lib/stablewatch";
import { loadPendlePools } from "@/lib/pendle";

type ChartPoint = {
  date: number | string;
  totalLiquidityUSD: number;
};

type ProtocolResponse = {
  name: string;
  chainTvls?: {
    Plasma?: { tvl?: ChartPoint[] } | ChartPoint[];
  };
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

type MerklToken = {
  symbol?: string;
};

type MerklProtocol = {
  name?: string | null;
};

type MerklChain = {
  id?: number;
  name?: string;
};

type MerklOpportunity = {
  id?: string;
  identifier?: string;
  name?: string;
  apr?: number;
  maxApr?: number;
  tvl?: number;
  depositUrl?: string | null;
  tokens?: MerklToken[];
  protocol?: MerklProtocol | null;
  chain?: MerklChain | null;
};

const MERKL_CHAIN_ID = 9745;
const MERKL_ENDPOINT = "https://api.merkl.xyz/v4/opportunities/";

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 0 },
    headers: { "User-Agent": "yields.to-aggregator" },
  });
  if (!res.ok) throw new Error(`Upstream failed: ${url} (${res.status})`);
  return res.json();
};

const fetchMerklOpportunities = async (): Promise<MerklOpportunity[]> => {
  const res = await fetch(MERKL_ENDPOINT, {
    cache: "no-store",
    headers: { "User-Agent": "yields.to-aggregator" },
  });
  if (!res.ok) {
    throw new Error(`Merkl upstream failed: ${res.status}`);
  }
  const data = (await res.json()) as MerklOpportunity[];
  return data.filter(
    (item) =>
      item?.chain?.id === MERKL_CHAIN_ID ||
      item?.chain?.name?.toLowerCase() === "plasma",
  );
};

const parseNumeric = (value: number | string | null | undefined): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const percentless = trimmed.replace(/[%,$]/g, "");
  const match = percentless.match(/-?\d+(?:[\d.,]*\d)?/);
  if (!match) return null;
  const raw = match[0].replace(/,/g, "");
  const base = Number.parseFloat(raw);
  if (!Number.isFinite(base)) return null;
  const unitMatch = percentless.match(/([KMB])$/i);
  if (!unitMatch) return base;
  const unit = unitMatch[1].toUpperCase();
  const multiplier =
    unit === "K" ? 1_000 : unit === "M" ? 1_000_000 : unit === "B" ? 1_000_000_000 : 1;
  return base * multiplier;
};

export async function GET(req: Request) {
  const secret = process.env.AGGREGATOR_SECRET;
  const url = new URL(req.url);
  const headerSecret = req.headers.get("x-cron-secret");
  const querySecret = url.searchParams.get("secret");

  if (!secret || (headerSecret !== secret && querySecret !== secret)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = getSupabaseService();
  if (!supabase) {
    return new NextResponse("Supabase service not configured", { status: 500 });
  }

  try {
    const [chain, proto, yields, stablewatch, merkl, pendle] = await Promise.allSettled([
      fetchJson<ChartPoint[]>("https://api.llama.fi/charts/Plasma"),
      fetchJson<ProtocolResponse>(
        "https://api.llama.fi/protocol/plasma-saving-vaults"
      ),
      fetchJson<{ data?: YieldPool[] }>(
        "https://yields.llama.fi/pools?chain=Plasma"
      ),
      scrapeStablewatchPools(),
      fetchMerklOpportunities(),
      loadPendlePools(),
    ]);

    const chainData = chain.status === "fulfilled" ? chain.value : [];
    const protocolData = proto.status === "fulfilled" ? proto.value : undefined;
    const yieldsData = yields.status === "fulfilled" ? yields.value.data ?? [] : [];
    const stablewatchData =
      stablewatch.status === "fulfilled" ? stablewatch.value : [];
    const merklData = merkl.status === "fulfilled" ? merkl.value : [];
    const pendleData =
      pendle.status === "fulfilled"
        ? pendle.value
        : { pools: [], monthly: [], cached: false };

    const latestChain = chainData.at(-1) ?? null;
    const previousChain = chainData.at(-2) ?? null;
    const latestChainTvl = latestChain?.totalLiquidityUSD ?? 0;
    const prevChainTvl = previousChain?.totalLiquidityUSD ?? 0;

    const plasmaTvl = protocolData?.chainTvls?.Plasma as
      | { tvl?: ChartPoint[] }
      | ChartPoint[]
      | undefined;
    const protocolTvlSeries: ChartPoint[] = Array.isArray(plasmaTvl)
      ? plasmaTvl
      : plasmaTvl?.tvl ?? [];
    const latestProtocolTvl = protocolTvlSeries.at(-1)?.totalLiquidityUSD ?? 0;

    const topPools = yieldsData
      .filter((p) => p.chain === "Plasma")
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, 50)
      .map(({ chain, project, symbol, tvlUsd, apy, apyBase, apyPct30D, pool }) => ({
        chain,
        project,
        symbol,
        tvlUsd,
        apy,
        apyBase,
        apyPct30D,
        pool,
      }));

    const now = new Date();
    const rounded = new Date(Math.floor(now.getTime() / 3600000) * 3600000);

    const snapshot = {
      ts: rounded.toISOString(),
      chain_latest_tvl_usd: latestChainTvl,
      chain_prev_tvl_usd: prevChainTvl,
      chain_last_date: latestChain?.date ?? null,
      protocol_latest_tvl_usd: latestProtocolTvl,
      protocol_last_date: protocolTvlSeries.at(-1)?.date ?? null,
      top_pools: topPools,
      updated_at: now.toISOString(),
    };

    const { error } = await supabase
      .from("plasma_aggregate")
      .upsert(snapshot, { onConflict: "ts" });
    if (error) throw error;

    // Also store trimmed yields in KV to avoid Next.js data cache limits
    await kvSetJson("defillama:plasma:yields:top50:v1", topPools, 60 * 15);

    const rows = [
      ...topPools.map((p) => ({
        ts: rounded.toISOString(),
        chain: "Plasma",
        pool: p.pool,
        project: p.project,
        symbol: p.symbol,
        tvl_usd: p.tvlUsd,
        apy: p.apy,
        apy_base: p.apyBase ?? null,
        apy_pct30d: p.apyPct30D ?? null,
        source: "defillama",
        updated_at: now.toISOString(),
      })),
      ...stablewatchData.map((pool: StablewatchPool, index) => {
        const id =
          pool.link ??
          pool.name ??
          pool.project ??
          `stablewatch-${index}`;
        return {
          ts: rounded.toISOString(),
          chain: "Plasma",
          pool: id,
          project: pool.project ?? null,
          symbol: pool.symbol ?? null,
          tvl_usd: parseNumeric(pool.tvl),
          apy: parseNumeric(pool.apr),
          apy_base: null,
          apy_pct30d: null,
          source: "stablewatch",
          updated_at: now.toISOString(),
        };
      }),
      ...pendleData.pools.map((pool) => ({
        ts: rounded.toISOString(),
        chain: "Plasma",
        pool: pool.pool,
        project: pool.project,
        symbol: pool.symbol,
        tvl_usd: pool.tvlUsd,
        apy: pool.apy,
        apy_base: null,
        apy_pct30d: null,
        source: "pendle",
        updated_at: now.toISOString(),
      })),
      ...merklData.map((opportunity, index) => {
        const identifier =
          opportunity.identifier ??
          opportunity.id ??
          `merkl-${index}`;
        const tokenSymbols = (opportunity.tokens ?? [])
          .map((token) => token.symbol)
          .filter((value): value is string => Boolean(value));
        const symbol =
          tokenSymbols.length > 0 ? tokenSymbols.join("/") : null;
        return {
          ts: rounded.toISOString(),
          chain: "Plasma",
          pool: identifier,
          project: opportunity.protocol?.name ?? null,
          symbol,
          tvl_usd: parseNumeric(opportunity.tvl ?? null),
          apy: parseNumeric(opportunity.apr ?? null),
          apy_base: parseNumeric(opportunity.maxApr ?? null),
          apy_pct30d: null,
          source: "merkl",
          updated_at: now.toISOString(),
        };
      }),
    ];

    if (rows.length > 0) {
      const { error: upsertErr } = await supabase
        .from("plasma_pool_yield_snapshots")
        .upsert(rows, { onConflict: "ts,pool,source" });
      if (upsertErr) throw upsertErr;
    }

    if (pendleData.monthly.length > 0) {
      const monthlyRows = pendleData.monthly.map((record) => ({
        month_date: record.monthDate,
        chain: "Plasma",
        pool: record.pool,
        project: record.project,
        symbol: record.symbol,
        apy: record.apy,
        tvl_usd: record.tvlUsd,
        datapoints: record.datapoints,
        source: "pendle",
        updated_at: now.toISOString(),
      }));

      const { error: monthlyErr } = await supabase
        .from("plasma_pool_yield_monthly")
        .upsert(monthlyRows, { onConflict: "month_date,pool,source" });
      if (monthlyErr) throw monthlyErr;
    }

    return NextResponse.json({
      ok: true,
      upserted: snapshot.ts,
      pools: {
        defillama: topPools.length,
        stablewatch: stablewatchData.length,
        merkl: merklData.length,
        pendle: pendleData.pools.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    return new NextResponse(`Sync failed: ${message}`, { status: 500 });
  }
}
