'use server';

import { kvGetJson, kvSetJson } from '@/lib/kv';

export type PlasmaYieldPool = {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase?: number | null;
  apyPct30D?: number | null;
  pool: string;
};

const KEY = 'defillama:plasma:yields:top50:v1';
const TTL_SECONDS = 60 * 15; // 15 minutes

type UpstreamResponse = {
  data?: PlasmaYieldPool[];
};

type LoadOptions = {
  refresh?: boolean;
};

export async function loadPlasmaYields(
  options: LoadOptions = {},
): Promise<{ data: PlasmaYieldPool[]; cached: boolean }> {
  const { refresh = false } = options;

  if (!refresh) {
    const cached = await kvGetJson<PlasmaYieldPool[]>(KEY);
    if (cached) {
      return { data: cached, cached: true };
    }
  }

  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma', {
    cache: 'no-store',
    headers: { 'User-Agent': 'yields.to-aggregator' },
  });

  if (!response.ok) {
    throw new Error('Upstream yields unavailable');
  }

  const json = (await response.json()) as UpstreamResponse;
  const trimmed = (json.data ?? [])
    .filter((pool) => pool.chain === 'Plasma')
    .sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))
    .slice(0, 50)
    .map(
      ({
        chain,
        project,
        symbol,
        tvlUsd,
        apy,
        apyBase,
        apyPct30D,
        pool,
      }) => ({
        chain,
        project,
        symbol,
        tvlUsd,
        apy,
        apyBase: apyBase ?? null,
        apyPct30D: apyPct30D ?? null,
        pool,
      }),
    );

  await kvSetJson(KEY, trimmed, TTL_SECONDS);

  return { data: trimmed, cached: false };
}
