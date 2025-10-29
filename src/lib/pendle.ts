"use server";

import { kvGetJson, kvSetJson } from "@/lib/kv";

type GraphPairToken = {
  id: string;
  symbol?: string | null;
};

type GraphPair = {
  id: string;
  reserveUSD?: string | null;
  token0?: GraphPairToken;
  token1?: GraphPairToken;
};

type GraphPairDaily = {
  dayStartUnix: number;
  impliedYield?: string | null;
  marketWorthUSD?: string | null;
};

export type PendlePool = {
  pool: string;
  project: string;
  symbol: string;
  assets: string[];
  tvlUsd: number;
  apy: number | null;
};

export type PendleMonthlyRecord = {
  pool: string;
  monthDate: string; // YYYY-MM-01
  apy: number | null;
  tvlUsd: number | null;
  datapoints: number;
  project: string;
  symbol: string;
};

export type LoadPendleResult = {
  pools: PendlePool[];
  monthly: PendleMonthlyRecord[];
  cached: boolean;
};

const CACHE_KEY = "pendle:plasma:pools:v1";
const CACHE_TTL_SECONDS = 60 * 10;

type CachePayload = {
  pools: PendlePool[];
  monthly: PendleMonthlyRecord[];
};

const DEFAULT_REST_BASE = process.env.PENDLE_API_BASE_URL?.trim() || "https://api.pendle.finance";
const SUBGRAPH_ENDPOINT = process.env.PENDLE_SUBGRAPH_URL?.trim();
const RAW_CHAIN_ID = process.env.PENDLE_CHAIN_ID?.trim();

const CONCURRENCY = 4;
const MAX_MARKETS = 40;
const ONE_DAY_SECONDS = 86_400;
const DAYS_LOOKBACK = 365;

const safeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMonthDate = (unix: number): string => {
  const date = new Date(unix * 1000);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}-01`;
};

const fetchGraphQL = async <T>(endpoint: string, query: string, variables: Record<string, unknown>): Promise<T> => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Pendle subgraph request failed (${response.status})`);
  }

  const json = (await response.json()) as {
    data?: T;
    errors?: unknown;
  };

  if (json.errors) {
    throw new Error(`Pendle subgraph returned errors: ${JSON.stringify(json.errors)}`);
  }

  if (!json.data) {
    throw new Error("Pendle subgraph response missing data");
  }

  return json.data;
};

const fetchPairs = async (endpoint: string): Promise<GraphPair[]> => {
  const pairs: GraphPair[] = [];
  const pageSize = 40;
  let skip = 0;

  while (pairs.length < MAX_MARKETS) {
    const data = await fetchGraphQL<{ pairs: GraphPair[] }>(
      endpoint,
      `
        query PendlePairs($first: Int!, $skip: Int!) {
          pairs(first: $first, skip: $skip, orderBy: reserveUSD, orderDirection: desc) {
            id
            reserveUSD
            token0 { id symbol }
            token1 { id symbol }
          }
        }
      `,
      { first: pageSize, skip }
    );

    if (!data.pairs.length) break;
    pairs.push(...data.pairs);
    if (data.pairs.length < pageSize) break;
    skip += pageSize;
  }

  return pairs
    .filter((pair) => safeNumber(pair.reserveUSD) > 0)
    .slice(0, MAX_MARKETS);
};

const fetchMarketDetail = async (baseUrl: string, chainId: number, marketAddress: string) => {
  const url = new URL("/market-detail", baseUrl);
  url.searchParams.set("chainId", String(chainId));
  url.searchParams.set("marketAddress", marketAddress);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Pendle market detail fetch failed (${response.status})`);
  }

  return response.json() as Promise<{
    tokenReserves?: Array<{
      reserves?: {
        rawAmnt?: string;
        token?: {
          address?: string;
        };
      };
    }>;
    otherDetails?: {
      liquidity?: { amount?: string | number };
      swapFeeApr?: string | number;
      impliedYield?: string | number;
      underlyingYieldRate?: string | number;
    };
  }>;
};

const fetchPairDaily = async (endpoint: string, pairId: string): Promise<GraphPairDaily[]> => {
  const since = Math.floor(Date.now() / 1000) - DAYS_LOOKBACK * ONE_DAY_SECONDS;
  const data = await fetchGraphQL<{ pairDailyDatas: GraphPairDaily[] }>(
    endpoint,
    `
      query PendlePairDaily($pairId: String!, $since: Int!) {
        pairDailyDatas(
          first: 400,
          orderBy: dayStartUnix,
          orderDirection: desc,
          where: { pair: $pairId, dayStartUnix_gte: $since }
        ) {
          dayStartUnix
          impliedYield
          marketWorthUSD
        }
      }
    `,
    { pairId: pairId.toLowerCase(), since }
  );

  return data.pairDailyDatas ?? [];
};

const computeMonthlyRecords = (
  pool: string,
  project: string,
  symbol: string,
  daily: GraphPairDaily[],
): PendleMonthlyRecord[] => {
  if (!daily.length) return [];

  const monthMap = new Map<string, { impliedSum: number; tvlSum: number; count: number }>();

  for (const entry of daily) {
    const key = formatMonthDate(entry.dayStartUnix);
    const implied = safeNumber(entry.impliedYield);
    const tvl = safeNumber(entry.marketWorthUSD);

    const bucket = monthMap.get(key) ?? { impliedSum: 0, tvlSum: 0, count: 0 };
    bucket.impliedSum += implied;
    bucket.tvlSum += tvl;
    bucket.count += 1;
    monthMap.set(key, bucket);
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0))
    .slice(0, 12)
    .map(([monthDate, stats]) => {
      const meanImplied = stats.count > 0 ? stats.impliedSum / stats.count : 0;
      const meanTvl = stats.count > 0 ? stats.tvlSum / stats.count : 0;

      return {
        pool,
        monthDate,
        apy: Number.isFinite(meanImplied) ? meanImplied * 100 : null,
        tvlUsd: Number.isFinite(meanTvl) ? meanTvl : null,
        datapoints: stats.count,
        project,
        symbol,
      } as PendleMonthlyRecord;
    });
};

const mapWithConcurrency = async <T, R>(items: T[], limit: number, iterator: (item: T, index: number) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let current = 0;

  const worker = async () => {
    while (true) {
      const index = current;
      if (index >= items.length) break;
      current += 1;
      try {
        results[index] = await iterator(items[index], index);
      } catch (error) {
        console.error("Failed processing Pendle item", error);
        results[index] = undefined as unknown as R;
      }
    }
  };

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
};

export async function loadPendlePools(options: { refresh?: boolean } = {}): Promise<LoadPendleResult> {
  const refresh = options.refresh ?? false;

  if (!SUBGRAPH_ENDPOINT || !RAW_CHAIN_ID) {
    return { pools: [], monthly: [], cached: false };
  }

  const chainId = Number.parseInt(RAW_CHAIN_ID, 10);
  if (!Number.isFinite(chainId)) {
    return { pools: [], monthly: [], cached: false };
  }

  if (!refresh) {
    const cached = await kvGetJson<CachePayload>(CACHE_KEY);
    if (cached) {
      return { pools: cached.pools ?? [], monthly: cached.monthly ?? [], cached: true };
    }
  }

  const pairs = await fetchPairs(SUBGRAPH_ENDPOINT);

  const details = await mapWithConcurrency(pairs, CONCURRENCY, async (pair) => {
    const project = "Pendle";
    const tokenSymbols = [pair.token0?.symbol, pair.token1?.symbol]
      .filter((symbol): symbol is string => Boolean(symbol && symbol.trim().length > 0))
      .map((symbol) => symbol!);

    const assets = tokenSymbols.length ? tokenSymbols : [pair.token0?.id ?? "", pair.token1?.id ?? ""].filter(Boolean);
    const symbol = tokenSymbols.length ? tokenSymbols.join("/") : pair.id.slice(0, 10);

    try {
      const [detail, daily] = await Promise.all([
        fetchMarketDetail(DEFAULT_REST_BASE, chainId, pair.id),
        fetchPairDaily(SUBGRAPH_ENDPOINT, pair.id),
      ]);

      const liquidity = safeNumber(detail?.otherDetails?.liquidity?.amount);
      if (liquidity <= 0) {
        return null;
      }
      const impliedYield = safeNumber(detail?.otherDetails?.impliedYield);
      const swapFeeApr = safeNumber(detail?.otherDetails?.swapFeeApr);
      const underlyingYield = safeNumber(detail?.otherDetails?.underlyingYieldRate);
      const apyDecimal = impliedYield + swapFeeApr + underlyingYield;

      const pool: PendlePool = {
        pool: pair.id,
        project,
        symbol,
        assets,
        tvlUsd: liquidity,
        apy: Number.isFinite(apyDecimal) ? apyDecimal * 100 : null,
      };

      const monthly = computeMonthlyRecords(pair.id, project, symbol, daily);

      return { pool, monthly };
    } catch (error) {
      console.error("Pendle market fetch failed", { pool: pair.id, error });
      return null;
    }
  });

  const pools: PendlePool[] = [];
  const monthly: PendleMonthlyRecord[] = [];

  for (const entry of details) {
    if (!entry) continue;
    pools.push(entry.pool);
    monthly.push(...entry.monthly);
  }

  await kvSetJson<CachePayload>(CACHE_KEY, { pools, monthly }, CACHE_TTL_SECONDS);

  return { pools, monthly, cached: false };
}
