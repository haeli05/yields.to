# API Integration Guide - Plasma Chain Yield Sources

**Last Updated:** October 23, 2025
**Purpose:** Step-by-step guide to fetch and integrate yield data from each Plasma chain protocol

---

## Table of Contents

1. [DeFiLlama Yields API (Primary Source)](#1-defillama-yields-api-primary-source)
2. [Maple Finance Data](#2-maple-finance-data)
3. [Pendle Finance API](#3-pendle-finance-api)
4. [Ethena Labs API](#4-ethena-labs-api)
5. [Lithos Protocol](#5-lithos-protocol)
6. [Complete Integration Example](#6-complete-integration-example)

---

## 1. DeFiLlama Yields API (Primary Source)

### Overview
DeFiLlama is the **recommended primary data source** as it aggregates data from all major protocols including Maple, Pendle, Ethena, and others. It's already integrated in your codebase.

### Base Endpoint
```
https://yields.llama.fi/pools
```

### Query Parameters
- `chain` - Filter by blockchain (e.g., `Plasma`, `Ethereum`)

### Response Format
```typescript
interface YieldPoolResponse {
  status: string;
  data: YieldPool[];
}

interface YieldPool {
  chain: string;              // e.g., "Plasma"
  project: string;            // e.g., "maple-finance", "pendle", "ethena"
  symbol: string;             // e.g., "syrupUSDT", "PT-sUSDe-27MAR2025"
  tvlUsd: number;             // Total Value Locked in USD
  apy: number | null;         // Annual Percentage Yield (total)
  apyBase?: number | null;    // Base APY from fees/lending
  apyReward?: number | null;  // APY from reward tokens
  apyBase7d?: number | null;  // 7-day average base APY
  apyPct1D?: number | null;   // 1-day APY change %
  apyPct7D?: number | null;   // 7-day APY change %
  apyPct30D?: number | null;  // 30-day APY change %
  stablecoin?: boolean;       // Is this a stablecoin pool?
  ilRisk?: string;            // Impermanent loss risk ("yes"/"no")
  exposure?: string;          // Asset exposure (e.g., "single")
  predictions?: {
    predictedClass: string;
    predictedProbability: number;
    binnedConfidence: number;
  };
  pool: string;               // Unique pool ID
  poolMeta?: string;          // Additional metadata
  mu?: number;                // Mean APY
  sigma?: number;             // Standard deviation of APY
  count?: number;             // Number of data points
  outlier?: boolean;          // Is this an outlier?
  underlyingTokens?: string[]; // Token addresses
  rewardTokens?: string[];    // Reward token addresses
  url?: string;               // Link to protocol
}
```

### Code Example: Fetch All Plasma Yields

#### Option A: Server-Side (Next.js App Router)
```typescript
// src/app/dashboard/page.tsx (already implemented)
export default async function DashboardPage() {
  const response = await fetch("https://yields.llama.fi/pools?chain=Plasma", {
    next: { revalidate: 60 * 30 }, // Revalidate every 30 minutes
  });

  if (!response.ok) {
    throw new Error("Unable to fetch Plasma yield data from DeFiLlama.");
  }

  const json = await response.json();
  const pools = json.data ?? [];

  return <YieldDashboard pools={pools} />;
}
```

#### Option B: Client-Side (React Component)
```typescript
// src/hooks/usePlasmaYields.ts
import { useEffect, useState } from 'react';

interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase?: number | null;
  apyReward?: number | null;
  pool: string;
}

export function usePlasmaYields() {
  const [pools, setPools] = useState<YieldPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchYields() {
      try {
        const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
        if (!response.ok) throw new Error('Failed to fetch yields');

        const json = await response.json();
        setPools(json.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    fetchYields();

    // Refresh every 5 minutes
    const interval = setInterval(fetchYields, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { pools, loading, error };
}
```

### Filter by Specific Protocol

```typescript
// Filter Maple Finance pools
const maplePools = pools.filter(p =>
  p.project.toLowerCase().includes('maple')
);

// Filter Pendle Finance pools
const pendlePools = pools.filter(p =>
  p.project.toLowerCase().includes('pendle')
);

// Filter Ethena pools
const ethenaPools = pools.filter(p =>
  p.project.toLowerCase().includes('ethena')
);

// Filter Lithos pools
const lithosPools = pools.filter(p =>
  p.project.toLowerCase().includes('lithos')
);
```

### Filter by Asset Type

```typescript
// Syrup products (Maple)
const syrupPools = pools.filter(p =>
  p.symbol.toLowerCase().includes('syrup')
);

// Pendle PT/YT tokens
const ptPools = pools.filter(p =>
  p.symbol.includes('PT-') || p.symbol.includes('YT-')
);

// sUSDe pools
const susdePools = pools.filter(p =>
  p.symbol.toLowerCase().includes('susde') ||
  p.symbol.toLowerCase().includes('usde')
);

// Stablecoin pools only
const stablecoinPools = pools.filter(p => p.stablecoin === true);

// High yield pools (>10% APY)
const highYieldPools = pools.filter(p => p.apy && p.apy > 10);
```

### Example: Enhanced Data Model

```typescript
// src/lib/yields.ts
export interface EnhancedYieldPool {
  // Original DeFiLlama data
  id: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyBase: number | null;
  apyReward: number | null;

  // Enhanced fields
  protocol: 'Maple' | 'Pendle' | 'Ethena' | 'Lithos' | 'Aave' | 'Fluid' | 'Other';
  yieldType: 'Stablecoin Vault' | 'Yield Trading' | 'Staked Stablecoin' | 'DEX Liquidity' | 'Lending';
  riskLevel: 'Low' | 'Medium' | 'High';
  rewardTokens: string[];

  // Calculated fields
  realAPY: number; // apyBase + apyReward
  apyBreakdown: {
    base: number;
    rewards: number;
  };
}

export function enhancePoolData(pool: YieldPool): EnhancedYieldPool {
  const protocol = detectProtocol(pool.project);
  const yieldType = detectYieldType(pool.symbol, pool.project);
  const riskLevel = assessRisk(pool);

  return {
    id: pool.pool,
    chain: pool.chain,
    project: pool.project,
    symbol: pool.symbol,
    tvlUsd: pool.tvlUsd,
    apy: pool.apy,
    apyBase: pool.apyBase ?? 0,
    apyReward: pool.apyReward ?? 0,
    protocol,
    yieldType,
    riskLevel,
    rewardTokens: pool.rewardTokens ?? [],
    realAPY: (pool.apyBase ?? 0) + (pool.apyReward ?? 0),
    apyBreakdown: {
      base: pool.apyBase ?? 0,
      rewards: pool.apyReward ?? 0,
    },
  };
}

function detectProtocol(project: string): EnhancedYieldPool['protocol'] {
  const lower = project.toLowerCase();
  if (lower.includes('maple')) return 'Maple';
  if (lower.includes('pendle')) return 'Pendle';
  if (lower.includes('ethena')) return 'Ethena';
  if (lower.includes('lithos')) return 'Lithos';
  if (lower.includes('aave')) return 'Aave';
  if (lower.includes('fluid')) return 'Fluid';
  return 'Other';
}

function detectYieldType(symbol: string, project: string): EnhancedYieldPool['yieldType'] {
  const text = `${symbol} ${project}`.toLowerCase();

  if (text.includes('syrup')) return 'Stablecoin Vault';
  if (text.includes('pt-') || text.includes('yt-')) return 'Yield Trading';
  if (text.includes('susde') || text.includes('staked')) return 'Staked Stablecoin';
  if (text.includes('lp') || text.includes('lithos')) return 'DEX Liquidity';
  if (text.includes('aave') || text.includes('fluid') || text.includes('euler')) return 'Lending';

  return 'Lending';
}

function assessRisk(pool: YieldPool): 'Low' | 'Medium' | 'High' {
  // High TVL + stablecoin = lower risk
  if (pool.tvlUsd > 100_000_000 && pool.stablecoin) return 'Low';

  // Very high APY might indicate higher risk
  if (pool.apy && pool.apy > 50) return 'High';

  // Medium for everything else
  return 'Medium';
}
```

---

## 2. Maple Finance Data

### Primary Source: DeFiLlama
**Recommended:** Use DeFiLlama API filtered by project name.

```typescript
// Fetch Maple pools from DeFiLlama
async function fetchMapleYields() {
  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
  const json = await response.json();

  return json.data.filter((pool: YieldPool) =>
    pool.project.toLowerCase().includes('maple')
  );
}
```

### Secondary Source: Maple GraphQL API

**Endpoint:** Not publicly documented, but Maple uses The Graph protocol
**Use Case:** For detailed pool data not available in DeFiLlama

#### GraphQL Query Example
```graphql
query GetMapleVault($vaultAddress: String!) {
  vault(id: $vaultAddress) {
    id
    name
    asset {
      symbol
      decimals
    }
    totalAssets
    totalSupply
    exchangeRate
    apy
  }
}
```

#### TypeScript Implementation
```typescript
// src/lib/maple-api.ts
interface MapleVault {
  id: string;
  name: string;
  asset: {
    symbol: string;
    decimals: number;
  };
  totalAssets: string;
  totalSupply: string;
  exchangeRate: string;
  apy: number;
}

async function fetchMapleVaultData(vaultAddress: string): Promise<MapleVault> {
  const query = `
    query GetMapleVault($vaultAddress: String!) {
      vault(id: $vaultAddress) {
        id
        name
        asset {
          symbol
          decimals
        }
        totalAssets
        totalSupply
        exchangeRate
        apy
      }
    }
  `;

  // Note: Replace with actual Maple subgraph endpoint when available
  const MAPLE_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/maple-labs/maple-v2';

  const response = await fetch(MAPLE_SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { vaultAddress },
    }),
  });

  const json = await response.json();
  return json.data.vault;
}
```

### Maple Data Structure

```typescript
interface MapleYieldData {
  protocol: 'Maple Finance';
  products: {
    syrupUSDT: {
      tvl: number;
      apy: number;
      chain: 'Plasma';
      vaultAddress: string;
      description: 'Institutional-grade USDT yield vault';
    };
    syrupUSDC: {
      tvl: number;
      apy: number;
      chain: 'Plasma' | 'Ethereum';
      vaultAddress: string;
      description: 'Institutional-grade USDC yield vault';
    };
  };
  totalTVL: number;
  averageAPY: number;
}

// Example data transformation
function transformMapleData(pools: YieldPool[]): MapleYieldData {
  const maplePools = pools.filter(p => p.project.toLowerCase().includes('maple'));

  const syrupUSDT = maplePools.find(p => p.symbol.includes('syrupUSDT'));
  const syrupUSDC = maplePools.find(p => p.symbol.includes('syrupUSDC'));

  return {
    protocol: 'Maple Finance',
    products: {
      syrupUSDT: {
        tvl: syrupUSDT?.tvlUsd ?? 0,
        apy: syrupUSDT?.apy ?? 0,
        chain: 'Plasma',
        vaultAddress: syrupUSDT?.pool ?? '',
        description: 'Institutional-grade USDT yield vault',
      },
      syrupUSDC: {
        tvl: syrupUSDC?.tvlUsd ?? 0,
        apy: syrupUSDC?.apy ?? 0,
        chain: (syrupUSDC?.chain as 'Plasma' | 'Ethereum') ?? 'Plasma',
        vaultAddress: syrupUSDC?.pool ?? '',
        description: 'Institutional-grade USDC yield vault',
      },
    },
    totalTVL: maplePools.reduce((sum, p) => sum + p.tvlUsd, 0),
    averageAPY: maplePools.reduce((sum, p) => sum + (p.apy ?? 0), 0) / maplePools.length,
  };
}
```

### Where to Display Maple Data

```typescript
// src/app/maple-yields/page.tsx
export default async function MapleYieldsPage() {
  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma', {
    next: { revalidate: 1800 }, // 30 minutes
  });

  const json = await response.json();
  const maplePools = json.data.filter((p: YieldPool) =>
    p.project.toLowerCase().includes('maple')
  );

  return (
    <main>
      <h1>Maple Finance Yields on Plasma</h1>

      {maplePools.map(pool => (
        <PoolCard
          key={pool.pool}
          name={pool.symbol}
          tvl={pool.tvlUsd}
          apy={pool.apy}
          apyBase={pool.apyBase}
          apyReward={pool.apyReward}
          description={
            pool.symbol.includes('syrupUSDT')
              ? 'Institutional-grade USDT yield vault'
              : 'Institutional-grade USDC yield vault'
          }
        />
      ))}
    </main>
  );
}
```

---

## 3. Pendle Finance API

### Primary Source: DeFiLlama
```typescript
async function fetchPendleYields() {
  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
  const json = await response.json();

  return json.data.filter((pool: YieldPool) =>
    pool.project.toLowerCase().includes('pendle')
  );
}
```

### Secondary Source: Pendle Official API

**Base URL:** `https://api-v2.pendle.finance/core`
**Documentation:** https://api-v2.pendle.finance/core/docs
**Chain ID for Plasma:** `9745`

#### Available Endpoints

##### 1. Get All Markets
```
GET https://api-v2.pendle.finance/core/v1/{chainId}/markets
```

**Example Request:**
```typescript
// src/lib/pendle-api.ts
const PLASMA_CHAIN_ID = 9745;

interface PendleMarket {
  address: string;
  chainId: number;
  name: string;
  symbol: string;
  expiry: string;
  pt: {
    address: string;
    symbol: string;
  };
  yt: {
    address: string;
    symbol: string;
  };
  sy: {
    address: string;
    symbol: string;
  };
  liquidity: {
    usd: number;
  };
  underlyingApy: number;
  impliedApy: number;
  ytFloatingApy: number;
}

async function fetchPendleMarkets(): Promise<PendleMarket[]> {
  const response = await fetch(
    `https://api-v2.pendle.finance/core/v1/${PLASMA_CHAIN_ID}/markets`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Pendle markets');
  }

  const data = await response.json();
  return data.results ?? [];
}
```

##### 2. Get Market Details
```
GET https://api-v2.pendle.finance/core/v2/{chainId}/markets/{marketAddress}
```

**Example Request:**
```typescript
async function fetchPendleMarketDetails(marketAddress: string) {
  const response = await fetch(
    `https://api-v2.pendle.finance/core/v2/${PLASMA_CHAIN_ID}/markets/${marketAddress}`
  );

  const data = await response.json();
  return data;
}
```

**Response includes:**
- Market address and metadata
- PT (Principal Token) details
- YT (Yield Token) details
- Current APY for both PT and YT
- Liquidity depth
- Trading volume

##### 3. Get Historical APY Data
```
GET https://api-v2.pendle.finance/core/v1/{chainId}/markets/{marketAddress}/apy-history
```

**Example Request:**
```typescript
interface ApyDataPoint {
  timestamp: number;
  impliedApy: number;
  underlyingApy: number;
  ytFloatingApy: number;
}

async function fetchPendleApyHistory(
  marketAddress: string,
  period: '1d' | '7d' | '30d' | '90d' = '30d'
): Promise<ApyDataPoint[]> {
  const response = await fetch(
    `https://api-v2.pendle.finance/core/v1/${PLASMA_CHAIN_ID}/markets/${marketAddress}/apy-history?period=${period}`
  );

  const data = await response.json();
  return data.data ?? [];
}
```

#### Complete Pendle Integration Example

```typescript
// src/lib/pendle-integration.ts
export interface PendleYieldData {
  markets: {
    address: string;
    name: string;
    expiry: Date;
    liquidity: number;
    ptApy: number; // Fixed rate
    ytApy: number; // Variable rate
    underlyingAsset: string;
  }[];
  totalLiquidity: number;
  averagePtApy: number;
  averageYtApy: number;
}

export async function fetchCompletePendleData(): Promise<PendleYieldData> {
  const markets = await fetchPendleMarkets();

  const enrichedMarkets = markets.map(market => ({
    address: market.address,
    name: market.name,
    expiry: new Date(market.expiry),
    liquidity: market.liquidity.usd,
    ptApy: market.impliedApy,
    ytApy: market.ytFloatingApy,
    underlyingAsset: market.sy.symbol,
  }));

  const totalLiquidity = enrichedMarkets.reduce((sum, m) => sum + m.liquidity, 0);
  const avgPtApy = enrichedMarkets.reduce((sum, m) => sum + m.ptApy, 0) / enrichedMarkets.length;
  const avgYtApy = enrichedMarkets.reduce((sum, m) => sum + m.ytApy, 0) / enrichedMarkets.length;

  return {
    markets: enrichedMarkets,
    totalLiquidity,
    averagePtApy: avgPtApy,
    averageYtApy: avgYtApy,
  };
}
```

#### Display Pendle Data

```typescript
// src/app/pendle-yields/page.tsx
export default async function PendleYieldsPage() {
  const pendleData = await fetchCompletePendleData();

  return (
    <main>
      <h1>Pendle Finance Yields on Plasma</h1>

      <div className="stats">
        <StatCard
          title="Total Liquidity"
          value={`$${(pendleData.totalLiquidity / 1_000_000).toFixed(2)}M`}
        />
        <StatCard
          title="Avg PT APY (Fixed)"
          value={`${pendleData.averagePtApy.toFixed(2)}%`}
        />
        <StatCard
          title="Avg YT APY (Variable)"
          value={`${pendleData.averageYtApy.toFixed(2)}%`}
        />
      </div>

      <div className="markets">
        {pendleData.markets.map(market => (
          <MarketCard
            key={market.address}
            name={market.name}
            expiry={market.expiry}
            liquidity={market.liquidity}
            ptApy={market.ptApy}
            ytApy={market.ytApy}
            underlyingAsset={market.underlyingAsset}
          />
        ))}
      </div>
    </main>
  );
}
```

---

## 4. Ethena Labs API

### Primary Source: DeFiLlama
```typescript
async function fetchEthenaYields() {
  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
  const json = await response.json();

  return json.data.filter((pool: YieldPool) =>
    pool.project.toLowerCase().includes('ethena') ||
    pool.symbol.toLowerCase().includes('usde') ||
    pool.symbol.toLowerCase().includes('susde')
  );
}
```

### Secondary Source: Ethena Public API

**Base URL:** `https://public.api.ethena.fi`
**Documentation:** https://docs.ethena.fi/api-documentation/overview
**Note:** Some endpoints require whitelisting

#### Available Endpoints

##### 1. Get sUSDe APY
```
GET https://public.api.ethena.fi/api/v1/staking/apy
```

**Example Request:**
```typescript
// src/lib/ethena-api.ts
interface EthenaApyResponse {
  apy: number;
  timestamp: string;
}

async function fetchSUsdeApy(): Promise<number> {
  try {
    const response = await fetch('https://public.api.ethena.fi/api/v1/staking/apy');

    if (!response.ok) {
      console.warn('Ethena API unavailable, falling back to DeFiLlama');
      return 0;
    }

    const data: EthenaApyResponse = await response.json();
    return data.apy;
  } catch (error) {
    console.error('Error fetching Ethena APY:', error);
    return 0;
  }
}
```

##### 2. Get USDe/sUSDe Stats
```
GET https://public.api.ethena.fi/api/v1/stats
```

**Example Request:**
```typescript
interface EthenaStats {
  totalSupply: {
    usde: number;
    susde: number;
  };
  tvl: number;
  apy: number;
  exchangeRate: number; // sUSDe to USDe
}

async function fetchEthenaStats(): Promise<EthenaStats> {
  const response = await fetch('https://public.api.ethena.fi/api/v1/stats');
  const data = await response.json();

  return {
    totalSupply: {
      usde: data.usdeSupply ?? 0,
      susde: data.susdeSupply ?? 0,
    },
    tvl: data.tvl ?? 0,
    apy: data.apy ?? 0,
    exchangeRate: data.exchangeRate ?? 1,
  };
}
```

#### Hybrid Approach: Combine DeFiLlama + Ethena API

```typescript
// src/lib/ethena-integration.ts
export interface EthenaYieldData {
  protocol: 'Ethena';
  products: {
    usde: {
      supply: number;
      pools: YieldPool[];
    };
    susde: {
      supply: number;
      apy: number;
      exchangeRate: number;
      pools: YieldPool[];
    };
  };
  totalTVL: number;
  plasmaIntegrations: {
    aave: YieldPool[];
    pendle: YieldPool[];
    curve: YieldPool[];
  };
}

export async function fetchCompleteEthenaData(): Promise<EthenaYieldData> {
  // Fetch from both sources in parallel
  const [defillama Response, ethenaStats] = await Promise.all([
    fetch('https://yields.llama.fi/pools?chain=Plasma'),
    fetchEthenaStats().catch(() => null),
  ]);

  const defillamaData = await defillamaResponse.json();
  const ethenaPools = defillamaData.data.filter((p: YieldPool) =>
    p.symbol.toLowerCase().includes('usde')
  );

  const usdePools = ethenaPools.filter((p: YieldPool) =>
    !p.symbol.toLowerCase().includes('susde')
  );
  const susdePools = ethenaPools.filter((p: YieldPool) =>
    p.symbol.toLowerCase().includes('susde')
  );

  return {
    protocol: 'Ethena',
    products: {
      usde: {
        supply: ethenaStats?.totalSupply.usde ?? 0,
        pools: usdePools,
      },
      susde: {
        supply: ethenaStats?.totalSupply.susde ?? 0,
        apy: ethenaStats?.apy ?? (susdePools[0]?.apy ?? 0),
        exchangeRate: ethenaStats?.exchangeRate ?? 1,
        pools: susdePools,
      },
    },
    totalTVL: ethenaStats?.tvl ?? ethenaPools.reduce((sum, p) => sum + p.tvlUsd, 0),
    plasmaIntegrations: {
      aave: ethenaPools.filter(p => p.project.toLowerCase().includes('aave')),
      pendle: ethenaPools.filter(p => p.project.toLowerCase().includes('pendle')),
      curve: ethenaPools.filter(p => p.project.toLowerCase().includes('curve')),
    },
  };
}
```

---

## 5. Lithos Protocol

### Primary Source: DeFiLlama
```typescript
async function fetchLithosYields() {
  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
  const json = await response.json();

  return json.data.filter((pool: YieldPool) =>
    pool.project.toLowerCase().includes('lithos')
  );
}
```

### Secondary Source: On-Chain Data

Since Lithos is a DEX, you can query pool data directly from smart contracts or through The Graph if they have a subgraph deployed.

#### Potential Subgraph Query (if available)
```graphql
query GetLithosPools {
  pairs(first: 100, orderBy: reserveUSD, orderDirection: desc) {
    id
    token0 {
      symbol
      id
    }
    token1 {
      symbol
      id
    }
    reserve0
    reserve1
    reserveUSD
    volumeUSD
    apr
  }
}
```

#### TypeScript Implementation
```typescript
// src/lib/lithos-api.ts
interface LithosPool {
  id: string;
  token0: string;
  token1: string;
  liquidity: number;
  volume24h: number;
  apr: number;
  fees24h: number;
}

async function fetchLithosPools(): Promise<LithosPool[]> {
  // First try DeFiLlama
  const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
  const json = await response.json();

  const lithosPools = json.data.filter((p: YieldPool) =>
    p.project.toLowerCase().includes('lithos')
  );

  return lithosPools.map((p: YieldPool) => ({
    id: p.pool,
    token0: p.symbol.split('-')[0] ?? '',
    token1: p.symbol.split('-')[1] ?? '',
    liquidity: p.tvlUsd,
    volume24h: 0, // Not available in DeFiLlama
    apr: p.apy ?? 0,
    fees24h: 0, // Not available in DeFiLlama
  }));
}
```

---

## 6. Complete Integration Example

### Unified Data Fetcher

```typescript
// src/lib/plasma-yields-aggregator.ts
export interface PlasmaYieldAggregator {
  maple: MapleYieldData;
  pendle: PendleYieldData;
  ethena: EthenaYieldData;
  lithos: YieldPool[];
  all: YieldPool[];
  summary: {
    totalTVL: number;
    averageAPY: number;
    poolCount: number;
    protocolCount: number;
  };
}

export async function fetchAllPlasmaYields(): Promise<PlasmaYieldAggregator> {
  // Fetch all data in parallel for performance
  const [
    defillamaResponse,
    pendleData,
    ethenaData,
  ] = await Promise.all([
    fetch('https://yields.llama.fi/pools?chain=Plasma'),
    fetchCompletePendleData().catch(() => ({ markets: [], totalLiquidity: 0, averagePtApy: 0, averageYtApy: 0 })),
    fetchCompleteEthenaData().catch(() => null),
  ]);

  const defillamaJson = await defillamaResponse.json();
  const allPools: YieldPool[] = defillamaJson.data ?? [];

  // Separate by protocol
  const maplePools = allPools.filter(p => p.project.toLowerCase().includes('maple'));
  const lithosPools = allPools.filter(p => p.project.toLowerCase().includes('lithos'));

  const mapleData = transformMapleData(maplePools);

  // Calculate summary statistics
  const totalTVL = allPools.reduce((sum, p) => sum + p.tvlUsd, 0);
  const averageAPY = allPools.reduce((sum, p) => sum + (p.apy ?? 0), 0) / allPools.length;
  const uniqueProjects = new Set(allPools.map(p => p.project)).size;

  return {
    maple: mapleData,
    pendle: pendleData,
    ethena: ethenaData ?? createEmptyEthenaData(),
    lithos: lithosPools,
    all: allPools,
    summary: {
      totalTVL,
      averageAPY,
      poolCount: allPools.length,
      protocolCount: uniqueProjects,
    },
  };
}

function createEmptyEthenaData(): EthenaYieldData {
  return {
    protocol: 'Ethena',
    products: {
      usde: { supply: 0, pools: [] },
      susde: { supply: 0, apy: 0, exchangeRate: 1, pools: [] },
    },
    totalTVL: 0,
    plasmaIntegrations: {
      aave: [],
      pendle: [],
      curve: [],
    },
  };
}
```

### Implementation in Dashboard

```typescript
// src/app/api/yields/route.ts
import { NextResponse } from 'next/server';
import { fetchAllPlasmaYields } from '@/lib/plasma-yields-aggregator';

export const revalidate = 1800; // 30 minutes

export async function GET() {
  try {
    const data = await fetchAllPlasmaYields();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching yields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch yield data' },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/dashboard/page.tsx
export default async function CompleteDashboard() {
  const data = await fetchAllPlasmaYields();

  return (
    <main>
      <h1>Plasma Chain Yields - Complete Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="Total TVL" value={formatUSD(data.summary.totalTVL)} />
        <StatsCard title="Average APY" value={`${data.summary.averageAPY.toFixed(2)}%`} />
        <StatsCard title="Active Pools" value={data.summary.poolCount} />
        <StatsCard title="Protocols" value={data.summary.protocolCount} />
      </div>

      {/* Protocol-Specific Sections */}
      <section>
        <h2>Maple Finance</h2>
        <MapleYields data={data.maple} />
      </section>

      <section>
        <h2>Pendle Finance</h2>
        <PendleYields data={data.pendle} />
      </section>

      <section>
        <h2>Ethena</h2>
        <EthenaYields data={data.ethena} />
      </section>

      <section>
        <h2>Lithos DEX</h2>
        <LithosYields pools={data.lithos} />
      </section>
    </main>
  );
}
```

---

## Summary: Step-by-Step Integration Checklist

### ✅ Phase 1: Basic Integration (Already Done)
- [x] DeFiLlama yields API integrated
- [x] Plasma chain filtering
- [x] Basic dashboard display

### 📋 Phase 2: Enhanced Data (Recommended Next Steps)

1. **Add Protocol Filtering**
   ```typescript
   // Update src/app/dashboard/page.tsx
   const protocols = ['Maple', 'Pendle', 'Ethena', 'Lithos', 'Aave', 'Fluid'];
   const filteredPools = pools.filter(p =>
     protocols.some(protocol => p.project.toLowerCase().includes(protocol.toLowerCase()))
   );
   ```

2. **Add APY Breakdown Display**
   ```typescript
   // Show base APY vs reward APY separately
   <div>
     <span>Base APY: {pool.apyBase?.toFixed(2)}%</span>
     <span>Reward APY: {pool.apyReward?.toFixed(2)}%</span>
   </div>
   ```

3. **Add Reward Token Display**
   ```typescript
   // Show which tokens are rewarded
   {pool.rewardTokens?.map(token => (
     <Badge key={token}>{getTokenSymbol(token)}</Badge>
   ))}
   ```

### 📋 Phase 3: Protocol-Specific Pages

4. **Create `/maple-yields` page** - Focus on syrup products
5. **Create `/pendle-yields` page** - Show PT and YT markets
6. **Create `/ethena-yields` page** - sUSDe pools and integrations
7. **Create `/lithos-yields` page** - DEX pools and liquidity

### 📋 Phase 4: Advanced Features

8. **Implement Pendle API integration** - For detailed PT/YT data
9. **Add historical charts** - 7d/30d/90d APY trends
10. **Build yield comparison tool** - Side-by-side protocol comparison
11. **Add alerts system** - Notify on APY changes

---

## API Rate Limits & Best Practices

### DeFiLlama
- **Rate Limit:** None publicly documented (use responsibly)
- **Update Frequency:** Hourly
- **Caching:** Recommended 30-60 minutes
- **Best Practice:** Use Next.js ISR (`revalidate: 1800`)

### Pendle Finance API
- **Rate Limit:** 100 points per minute (calculated per endpoint)
- **Update Frequency:** Real-time for market data
- **Caching:** 5-15 minutes for market data, 1 hour for historical data
- **Best Practice:** Cache responses, use batch requests when possible

### Ethena API
- **Rate Limit:** Not publicly documented
- **Access:** Some endpoints require whitelisting
- **Update Frequency:** Varies by endpoint
- **Best Practice:** Use as fallback to DeFiLlama, implement error handling

---

## Error Handling Template

```typescript
// src/lib/api-utils.ts
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;

      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw new Error('Max retries reached');
}

// Usage
const data = await fetchWithRetry<YieldApiResponse>(
  'https://yields.llama.fi/pools?chain=Plasma'
);
```

---

## Testing Endpoints

```bash
# Test DeFiLlama API
curl "https://yields.llama.fi/pools?chain=Plasma"

# Test Pendle API (get all markets on Plasma)
curl "https://api-v2.pendle.finance/core/v1/9745/markets"

# Test Ethena API (get sUSDe APY)
curl "https://public.api.ethena.fi/api/v1/staking/apy"
```

---

**End of API Integration Guide**
