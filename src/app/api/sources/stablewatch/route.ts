import { NextResponse } from "next/server";
import { kvGetJson, kvSetJson } from "@/lib/kv";

type PoolLike = {
  name?: string;
  project?: string;
  symbol?: string;
  apr?: number | string | null;
  tvl?: number | string | null;
  link?: string;
};

const KEY = "stablewatch:plasma:pools:v1";
const TTL = 60 * 10; // 10 minutes politeness window

function extractScriptSrcs(html: string): string[] {
  const srcs: string[] = [];
  const re = /<script[^>]+src=\"([^\"]+)\"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) srcs.push(m[1]);
  return srcs;
}

function toAbsolute(url: string): string {
  if (url.startsWith("http")) return url;
  return `https://plasma.stablewatch.io${url}`;
}

type UnknownRecord = Record<string, unknown>;

function tryExtractJsonArrays(text: string): unknown[] {
  // Heuristic: find large array literals and attempt to coerce to JSON
  const results: unknown[] = [];
  const arrRe = /\[(?:\{[\s\S]*?\}){3,}\]/g; // arrays with at least 3 objects
  let m: RegExpExecArray | null;
  while ((m = arrRe.exec(text))) {
    const raw = m[0];
    // Attempt to transform JS object literals to JSON: quote keys
    const candidate = raw
      .replace(/([,{\s])(\w+)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, '"$1"');
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) results.push(parsed);
    } catch {
      // ignore
    }
    if (results.length >= 3) break;
  }
  return results;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function toNumberOrString(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) return value;
  return null;
}

function normalizePools(arrays: unknown[]): PoolLike[] {
  // Pick the first array that looks like pools data
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    const sampleCandidate = arr[0];
    const sample: UnknownRecord =
      typeof sampleCandidate === "object" && sampleCandidate !== null
        ? (sampleCandidate as UnknownRecord)
        : {};
    const keys = Object.keys(sample);
    const hasApy = keys.some((k) => /apy|apr/i.test(k));
    const hasTvl = keys.some((k) => /tvl/i.test(k));
    if (!(hasApy && hasTvl)) continue;
    const normalized: PoolLike[] = [];
    for (const item of arr) {
      if (typeof item !== "object" || item === null) continue;
      const record = item as UnknownRecord;
      const aprCandidate = record.apr ?? record.apy ?? record.apy30d ?? null;
      const tvlCandidate = record.tvl ?? record.tvlUsd ?? record.tvl_usd ?? null;
      normalized.push({
        name:
          toOptionalString(record.name) ??
          toOptionalString(record.pool) ??
          toOptionalString(record.title),
        project:
          toOptionalString(record.project) ??
          toOptionalString(record.protocol),
        symbol:
          toOptionalString(record.symbol) ??
          toOptionalString(record.token),
        apr: toNumberOrString(aprCandidate),
        tvl: toNumberOrString(tvlCandidate),
        link:
          toOptionalString(record.link) ??
          toOptionalString(record.url),
      });
    }
    return normalized;
  }
  return [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";
  const ttl = Math.max(60, Math.min(3600, Number(url.searchParams.get("ttl") || TTL)));

  if (!refresh) {
    const cached = await kvGetJson<PoolLike[]>(KEY);
    if (cached) return NextResponse.json({ data: cached, cached: true });
  }

  // Fetch HTML
  const res = await fetch("https://plasma.stablewatch.io/", {
    headers: { "User-Agent": "yields.to-scraper" },
    cache: "no-store",
  });
  if (!res.ok) {
    return new NextResponse("Stablewatch unavailable", { status: 502 });
  }
  const html = await res.text();
  const scripts = extractScriptSrcs(html).filter((s) => s.includes("/_next/static/chunks/"));

  // Prefer the app page chunk if present
  const prioritized = [
    ...scripts.filter((s) => s.includes("app/page")),
    ...scripts.filter((s) => !s.includes("app/page")),
  ];

  let pools: PoolLike[] = [];
  for (const s of prioritized.slice(0, 5)) {
    try {
      const js = await fetch(toAbsolute(s), { headers: { "User-Agent": "yields.to-scraper" }, cache: "no-store" });
      if (!js.ok) continue;
      const text = await js.text();
      const arrays = tryExtractJsonArrays(text);
      const normalized = normalizePools(arrays);
      if (normalized.length > 0) {
        pools = normalized;
        break;
      }
    } catch {
      // ignore
    }
  }

  // Cache even empty result briefly to avoid hammering
  await kvSetJson(KEY, pools, ttl);
  return NextResponse.json({ data: pools, cached: false });
}
