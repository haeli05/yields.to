import { NextResponse } from "next/server";

import { loadStablewatchPools } from "@/lib/stablewatch";

const MIN_TTL = 60;
const MAX_TTL = 3600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const ttlParam = Number(url.searchParams.get("ttl") ?? Number.NaN);
  const ttl = Number.isFinite(ttlParam)
    ? Math.max(MIN_TTL, Math.min(MAX_TTL, ttlParam))
    : undefined;

  try {
    const { data, cached } = await loadStablewatchPools({
      refresh,
      ttlSeconds: ttl,
    });
    return NextResponse.json({ data, cached });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stablewatch unavailable";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
