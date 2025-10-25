'use server';

import { kvGetJson, kvSetJson } from '@/lib/kv';

export type StablewatchPool = {
  name?: string;
  project?: string;
  symbol?: string;
  apr?: number | string | null;
  tvl?: number | string | null;
  link?: string;
};

const SCRAPE_USER_AGENT = 'yields.to-scraper';

function extractScriptSrcs(html: string): string[] {
  const srcs: string[] = [];
  const re = /<script[^>]+src=\"([^\"]+)\"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    srcs.push(match[1]);
  }
  return srcs;
}

function toAbsolute(url: string): string {
  if (url.startsWith('http')) return url;
  return `https://plasma.stablewatch.io${url}`;
}

type UnknownRecord = Record<string, unknown>;

function tryExtractJsonArrays(text: string): unknown[] {
  const results: unknown[] = [];
  const arrRe = /\[(?:\{[\s\S]*?\}){3,}\]/g;
  let match: RegExpExecArray | null;
  while ((match = arrRe.exec(text))) {
    const raw = match[0];
    const candidate = raw
      .replace(/([,{\s])(\w+)\s*:/g, '$1"$2":')
      .replace(/'([^']*)'/g, '"$1"');
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) results.push(parsed);
    } catch {
      // ignore malformed snippets
    }
    if (results.length >= 3) break;
  }
  return results;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function toNumberOrString(value: unknown): number | string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) return value;
  return null;
}

function normalizePools(arrays: unknown[]): StablewatchPool[] {
  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;
    const sampleCandidate = arr[0];
    const sample: UnknownRecord =
      typeof sampleCandidate === 'object' && sampleCandidate !== null
        ? (sampleCandidate as UnknownRecord)
        : {};
    const keys = Object.keys(sample);
    const hasApy = keys.some((key) => /apy|apr/i.test(key));
    const hasTvl = keys.some((key) => /tvl/i.test(key));
    if (!(hasApy && hasTvl)) continue;

    const normalized: StablewatchPool[] = [];
    for (const item of arr) {
      if (typeof item !== 'object' || item === null) continue;
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

export type StablewatchOptions = {
  refresh?: boolean;
  ttlSeconds?: number;
};

const DEFAULT_CACHE_KEY = 'stablewatch:plasma:pools:v1';
const DEFAULT_TTL = 60 * 10;

async function scrapeStablewatch(): Promise<StablewatchPool[]> {
  const res = await fetch('https://plasma.stablewatch.io/', {
    headers: { 'User-Agent': SCRAPE_USER_AGENT },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Stablewatch unavailable: ${res.status}`);
  }
  const html = await res.text();
  const scripts = extractScriptSrcs(html).filter((src) =>
    src.includes('/_next/static/chunks/'),
  );
  const prioritized = [
    ...scripts.filter((src) => src.includes('app/page')),
    ...scripts.filter((src) => !src.includes('app/page')),
  ];

  for (const script of prioritized.slice(0, 5)) {
    try {
      const js = await fetch(toAbsolute(script), {
        headers: { 'User-Agent': SCRAPE_USER_AGENT },
        cache: 'no-store',
      });
      if (!js.ok) continue;
      const text = await js.text();
      const arrays = tryExtractJsonArrays(text);
      const normalized = normalizePools(arrays);
      if (normalized.length > 0) {
        return normalized;
      }
    } catch {
      // ignore individual script failures
    }
  }

  return [];
}

export async function loadStablewatchPools(
  options: StablewatchOptions = {},
): Promise<{ data: StablewatchPool[]; cached: boolean }> {
  const { refresh = false, ttlSeconds = DEFAULT_TTL } = options;

  if (!refresh) {
    const cached = await kvGetJson<StablewatchPool[]>(DEFAULT_CACHE_KEY);
    if (cached) {
      return { data: cached, cached: true };
    }
  }

  const pools = await scrapeStablewatch();
  await kvSetJson(DEFAULT_CACHE_KEY, pools, ttlSeconds);
  return { data: pools, cached: false };
}

export async function scrapeStablewatchPools(): Promise<StablewatchPool[]> {
  return scrapeStablewatch();
}
