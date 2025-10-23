import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";
import { kvSetJson } from "@/lib/kv";

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

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 0 },
    headers: { "User-Agent": "yields.to-aggregator" },
  });
  if (!res.ok) throw new Error(`Upstream failed: ${url} (${res.status})`);
  return res.json();
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
    const [chain, proto, yields] = await Promise.allSettled([
      fetchJson<ChartPoint[]>("https://api.llama.fi/charts/Plasma"),
      fetchJson<ProtocolResponse>(
        "https://api.llama.fi/protocol/plasma-saving-vaults"
      ),
      fetchJson<{ data?: YieldPool[] }>(
        "https://yields.llama.fi/pools?chain=Plasma"
      ),
    ]);

    const chainData = chain.status === "fulfilled" ? chain.value : [];
    const protocolData = proto.status === "fulfilled" ? proto.value : undefined;
    const yieldsData = yields.status === "fulfilled" ? yields.value.data ?? [] : [];

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

    // Upsert normalized pool rows for analytics
    if (topPools.length > 0) {
      const rows = topPools.map((p) => ({
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
      }));
      const { error: upsertErr } = await supabase
        .from("plasma_pool_yield_snapshots")
        .upsert(rows, { onConflict: "ts,pool,source" });
      if (upsertErr) throw upsertErr;
    }

    return NextResponse.json({ ok: true, upserted: snapshot.ts, pools: topPools.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown error";
    return new NextResponse(`Sync failed: ${message}`, { status: 500 });
  }
}
