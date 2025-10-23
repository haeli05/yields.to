import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";

const BASE = "https://api-plasma.sumcap.xyz";
const PATHS = [
  "/api/block-data",
  "/api/chain-flows",
  "/api/contract-data",
  "/api/dex-data",
  "/api/net-flows",
  "/api/project-flows",
  "/api/projects",
  "/api/public-sale",
  "/api/stablecoin-supply",
  "/api/stablecoin-users",
  "/api/stablecoin-volume",
  "/api/token-dex-data",
  "/api/transactions",
  "/api/usdt0-supply",
  "/api/users",
  "/api/xpl-brackets",
  "/api/xpl-holders",
  "/api/xpl-price",
  "/api/xpl-top-15",
];

type FetchJsonResult = {
  path: string;
  status: number;
  ok: boolean;
  json: unknown;
  url: string;
};

async function fetchJson(path: string): Promise<FetchJsonResult> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "yields.to-aggregator" },
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { path, status: res.status, ok: res.ok, json, url };
}

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

  // Round ts to the current hour
  const now = new Date();
  const rounded = new Date(Math.floor(now.getTime() / 3600000) * 3600000);

  // Fetch endpoints with basic politeness: small delay between requests
  const results: FetchJsonResult[] = [];
  for (const p of PATHS) {
    const r = await fetchJson(p);
    results.push(r);
    // 200ms delay to be polite
    await new Promise((res) => setTimeout(res, 200));
  }

  // Upsert into Supabase
  const rows = results.map((r) => ({
    ts: rounded.toISOString(),
    endpoint: r.path,
    status: r.status,
    ok: r.ok,
    payload: r.json ?? {},
    updated_at: now.toISOString(),
  }));

  const { error } = await supabase
    .from("sumcap_snapshots")
    .upsert(rows, { onConflict: "ts,endpoint" });
  if (error) {
    return new NextResponse(`Supabase upsert failed: ${error.message}`, { status: 500 });
  }

  const summary = {
    ok: true,
    ts: rounded.toISOString(),
    count: results.length,
    failed: results.filter((r) => !r.ok).map((r) => ({ path: r.path, status: r.status })),
  };

  return NextResponse.json(summary);
}
