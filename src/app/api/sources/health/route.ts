import { NextResponse } from "next/server";
import { getSupabaseService } from "@/lib/supabase";

type Check = {
  source: string;
  url: string;
  status?: number;
  ok: boolean;
  note?: string;
};

async function tryFetch(url: string, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...init });
    return res;
  } catch {
    return null;
  }
}

export async function GET() {
  const checks: Check[] = [];

  // DeFiLlama – Plasma chain yields
  {
    const url = "https://yields.llama.fi/pools?chain=Plasma";
    const res = await tryFetch(url);
    checks.push({
      source: "defillama-yields",
      url,
      status: res?.status,
      ok: !!res && res.ok,
      note: res?.ok ? undefined : "Unavailable or rate-limited",
    });
  }

  // DeFiLlama – Plasma chain TVL
  {
    const url = "https://api.llama.fi/charts/Plasma";
    const res = await tryFetch(url);
    checks.push({
      source: "defillama-chain-tvl",
      url,
      status: res?.status,
      ok: !!res && res.ok,
    });
  }

  // DeFiLlama – Plasma Saving Vaults
  {
    const url = "https://api.llama.fi/protocol/plasma-saving-vaults";
    const res = await tryFetch(url);
    checks.push({
      source: "defillama-saving-vaults",
      url,
      status: res?.status,
      ok: !!res && res.ok,
    });
  }

  // Stablewatch Plasma dashboard (UI surface only)
  {
    const url = "https://plasma.stablewatch.io/";
    const res = await tryFetch(url);
    checks.push({
      source: "stablewatch-plasma-ui",
      url,
      status: res?.status,
      ok: !!res && res.ok,
      note: "Public UI; scrape or partner for data export",
    });
  }

  // Merkl opportunities – Plasma unsupported per validation
  {
    const url =
      "https://api.merkl.xyz/v4/opportunities/?items=1&onlyLive=true&chainName=plasma";
    const res = await tryFetch(url);
    const note = res ? await res.text() : undefined;
    checks.push({
      source: "merkl-opportunities",
      url,
      status: res?.status,
      ok: false,
      note: note?.slice(0, 180) || "Chain not supported or requires params",
    });
  }

  // Ethena – API gated
  {
    const url = "https://api.ethena.fi/";
    const res = await tryFetch(url);
    checks.push({
      source: "ethena-api",
      url,
      status: res?.status,
      ok: !!res && res.ok,
      note: !res?.ok ? "Likely requires auth / gated" : undefined,
    });
  }

  // Pendle – public endpoints not exposed (404)
  {
    const url = "https://api.pendle.finance/core/v2/markets";
    const res = await tryFetch(url);
    checks.push({
      source: "pendle-api",
      url,
      status: res?.status,
      ok: !!res && res.ok,
      note: !res?.ok ? "No public route (404)" : undefined,
    });
  }

  const supabase = getSupabaseService();
  if (supabase) {
    const rows = checks.map((c) => ({
      source: c.source,
      url: c.url,
      status: c.status ?? null,
      ok: c.ok,
      note: c.note ?? null,
    }));
    await supabase.from("source_health").insert(rows);
  }

  return NextResponse.json({
    ok: true,
    checks,
  });
}

