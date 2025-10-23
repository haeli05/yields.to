import { NextResponse } from "next/server";
import { kvGetJson, kvSetJson } from "@/lib/kv";

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

const KEY = "defillama:plasma:yields:top50:v1";
const TTL = 60 * 15; // 15 minutes

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  if (!refresh) {
    const cached = await kvGetJson<YieldPool[]>(KEY);
    if (cached) return NextResponse.json({ data: cached, cached: true });
  }

  const res = await fetch("https://yields.llama.fi/pools?chain=Plasma", {
    cache: "no-store",
    headers: { "User-Agent": "yields.to-aggregator" },
  });
  if (!res.ok) {
    return new NextResponse("Upstream yields unavailable", { status: 502 });
  }
  const json = (await res.json()) as { data?: YieldPool[] };
  const trimmed = (json.data ?? [])
    .filter((p) => p.chain === "Plasma")
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 50)
    .map(({ chain, project, symbol, tvlUsd, apy, apyBase, apyPct30D, pool }) => ({
      chain,
      project,
      symbol,
      tvlUsd,
      apy,
      apyBase: apyBase ?? null,
      apyPct30D: apyPct30D ?? null,
      pool,
    }));

  await kvSetJson(KEY, trimmed, TTL);
  return NextResponse.json({ data: trimmed, cached: false });
}

