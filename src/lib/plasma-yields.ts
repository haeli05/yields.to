'use server';

import { kvGetJson, kvSetJson } from '@/lib/kv';

export type PlasmaYieldPool = {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase?: number | null;
  apyReward?: number | null;
  apyPct1D?: number | null;
  apyPct7D?: number | null;
  apyPct30D?: number | null;
  pool: string;
  poolMeta?: string | null;
  il7d?: number | null;
  apyMean30d?: number | null;
  volumeUsd1d?: number | null;
  volumeUsd7d?: number | null;
  apyBaseInception?: number | null;
  underlyingTokens?: string[] | null;
  rewardTokens?: string[] | null;
  url?: string | null;
};

const KEY = 'defillama:plasma:yields:top50:v1';
const TTL_SECONDS = 60 * 20; // 20 minutes

type UpstreamResponse = {
  data?: unknown;
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
  const pools = Array.isArray(json.data) ? json.data : [];

  const normalizeString = (value: unknown, fallback: string): string =>
    typeof value === 'string' && value.trim().length > 0 ? value : fallback;

  const normalizeNullableString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value : null;

  const normalizeNumber = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

  const normalizeNullableNumber = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

  const normalizeNullableStringArray = (value: unknown): string[] | null => {
    if (!Array.isArray(value)) return null;
    const strings = value.filter(
      (entry): entry is string =>
        typeof entry === 'string' && entry.trim().length > 0,
    );
    return strings.length > 0 ? strings : null;
  };

  const normalized = pools
    .map((pool): PlasmaYieldPool | null => {
      if (typeof pool !== 'object' || pool === null) return null;
      const record = pool as Record<string, unknown>;
      const chain = normalizeNullableString(record.chain);
      const poolId = normalizeNullableString(record.pool);
      if (!chain || !poolId) return null;

      return {
        chain,
        project: normalizeString(record.project, 'Unknown'),
        symbol: normalizeString(record.symbol, '—'),
        tvlUsd: normalizeNumber(record.tvlUsd, 0),
        apy: normalizeNullableNumber(record.apy),
        apyBase: normalizeNullableNumber(record.apyBase),
        apyReward: normalizeNullableNumber(record.apyReward),
        apyPct1D: normalizeNullableNumber(record.apyPct1D),
        apyPct7D: normalizeNullableNumber(record.apyPct7D),
        apyPct30D: normalizeNullableNumber(record.apyPct30D),
        pool: poolId,
        poolMeta: normalizeNullableString(record.poolMeta),
        il7d: normalizeNullableNumber(record.il7d),
        apyMean30d: normalizeNullableNumber(record.apyMean30d),
        volumeUsd1d: normalizeNullableNumber(record.volumeUsd1d),
        volumeUsd7d: normalizeNullableNumber(record.volumeUsd7d),
        apyBaseInception: normalizeNullableNumber(record.apyBaseInception),
        underlyingTokens: normalizeNullableStringArray(record.underlyingTokens),
        rewardTokens: normalizeNullableStringArray(record.rewardTokens),
        url: normalizeNullableString(record.url),
      };
    })
    .filter((pool): pool is PlasmaYieldPool => pool !== null && pool.chain === 'Plasma')
    .sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))
    .slice(0, 50);

  await kvSetJson(KEY, normalized, TTL_SECONDS);

  return { data: normalized, cached: false };
}
