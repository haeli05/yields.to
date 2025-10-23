"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Coins,
  Zap,
  ShieldCheck,
  BarChart3,
  LineChart,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type YieldOpportunity = {
  protocol: string;
  apy: string;
  tvl: string;
  category: string;
  riskLevel: "Low" | "Medium" | "High";
  change24h: number;
  description: string;
  features: string[];
};

const yieldData: YieldOpportunity[] = [
  // Stablecoin yields
  {
    protocol: "Plasma Stable Pool",
    apy: "8.4%",
    tvl: "$24.6M",
    category: "stablecoin",
    riskLevel: "Low",
    change24h: 0.3,
    description: "USDC/USDT liquidity pool with validator incentives",
    features: ["Auto-compounding", "Low IL risk", "Daily rewards"],
  },
  {
    protocol: "sNUSD Vault",
    apy: "12.1%",
    tvl: "$18.2M",
    category: "stablecoin",
    riskLevel: "Low",
    change24h: -0.1,
    description: "Single-sided sNUSD staking with protocol emissions",
    features: ["No impermanent loss", "Instant withdrawal", "Native stablecoin"],
  },
  {
    protocol: "Helios Stable Strategy",
    apy: "9.7%",
    tvl: "$31.4M",
    category: "stablecoin",
    riskLevel: "Medium",
    change24h: 0.5,
    description: "Multi-pool stable farming with automated rebalancing",
    features: ["Cross-pool optimization", "Gas efficient", "Boosted rewards"],
  },
  // ETH yields
  {
    protocol: "Plasma ETH Staking",
    apy: "5.2%",
    tvl: "$142.8M",
    category: "eth",
    riskLevel: "Low",
    change24h: 0.2,
    description: "Native ETH staking with Plasma validator network",
    features: ["Liquid staking token", "Validator rewards", "Restaking eligible"],
  },
  {
    protocol: "pETH Liquidity Pool",
    apy: "14.3%",
    tvl: "$56.9M",
    category: "eth",
    riskLevel: "Medium",
    change24h: 1.2,
    description: "ETH/pETH concentrated liquidity with trading fees",
    features: ["Concentrated liquidity", "Trading fees", "Liquidity mining"],
  },
  {
    protocol: "Restaking Protocol",
    apy: "18.6%",
    tvl: "$89.3M",
    category: "eth",
    riskLevel: "High",
    change24h: -0.4,
    description: "ETH restaking for additional validator services",
    features: ["Dual staking rewards", "MEV boost", "Slashing risk"],
  },
  // XPL yields
  {
    protocol: "XPL Native Staking",
    apy: "22.4%",
    tvl: "$67.1M",
    category: "xpl",
    riskLevel: "Medium",
    change24h: 0.8,
    description: "Stake XPL to secure the Plasma network",
    features: ["Governance rights", "Network fees", "Validator delegation"],
  },
  {
    protocol: "XPL-USDC Pair",
    apy: "34.7%",
    tvl: "$28.4M",
    category: "xpl",
    riskLevel: "High",
    change24h: 2.1,
    description: "High APY liquidity pool with incentives",
    features: ["Liquidity mining", "Trading fees", "High IL risk"],
  },
  {
    protocol: "Aurora Desk XPL Vault",
    apy: "19.3%",
    tvl: "$41.7M",
    category: "xpl",
    riskLevel: "Medium",
    change24h: 0.6,
    description: "Automated XPL yield strategies across Plasma DeFi",
    features: ["Auto-compounding", "Multi-strategy", "Professional management"],
  },
];

const dashboardStats = [
  {
    label: "Total Value Locked",
    value: "$542M",
    change: "+12.4%",
    trend: "up" as const,
    icon: Coins,
  },
  {
    label: "Average APY",
    value: "15.2%",
    change: "+0.8%",
    trend: "up" as const,
    icon: TrendingUp,
  },
  {
    label: "Active Protocols",
    value: "58",
    change: "+3",
    trend: "up" as const,
    icon: Zap,
  },
  {
    label: "Network Uptime",
    value: "99.97%",
    change: "Stable",
    trend: "neutral" as const,
    icon: ShieldCheck,
  },
];

function getRiskColor(risk: string) {
  switch (risk) {
    case "Low":
      return "bg-green-500/10 text-green-700 border-green-500/20";
    case "Medium":
      return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
    case "High":
      return "bg-red-500/10 text-red-700 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function Dashboard() {
  return (
    <div className="pb-24">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12 sm:px-8 lg:px-12">
        {/* Header Section */}
        <section className="relative isolate overflow-hidden rounded-[48px] border border-white/10 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0f0f0f] px-8 py-16 text-white shadow-2xl sm:px-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(86,159,140,0.4),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(89,141,197,0.3),transparent_55%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.05),#0a0a0a_90%)]" />
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>
          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex max-w-4xl flex-col gap-6">
              <Badge variant="outline" className="w-fit border-white/25 bg-white/10 text-white shadow-lg backdrop-blur-sm">
                <BarChart3 className="mr-1.5 size-3" />
                Live Dashboard
              </Badge>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Plasma Yield Opportunities
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-white/80">
                Real-time yield intelligence across the Plasma ecosystem. Track APYs, TVL, and risk metrics for all major protocols.
              </p>
            </div>

            {/* Dashboard Stats */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {dashboardStats.map(({ label, value, change, trend, icon: Icon }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/20 bg-white/10 p-2 group-hover:bg-white/20 transition-colors">
                      <Icon className="size-4 text-white" />
                    </span>
                    <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-white/60'}`}>
                      {trend === 'up' ? <TrendingUp className="size-3 inline mr-1" /> : trend === 'down' ? <TrendingDown className="size-3 inline mr-1" /> : null}
                      {change}
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-bold tracking-tight text-white">
                    {value}
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Yields Section with Tabs */}
        <section className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Explore Yields by Category</h2>
            <p className="text-lg text-muted-foreground">
              Filter opportunities by asset type to find the best yields for your strategy.
            </p>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="all" className="font-semibold">All Yields</TabsTrigger>
              <TabsTrigger value="stablecoin" className="font-semibold">Stablecoins</TabsTrigger>
              <TabsTrigger value="eth" className="font-semibold">ETH</TabsTrigger>
              <TabsTrigger value="xpl" className="font-semibold">XPL</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {yieldData.map((opportunity) => (
                  <Card
                    key={opportunity.protocol}
                    className="border border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-md transition-all hover:shadow-xl hover:border-border hover:-translate-y-0.5"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl font-bold">
                            {opportunity.protocol}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={getRiskColor(opportunity.riskLevel)}
                            >
                              {opportunity.riskLevel} Risk
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {opportunity.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-foreground">
                            {opportunity.apy}
                          </div>
                          <div className={`text-sm font-medium ${opportunity.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {opportunity.change24h >= 0 ? '+' : ''}{opportunity.change24h}% 24h
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-base leading-relaxed">
                        {opportunity.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/60 px-4 py-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          Total Value Locked
                        </span>
                        <span className="text-lg font-bold">{opportunity.tvl}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Features:
                        </div>
                        <ul className="space-y-2">
                          {opportunity.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <Sparkles className="size-3.5 text-primary mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                        Deposit Now
                        <ArrowUpRight className="ml-2 size-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stablecoin" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {yieldData
                  .filter((opp) => opp.category === "stablecoin")
                  .map((opportunity) => (
                    <Card
                      key={opportunity.protocol}
                      className="border border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-md transition-all hover:shadow-xl hover:border-border hover:-translate-y-0.5"
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-bold">
                              {opportunity.protocol}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getRiskColor(opportunity.riskLevel)}
                              >
                                {opportunity.riskLevel} Risk
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {opportunity.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-foreground">
                              {opportunity.apy}
                            </div>
                            <div className={`text-sm font-medium ${opportunity.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {opportunity.change24h >= 0 ? '+' : ''}{opportunity.change24h}% 24h
                            </div>
                          </div>
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {opportunity.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/60 px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Total Value Locked
                          </span>
                          <span className="text-lg font-bold">{opportunity.tvl}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            Features:
                          </div>
                          <ul className="space-y-2">
                            {opportunity.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <Sparkles className="size-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                          Deposit Now
                          <ArrowUpRight className="ml-2 size-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="eth" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {yieldData
                  .filter((opp) => opp.category === "eth")
                  .map((opportunity) => (
                    <Card
                      key={opportunity.protocol}
                      className="border border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-md transition-all hover:shadow-xl hover:border-border hover:-translate-y-0.5"
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-bold">
                              {opportunity.protocol}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getRiskColor(opportunity.riskLevel)}
                              >
                                {opportunity.riskLevel} Risk
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {opportunity.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-foreground">
                              {opportunity.apy}
                            </div>
                            <div className={`text-sm font-medium ${opportunity.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {opportunity.change24h >= 0 ? '+' : ''}{opportunity.change24h}% 24h
                            </div>
                          </div>
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {opportunity.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/60 px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Total Value Locked
                          </span>
                          <span className="text-lg font-bold">{opportunity.tvl}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            Features:
                          </div>
                          <ul className="space-y-2">
                            {opportunity.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <Sparkles className="size-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                          Deposit Now
                          <ArrowUpRight className="ml-2 size-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="xpl" className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-2">
                {yieldData
                  .filter((opp) => opp.category === "xpl")
                  .map((opportunity) => (
                    <Card
                      key={opportunity.protocol}
                      className="border border-border/60 bg-gradient-to-br from-card to-muted/20 shadow-md transition-all hover:shadow-xl hover:border-border hover:-translate-y-0.5"
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-xl font-bold">
                              {opportunity.protocol}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={getRiskColor(opportunity.riskLevel)}
                              >
                                {opportunity.riskLevel} Risk
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {opportunity.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-foreground">
                              {opportunity.apy}
                            </div>
                            <div className={`text-sm font-medium ${opportunity.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {opportunity.change24h >= 0 ? '+' : ''}{opportunity.change24h}% 24h
                            </div>
                          </div>
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {opportunity.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/60 px-4 py-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Total Value Locked
                          </span>
                          <span className="text-lg font-bold">{opportunity.tvl}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            Features:
                          </div>
                          <ul className="space-y-2">
                            {opportunity.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <Sparkles className="size-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button className="w-full bg-foreground text-background hover:bg-foreground/90">
                          Deposit Now
                          <ArrowUpRight className="ml-2 size-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Bottom CTA */}
        <section className="relative isolate overflow-hidden rounded-[44px] border border-border/60 bg-gradient-to-br from-card via-muted/20 to-card px-8 py-16 shadow-xl sm:px-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(89,141,197,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(86,159,140,0.18),transparent_65%)]" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-6 text-center">
            <Badge variant="outline" className="w-fit">
              <LineChart className="mr-1.5 size-3" />
              Professional Analytics
            </Badge>
            <h3 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl max-w-2xl">
              Need deeper analytics and custom alerts?
            </h3>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-xl">
              Upgrade to professional tier for advanced portfolio tracking, real-time alerts, and institutional-grade reporting.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="min-w-[13rem] bg-foreground text-background hover:bg-foreground/90 shadow-lg"
              >
                Upgrade to Pro
                <ArrowUpRight className="ml-2 size-4" />
              </Button>
              <Button size="lg" variant="outline" className="min-w-[13rem] shadow-md">
                View Pricing
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
