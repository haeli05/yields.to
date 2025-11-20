"use server";

import { kvGetJson, kvSetJson } from "@/lib/kv";

// Pendle RESTful API v2 Types
type PendleMarket = {
  address: string;
  chainId: number;
  symbol: string;
  expiry: string;
  pt: {
    address: string;
    symbol: string;
    decimals: number;
  };
  yt: {
    address: string;
    symbol: string;
    decimals: number;
  };
  sy: {
    address: string;
    symbol: string;
    decimals: number;
  };
  underlyingAsset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  liquidity: {
    usd: number;
  };
  totalPt: string;
  totalSy: string;
  totalYt: string;
  impliedApy: number;
  underlyingApy: number;
  ytFloatingApy: number;
  lpApy: number;
  aggregatedApy: number;
  underlyingInterestApy: number;
  underlyingRewardApy: number;
  impliedApyPct1D: number | null;
  impliedApyPct7D: number | null;
  impliedApyPct30D: number | null;
};

export type PendlePool = {
  pool: string;
  project: string;
  symbol: string;
  assets: string[];
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;
  underlyingApy: number | null;
  lpApy: number | null;
  expiry: string | null;
  apyPct1d: number | null;
  apyPct7d: number | null;
  apyPct30d: number | null;
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

const CACHE_KEY = "pendle:plasma:pools:v2";
const CACHE_TTL_SECONDS = 60 * 20; // 20 minutes

type CachePayload = {
  pools: PendlePool[];
  monthly: PendleMonthlyRecord[];
};

const PENDLE_API_BASE = "https://api-v2.pendle.finance/core";
const PLASMA_CHAIN_ID = 9745;

// Fetch active markets from Pendle API v2
const fetchPendleMarkets = async (chainId: number): Promise<PendleMarket[]> => {
  const url = `${PENDLE_API_BASE}/v1/${chainId}/markets`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1200 }, // Cache for 20 minutes
    });

    if (!response.ok) {
      throw new Error(`Pendle API returned ${response.status}`);
    }

    const data = await response.json();

    // The API returns an array of markets directly
    if (Array.isArray(data)) {
      return data as PendleMarket[];
    }

    // Or it might return { results: [...] }
    if (data.results && Array.isArray(data.results)) {
      return data.results as PendleMarket[];
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch Pendle markets:", error);
    return [];
  }
};

// Extract asset symbols from Pendle market
const extractAssets = (market: PendleMarket): string[] => {
  const assets: string[] = [];

  // Add underlying asset
  if (market.underlyingAsset?.symbol) {
    assets.push(market.underlyingAsset.symbol);
  }

  // Add PT symbol if different
  if (market.pt?.symbol && !assets.includes(market.pt.symbol)) {
    // Remove PT- prefix if present
    const cleanSymbol = market.pt.symbol.replace(/^PT-/i, '');
    if (!assets.includes(cleanSymbol)) {
      assets.push(cleanSymbol);
    }
  }

  return assets.length > 0 ? assets : ["Unknown"];
};

export async function loadPendlePools(options: { refresh?: boolean } = {}): Promise<LoadPendleResult> {
  const refresh = options.refresh ?? false;

  // Check cache first
  if (!refresh) {
    const cached = await kvGetJson<CachePayload>(CACHE_KEY);
    if (cached) {
      return { pools: cached.pools ?? [], monthly: cached.monthly ?? [], cached: true };
    }
  }

  try {
    // Fetch markets from Pendle API v2
    const markets = await fetchPendleMarkets(PLASMA_CHAIN_ID);

    if (!markets.length) {
      return { pools: [], monthly: [], cached: false };
    }

    // Transform to our pool format
    const pools: PendlePool[] = markets
      .filter((market) => market.liquidity?.usd > 0)
      .map((market) => {
        const assets = extractAssets(market);

        return {
          pool: market.address,
          project: "Pendle",
          symbol: market.symbol || `${market.pt?.symbol || 'PT'}-${market.underlyingAsset?.symbol || 'Unknown'}`,
          assets,
          tvlUsd: market.liquidity.usd,
          apy: market.aggregatedApy ? market.aggregatedApy * 100 : null,
          apyBase: market.impliedApy ? market.impliedApy * 100 : null,
          apyReward: market.underlyingRewardApy ? market.underlyingRewardApy * 100 : null,
          underlyingApy: market.underlyingApy ? market.underlyingApy * 100 : null,
          lpApy: market.lpApy ? market.lpApy * 100 : null,
          expiry: market.expiry || null,
          apyPct1d: market.impliedApyPct1D,
          apyPct7d: market.impliedApyPct7D,
          apyPct30d: market.impliedApyPct30D,
        };
      });

    // For now, we don't have historical monthly data from the REST API
    // This would require fetching historical data for each market
    const monthly: PendleMonthlyRecord[] = [];

    // Cache the results
    await kvSetJson<CachePayload>(CACHE_KEY, { pools, monthly }, CACHE_TTL_SECONDS);

    return { pools, monthly, cached: false };
  } catch (error) {
    console.error("Failed to load Pendle pools:", error);
    return { pools: [], monthly: [], cached: false };
  }
}
