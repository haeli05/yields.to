# Plasma Chain Yield Sources Research

**Research Date:** October 23, 2025
**Project:** yields.to - Plasma Chain Yield Discovery Platform

## Executive Summary

This document contains comprehensive research on major yield sources available on the Plasma blockchain, focusing on integration opportunities for the yields.to platform. Plasma is a stablecoin-focused Layer 1 blockchain that launched its mainnet on September 25, 2025, debuting with over $2 billion in stablecoin TVL.

**👉 For immediate implementation instructions, see [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) - Complete with code examples and step-by-step instructions.**

---

## Quick Start: How to Get the Data

### Primary Data Source: DeFiLlama Yields API (Recommended)

**Why DeFiLlama First:**
- ✅ Already integrated in your codebase (`src/app/dashboard/page.tsx`)
- ✅ Aggregates data from ALL protocols (Maple, Pendle, Ethena, Lithos, Aave, Fluid)
- ✅ Free, no authentication required
- ✅ Hourly updates
- ✅ Consistent data format

**Endpoint:**
```
GET https://yields.llama.fi/pools?chain=Plasma
```

**Quick Code Example:**
```typescript
// Fetch all Plasma yields
const response = await fetch('https://yields.llama.fi/pools?chain=Plasma');
const data = await response.json();
const plasmaYields = data.data; // Array of yield pools

// Filter by protocol
const mapleYields = plasmaYields.filter(p => p.project.includes('maple'));
const pendleYields = plasmaYields.filter(p => p.project.includes('pendle'));
const ethenaYields = plasmaYields.filter(p => p.symbol.includes('USDe'));
const lithosYields = plasmaYields.filter(p => p.project.includes('lithos'));
```

**Response Structure:**
```typescript
{
  data: [
    {
      chain: "Plasma",
      project: "maple-finance",      // Protocol name
      symbol: "syrupUSDT",            // Pool name
      tvlUsd: 200000000,              // $200M TVL
      apy: 7.5,                       // Total APY
      apyBase: 6.5,                   // Base APY (organic)
      apyReward: 1.0,                 // Reward APY (token incentives)
      pool: "0x...",                  // Pool address
      rewardTokens: ["0x..."],        // XPL, ENA, LITH, etc.
      underlyingTokens: ["0x..."]     // USDT, USDC, etc.
    },
    // ... more pools
  ]
}
```

### Protocol-Specific APIs (Optional Secondary Sources)

| Protocol | When to Use | Endpoint | Documentation |
|----------|-------------|----------|---------------|
| **Pendle Finance** | For PT/YT market details, historical APY charts | `https://api-v2.pendle.finance/core` | See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md#3-pendle-finance-api) |
| **Ethena Labs** | For sUSDe exchange rate, staking stats | `https://public.api.ethena.fi` | See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md#4-ethena-labs-api) |
| **Maple Finance** | For vault-specific data (rarely needed) | The Graph subgraphs | See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md#2-maple-finance-data) |
| **Lithos Protocol** | On-chain DEX data (if not in DeFiLlama) | The Graph subgraphs | See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md#5-lithos-protocol) |

**Recommendation:** Start with DeFiLlama only. Add protocol-specific APIs later if you need additional metadata not available in DeFiLlama.

### Implementation Checklist

- [x] **Step 1:** DeFiLlama API already integrated in `src/app/dashboard/page.tsx`
- [ ] **Step 2:** Add protocol name filters (Maple, Pendle, Ethena, Lithos)
- [ ] **Step 3:** Display `apyBase` and `apyReward` separately
- [ ] **Step 4:** Show reward tokens (XPL, ENA, LITH badges)
- [ ] **Step 5:** Create protocol-specific pages `/maple-yields`, `/pendle-yields`, etc.
- [ ] **Step 6:** Add Pendle API for detailed PT/YT market data
- [ ] **Step 7:** Implement historical APY charts

**Full implementation guide with code examples:** [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)

---

## 1. Maple Finance - syrupUSDT/syrupUSDC

### Overview
Maple Finance deployed syrupUSDT on Plasma in its first major expansion beyond Ethereum. Maple is an institutional credit protocol that packages stablecoins into yield-bearing vaults.

### Key Metrics
- **TVL on Plasma:** $200M vault filled almost instantly at launch
- **Total Maple AUM:** $4B+ (as of September 2025, targeting $5B by end of 2025)
- **APY Range:** 6.4% - 17% (varies by product and timeframe)
  - July 2025: 6.4% pre-Drips APY
  - Traders using syrupUSDC as margin: 7-8% APY
  - Target APY: ~15% (one of highest single-exposure stablecoin yields in DeFi)

### Products on Plasma
1. **syrupUSDT** - Tether-based yield vault
2. **syrupUSDC** - USDC-based yield vault (integrated with Aave)

### Integration with Aave
- Initial integrations include syrupUSDT on Aave's Plasma instance
- Followed by syrupUSDC on the core market
- Users can earn yield while also participating in Plasma's token generation event

### Data Sources
- **DeFiLlama:** Tracks Maple Finance with 2 pools, average APY 7.31%
  - API: `https://defillama.com/protocol/maple-finance`
- **MapleKit:** Official integration toolkit with GraphQL queries and smart contract interactions
  - Documentation: Developer guides for frontend/backend integration
- **The Graph Subgraphs:** Standardized subgraphs for on-chain data
  - Queries for revenue, fees, TVL calculations
- **Update Frequency:** Hourly updates for TVL and yield data

### Technical Integration Notes
- Multi-chain support (Ethereum, Plasma)
- Yield-bearing tokens (syrupUSDT, syrupUSDC) represent pool share
- Tokens start earning yield immediately upon deposit
- Can be used as collateral in other DeFi protocols

---

## 2. Pendle Finance

### Overview
Pendle is a yield trading protocol that enables users to tokenize yield-bearing assets into Principal Tokens (PT) and Yield Tokens (YT). Launched on Plasma October 1, 2025.

### Launch Performance
- **TVL Growth:** $318M in first 4 days (October 1-4, 2025)
- **Initial TVL:** Crossed $100M in first 12 hours
- **Growth Rate:** One of fastest growth spurts on a new chain in DeFi history

### Yield Markets
- **Number of Markets:** 5 distinct yield markets at launch
- **APY Range:** Up to 649% APY (extreme yields with XPL token rewards)
- **Weekly Rewards:** $900,000 in XPL tokens distributed to:
  - Yield Token (YT) holders
  - Liquidity providers

### Product Structure
- **Principal Tokens (PT):** Fixed-rate returns
- **Yield Tokens (YT):** Variable yield exposure
- **Supported Assets:** Multiple stablecoins with different risk/reward profiles

### Data Sources
- **DeFiLlama:**
  - Protocol page: `https://defillama.com/protocol/pendle`
  - Yields API: `https://yields.llama.fi/pools?chain=Plasma` (filter by project=pendle)
- **Update Frequency:** Hourly
- **Metrics Available:** TVL, APY, Pool composition, Token prices

### Unique Features
- Allows speculation on future yield rates
- Fixed vs variable yield strategies
- Integrated with Plasma's XPL rewards program

---

## 3. Ethena - USDe and sUSDe

### Overview
Ethena Labs deployed USDe (synthetic dollar) and sUSDe (staked USDe) on Plasma mainnet beta on September 25, 2025, as core dollar assets.

### Key Metrics
- **Initial Liquidity:** $800M seeded across Pendle, Curve, and Balancer
- **Aave Integration:**
  - $500M USDe deposit capacity
  - $450M sUSDe deposit capacity
- **APY on Plasma:** 8-12% (boosted by Plasma ecosystem)
- **General Market APY:** 4.72% - 6.76% (30-day average as of August 2025)
- **Fixed Rates on Pendle:** 8-11% APY

### Products
1. **USDe** - Synthetic dollar stablecoin
   - Maintains $1 peg through delta-neutral positions
   - Tradeable on DEXs

2. **sUSDe** - Staked/yield-bearing version of USDe
   - Auto-compounds yield
   - Can be used as collateral

### Integration Points

#### Aave Liquid Leverage
- Total capacity: ~$950M ($500M USDe + $450M sUSDe)
- Earn Ethena Points on deposits
- Leverage strategy rewards claimable through Merkl
- Supports complex yield farming strategies

#### Pendle Integration
- Fixed-rate yield products (8-11% APY)
- Trade future yield exposure
- PT and YT markets available

#### DEX Liquidity
- **Curve:** Stablecoin swaps with low slippage
- **Balancer:** Weighted pools for liquidity provision

### Revenue Sources
- Delta-neutral funding rate arbitrage
- Staking rewards (for sUSDe holders)
- Trading fees from DEX pools
- Ethena Points (convertible to governance/rewards)

### Data Sources
- **DeFiLlama:**
  - Pool: `https://defillama.com/yields/pool/66985a81-9c51-46ca-9977-42b4fe7bc6df`
  - Yields API for Plasma chain sUSDe pools
- **Market Cap:** USDe is 3rd largest stablecoin (driven by high yield demand)

---

## 4. Lithos Protocol

### Overview
Lithos (LITH) is a Plasma-native DeFi protocol built on ve(3,3) tokenomics. It's a DEX (decentralized exchange) focused on sustainable liquidity and revenue sharing.

### Launch Timeline
- **Genesis Event:** October 1, 2025
- **Initial Pools:**
  - XPL/USDT
  - USDe/USDT

### Tokenomics Model: ve(3,3)
The protocol uses a vote-escrowed system combining:
- **Voting Power:** Lock LITH → receive veLITH
- **Emissions:** veLITH holders direct liquidity incentives
- **Revenue Sharing:** Fees distributed to participants

### Yield Opportunities

#### For Liquidity Providers (LPs)
- Deposit assets into liquidity pools
- Earn from:
  1. **Trading Fees:** Generated from swaps
  2. **veLITH-directed Emissions:** Token rewards based on votes
- Higher APY pools receive more veLITH votes

#### For veLITH Holders
- Lock LITH tokens for veLITH (vote-escrowed LITH)
- Benefits:
  1. **Voting Power:** Direct emissions to preferred pools
  2. **Fee Share:** Receive portion of protocol trading fees
  3. **Dilution Protection:** Longer locks = more veLITH = protected from inflation
  4. **Consistent Rewards:** As trading volume grows, fee revenue increases

### Revenue Distribution Model
```
Trading Fees Split:
├── Liquidity Providers (swap fees from their pool)
├── veLITH Holders (protocol fee share)
└── Protocol Treasury (sustainability fund)
```

### Growth Context
Lithos launched during Plasma's explosive growth period:
- **Plasma TVL (Oct 2025):** $6.33B (+13.1% monthly, +17.3% quarterly)
- **Market Position:** Plasma emerged as breakout chain of 2025
- **XPL Token:** $2.4B market cap at launch

### Strategic Positioning
- **Native to Plasma:** Built specifically for the chain's stablecoin ecosystem
- **Sustainable Model:** ve(3,3) aligns long-term incentives
- **DAO Governance:** Community-driven protocol decisions

### Data Sources
- **Lithos Docs:** `https://docs.lithos.to`
- **DeFiLlama:** Will be tracked under Plasma chain DEX category
- **On-Chain Data:** Trading volume, TVL, APY calculations from blockchain

---

## 5. Other Major Plasma Yield Sources

### Aave
- **24h Deposits at Launch:** $3.5B+
- **Features:** 1-transaction leveraging for stablecoin yield farming
- **Integration:** Available through DeFi Saver
- **Products:** Lending/borrowing with yield optimization

### Fluid Protocol
- **APY:** ~20-23% on stablecoin supplies (USDT0, USDe)
- **Additional Rewards:** XPL token boosts on supplied assets
- **Type:** Lending protocol

### Euler Finance
- **Status:** Launch partner with Plasma
- **Type:** Permissionless lending protocol
- **Features:** Risk-isolated lending markets

### Plasma One Neobank
- **Yield:** 10%+ on stablecoin balances
- **Lockup:** No lockup period required
- **Source:** Aggregated from Plasma DeFi ecosystem
- **Coverage:** Global coverage for unbanked populations

---

## DeFiLlama API Integration Guide

### Primary Endpoints Already in Use

#### 1. Yields API
```
GET https://yields.llama.fi/pools?chain=Plasma
```
**Returns:** All yield pools on Plasma chain
**Update Frequency:** Hourly
**Current Implementation:** `/src/app/dashboard/page.tsx` (line 55)

**Response Structure:**
```typescript
{
  data: [
    {
      chain: "Plasma",
      project: "pendle" | "maple-finance" | "ethena" | "lithos",
      symbol: "PT-sUSDe" | "syrupUSDT" | "sUSDe-USDT LP",
      tvlUsd: number,
      apy: number | null,
      apyBase: number | null,
      apyReward: number | null,
      pool: string,
      poolMeta?: string
    }
  ]
}
```

#### 2. Chain TVL API
```
GET https://api.llama.fi/charts/Plasma
```
**Returns:** Historical TVL timeseries for Plasma chain
**Current Implementation:** `/src/app/data-sources/page.tsx` (line 103)

#### 3. Protocol-Specific API
```
GET https://api.llama.fi/protocol/{slug}
```
**Examples:**
- `https://api.llama.fi/protocol/maple-finance`
- `https://api.llama.fi/protocol/pendle`
- `https://api.llama.fi/protocol/ethena`
- `https://api.llama.fi/protocol/lithos`

**Returns:** Protocol TVL, token composition, chain breakdown

### Filtering Strategies

#### By Project Name
```typescript
const pendlePools = pools.filter(p => p.project === 'pendle');
const maplePools = pools.filter(p => p.project === 'maple-finance');
const ethenaPools = pools.filter(p => p.project === 'ethena');
const lithosPools = pools.filter(p => p.project === 'lithos');
```

#### By Asset Type
```typescript
const syrupPools = pools.filter(p =>
  p.symbol.toLowerCase().includes('syrup')
);
const susdePools = pools.filter(p =>
  p.symbol.toLowerCase().includes('susde') ||
  p.symbol.toLowerCase().includes('usde')
);
```

#### By APY Threshold
```typescript
const highYieldPools = pools.filter(p =>
  p.apy && p.apy > 10
);
```

---

## Recommended Implementation Strategy

### Phase 1: Enhance Existing Dashboard (Immediate)
The current dashboard at `/src/app/dashboard/page.tsx` already fetches all Plasma yields. Enhancements needed:

1. **Add Protocol Filtering**
   - Add filter chips for: Maple, Pendle, Ethena, Lithos, Aave, Fluid
   - Implement in `PlasmaYieldDashboard` component

2. **Add Yield Type Classification**
   ```typescript
   type YieldType =
     | "Stablecoin Vault"      // Maple syrup products
     | "Yield Trading"         // Pendle PT/YT
     | "Staked Stablecoin"     // Ethena sUSDe
     | "DEX Liquidity"         // Lithos pools
     | "Lending"               // Aave, Fluid, Euler
   ```

3. **Enhanced Pool Metadata**
   - Display APY breakdown (base APY vs reward APY)
   - Show reward tokens (XPL, ENA, LITH, etc.)
   - Add pool composition (underlying assets)

### Phase 2: Protocol-Specific Pages (Short-term)

Create dedicated pages for major protocols:

```
/maple-yields       → Syrup vault details, historical APY
/pendle-yields      → PT/YT markets, yield curves
/ethena-yields      → sUSDe pools, Ethena points tracking
/lithos-yields      → DEX pools, veLITH APR, trading volume
```

### Phase 3: Advanced Features (Medium-term)

1. **Yield Aggregator**
   - Compare best rates across all protocols
   - Factor in reward tokens (XPL, ENA, LITH)
   - Calculate "real APY" including all incentives

2. **Historical Data Charts**
   - 7d/30d/90d APY trends per protocol
   - TVL growth charts
   - Market share analysis

3. **User Strategy Builder**
   - Input: capital amount, risk tolerance
   - Output: optimal yield strategy recommendations
   - Example: "50% Maple syrupUSDT (7% APY) + 30% Pendle PT-sUSDe (11% fixed) + 20% Lithos XPL/USDT LP (15% APY + LITH rewards)"

### Phase 4: Real-time Alerts (Long-term)
- APY threshold alerts
- New pool launches
- Significant TVL movements
- Reward program announcements

---

## Data Quality & Reliability

### DeFiLlama
- **Reliability:** Industry standard, 100+ chains tracked
- **Update Frequency:** Hourly for yields and TVL
- **Coverage:** Comprehensive for major protocols
- **Limitations:** May lag for very new pools (1-2 day delay)

### Alternative Data Sources

#### The Graph Protocol
- **Pros:** Real-time on-chain data, customizable queries
- **Cons:** Requires technical setup, subgraph maintenance
- **Use Case:** For protocols with official subgraphs (Maple, Pendle)

#### Protocol APIs
- **MapleKit:** Official Maple Finance integration toolkit
- **Pendle SDK:** Direct protocol interaction
- **Use Case:** When DeFiLlama doesn't have full metadata

### Recommended Approach
1. **Primary:** DeFiLlama APIs (already implemented, reliable, free)
2. **Secondary:** Direct protocol APIs for additional metadata
3. **Validation:** Cross-reference multiple sources for critical data

---

## Competitive Landscape

### Similar Platforms
- **DefiLlama:** Aggregator for all chains (generalist)
- **yields.to:** Plasma-specific specialist (our differentiation)
- **Exponential.fi:** Yield aggregator with strategy vaults
- **APY.vision:** LP position tracking and analytics

### Our Unique Value Proposition
1. **Plasma-Focused:** Deep dive into single ecosystem vs surface-level multi-chain
2. **Curated Data:** Manual verification + automated feeds
3. **Educational:** Explain protocols, not just display numbers
4. **Actionable:** Direct links to protocols, integration guides

---

## Risk Considerations

### Smart Contract Risk
- **Maple:** Institutional-grade audits, $4B+ AUM track record
- **Pendle:** Audited by multiple firms, battle-tested on Ethereum
- **Ethena:** Novel mechanism, monitor delta-neutral position health
- **Lithos:** New protocol, smaller TVL = higher risk

### Yield Sustainability
- **Organic vs Incentivized:**
  - Maple: Organic (real lending revenue)
  - Pendle: Mixed (trading fees + XPL rewards)
  - Ethena: Organic (funding rates, staking)
  - Lithos: Initially incentivized (emissions), long-term organic (fees)

### Market Risk
- **Plasma Chain Adoption:** Young chain (Sept 2025 launch)
- **Stablecoin Depeg:** USDe, USDT, USDC stability
- **Regulatory:** Potential scrutiny on synthetic dollars, RWA yields

---

## Next Steps for Implementation

### Immediate Actions
1. ✅ **Research Complete:** This document
2. **Update Dashboard:** Add protocol filters for Maple, Pendle, Ethena, Lithos
3. **Enhance Data Model:** Add `rewardTokens`, `apyBreakdown` fields
4. **Add Protocol Logos:** Visual identification in tables

### Week 1-2
- Create `/maple-yields` page with syrupUSDT/USDC details
- Create `/pendle-yields` page with PT/YT markets
- Create `/ethena-yields` page with sUSDe pools
- Create `/lithos-yields` page with DEX pools

### Week 3-4
- Implement yield comparison tool
- Add historical APY charts (7d/30d/90d)
- Build reward token tracking (XPL, ENA, LITH values)

### Month 2
- User strategy builder
- Educational content for each protocol
- Alert system for yield changes

---

## Technical Specifications

### New Type Definitions Needed

```typescript
// Extended pool type with reward breakdown
interface PlasmaYieldPool {
  // Existing fields
  id: string;
  pool: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;

  // New fields
  apyBase: number | null;        // Base APY from fees/lending
  apyReward: number | null;      // APY from token rewards
  rewardTokens: string[];        // e.g., ["XPL", "ENA", "LITH"]
  underlyingTokens: string[];    // e.g., ["USDT", "USDC"]
  poolMeta: string;              // Additional info
  yieldType: YieldType;
  riskLevel: "Low" | "Medium" | "High";
  lockupPeriod?: string;         // e.g., "None", "7 days", "Variable"
}

type YieldType =
  | "Stablecoin Vault"      // Maple
  | "Yield Trading"         // Pendle PT/YT
  | "Staked Stablecoin"     // Ethena sUSDe
  | "DEX Liquidity"         // Lithos pools
  | "Lending"               // Aave, Fluid, Euler
  | "Structured Product"    // Complex strategies
```

### Database Schema (if adding persistence)

```sql
CREATE TABLE yield_pools (
  id VARCHAR PRIMARY KEY,
  chain VARCHAR DEFAULT 'Plasma',
  project VARCHAR,
  symbol VARCHAR,
  tvl_usd NUMERIC,
  apy NUMERIC,
  apy_base NUMERIC,
  apy_reward NUMERIC,
  reward_tokens TEXT[],
  underlying_tokens TEXT[],
  yield_type VARCHAR,
  risk_level VARCHAR,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project ON yield_pools(project);
CREATE INDEX idx_apy ON yield_pools(apy DESC);
CREATE INDEX idx_updated ON yield_pools(updated_at);
```

---

## References & Sources

### Official Documentation
- **Maple Finance:** https://maple.finance, https://maplefinance.gitbook.io/maple/
- **Pendle Finance:** Official docs (check defillama.com/protocol/pendle for links)
- **Ethena:** Protocol documentation for USDe/sUSDe
- **Lithos:** https://docs.lithos.to

### Data APIs
- **DeFiLlama API:** https://defillama.com/docs/api
- **DeFiLlama Yields:** https://yields.llama.fi/pools
- **Plasma Chain Data:** https://api.llama.fi/charts/Plasma

### Research Articles
- "Maple Brings syrupUSDT to Plasma" - Maple Finance Insights
- "Pendle Grows $318M TVL in 4 Days on Plasma" - Multiple sources
- "Ethena Launches USDe/sUSDe on Plasma Mainnet" - Crypto.news
- "Lithos Overview" - Bitget Web3 Academy

### Market Data
- **CoinGecko:** Token prices, market caps
- **CoinMarketCap:** Protocol updates, news
- **DeFiLlama:** TVL tracking, yields

---

## Appendix: Protocol Comparison Matrix

| Protocol | Type | TVL on Plasma | APY Range | Rewards | Risk Level | Lockup |
|----------|------|---------------|-----------|---------|------------|--------|
| **Maple Finance** | Stablecoin Vault | $200M+ | 6.4%-17% | None | Low | None |
| **Pendle** | Yield Trading | $318M+ | 8%-649% | XPL | Medium | Variable |
| **Ethena** | Staked Stablecoin | $950M+ | 8%-12% | ENA Points | Medium | None (sUSDe) |
| **Lithos** | DEX (ve3,3) | TBD | Variable | LITH, veLITH | Medium-High | Optional |
| **Aave** | Lending | $3.5B+ | Variable | XPL | Low | None |
| **Fluid** | Lending | TBD | 20%-23% | XPL | Medium | None |

---

**Document Version:** 1.0
**Last Updated:** October 23, 2025
**Maintained By:** yields.to Research Team
**Next Review:** November 15, 2025
