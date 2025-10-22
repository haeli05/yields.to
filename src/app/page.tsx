import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BarChart3,
  CircuitBoard,
  Globe,
  LineChart,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Zap,
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

type Highlight = {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

const heroHighlights: Highlight[] = [
  {
    label: "Validator feeds",
    value: "58 sources",
    description: "Settlement, rollup, and liquidity relays across Plasma.",
    icon: RadioTower,
  },
  {
    label: "Liquidity monitors",
    value: "$168M tracked",
    description: "Live incentives, depth, and lockups for core programs.",
    icon: BarChart3,
  },
  {
    label: "Median signal latency",
    value: "180 ms",
    description: "From on-chain events to actionable dashboards.",
    icon: Zap,
  },
];

const partnerLogos = [
  "Axis",
  "Daylight",
  "sNUSD",
  "Octane",
  "Helios Pools",
  "Aurora Desk",
  "StableLab",
];

type Pillar = {
  title: string;
  description: string;
  stat: string;
};

const aboutPillars: Pillar[] = [
  {
    title: "Unified Plasma coverage",
    description:
      "Ingest rollup events, validator attestations, and cross-chain bridges through one normalized data plane.",
    stat: "12 connected domains",
  },
  {
    title: "Attestation aware routing",
    description:
      "Every opportunity is scored with validator context so you can balance yield with settlement certainty.",
    stat: "54 validator syndicates",
  },
  {
    title: "Liquidity lifecycle automation",
    description:
      "Entrants get exit windows, unlock warnings, and auto-rotation suggestions before rewards decay.",
    stat: "2.4M epochs analyzed",
  },
];

type Feature = {
  title: string;
  description: string;
  points: string[];
  icon: LucideIcon;
};

const featureCards: Feature[] = [
  {
    title: "Validator-calibrated yields",
    description:
      "Blend staking, restaking, and execution rewards with programmatic risk tuning fit for Plasma economics.",
    points: [
      "Epoch-aware rebalancing models",
      "MEV & finality risk scoring",
      "Restaking & sequencer overlays",
    ],
    icon: ShieldCheck,
  },
  {
    title: "Real-time liquidity map",
    description:
      "Track depth, slippage, and incentive cliffs across DEXs, structured vaults, and credit lines.",
    points: [
      "Consolidated orderflow telemetry",
      "Lockup & unlock cadence previews",
      "Onchain alerts into your workflow",
    ],
    icon: CircuitBoard,
  },
  {
    title: "Institution-grade reporting",
    description:
      "Generate auditable export packages with methodology notes and Plasma-specific benchmark comparisons.",
    points: [
      "Allocator-ready PDF & CSV exports",
      "Counterparty performance ledger",
      "Custom governance scorecards",
    ],
    icon: LineChart,
  },
];

type Metric = {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const networkMetrics: Metric[] = [
  {
    value: "12 rollups",
    label: "Coverage footprint",
    description:
      "Synchronized watchers across Plasma mainnet, perimeter rollups, and partner subnets.",
    icon: Globe,
  },
  {
    value: "180 ms",
    label: "Median update",
    description:
      "Event-to-dashboard latency thanks to redundant attestation relays.",
    icon: Zap,
  },
  {
    value: "$168M",
    label: "Programs monitored",
    description:
      "Rewards, buybacks, and emissions tracked across live Plasma ecosystems.",
    icon: LineChart,
  },
  {
    value: "99.97%",
    label: "Network uptime",
    description:
      "Dual-region ingestion with sequencer failover and archive replay.",
    icon: ShieldCheck,
  },
];

type RoadmapItem = {
  title: string;
  timeframe: string;
  description: string;
  tag: string;
};

const roadmap: RoadmapItem[] = [
  {
    title: "Restaking integrator release",
    timeframe: "Shipping now",
    description:
      "Bring Plasma validator syndicates and Eigen-layer operators into one automated deployment surface.",
    tag: "New",
  },
  {
    title: "Liquidity depth oracles",
    timeframe: "Q1 2026",
    description:
      "Expose aggregated, manipulation-resistant depth feeds for Plasma native and bridged stablecoins.",
    tag: "In research",
  },
  {
    title: "Validator messaging bus",
    timeframe: "Q2 2026",
    description:
      "Programmable notifications routed to your desks, bots, or treasury policies as epochs finalize.",
    tag: "Planned",
  },
];

export default function Home() {
  return (
    <div className="pb-24">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-16 sm:px-8 lg:px-12">
        <section className="relative isolate overflow-hidden rounded-[44px] border border-white/10 bg-[#111111] px-8 py-20 text-white shadow-[0_40px_120px_-70px_rgba(10,10,10,0.9)] sm:px-12">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(86,159,140,0.35),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(89,141,197,0.25),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,17,17,0.05),#0a0a0a_85%)]" />
          </div>
          <div className="relative z-10 flex flex-col gap-14">
            <div className="flex max-w-4xl flex-col gap-8">
              <Badge variant="outline" className="w-fit border-white/20 bg-white/10 text-white">
                Plasma aligned analytics
              </Badge>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Yield discovery engineered for the Plasma chain economy.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-white/70">
                yields.to synchronizes validator emissions, liquidity programs,
                and structured credit routes across the Plasma ecosystem. Every
                signal is normalized in real time so operators can deploy with
                conviction.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="min-w-[11rem] bg-white text-black hover:bg-white/90"
                >
                  Launch dashboard
                  <ArrowUpRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[11rem] border-white/30 bg-white/5 text-white hover:bg-white/10"
                >
                  View methodology
                </Button>
              </div>
            </div>
            <dl className="grid gap-6 sm:grid-cols-3">
              {heroHighlights.map(({ label, value, description, icon: Icon }) => (
                <div
                  key={label}
                  className="group rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-white/20 bg-white/10 p-2">
                      <Icon className="size-4 text-white" />
                    </span>
                    <dt className="text-xs uppercase tracking-[0.22em] text-white/60">
                      {label}
                    </dt>
                  </div>
                  <dd className="mt-3 text-2xl font-semibold tracking-tight text-white">
                    {value}
                  </dd>
                  <p className="mt-2 text-sm text-white/60">{description}</p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="rounded-[36px] border border-border bg-card px-8 py-10 sm:px-12">
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Trusted by builders across Plasma
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm font-medium text-foreground/60 sm:text-base">
              {partnerLogos.map((name) => (
                <span
                  key={name}
                  className="tracking-[0.2em] text-foreground/70 transition-opacity hover:opacity-80"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.65fr)_1fr] lg:items-start">
          <div className="space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              About yields.to
            </span>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              A dedicated data plane for Plasma-native yield intelligence.
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Built for desks that navigate validator incentives, liquidity
              rotations, and structured credit. We blend low-level telemetry
              with human-readable narratives, so every allocation decision is
              defensible.
            </p>
            <Button variant="ghost" className="w-fit px-0 text-foreground/80 hover:text-foreground">
              Download tech brief
              <ArrowUpRight className="ml-2 size-4" />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {aboutPillars.map((pillar) => (
              <Card key={pillar.title} className="h-full border border-border/60 bg-card">
                <CardHeader className="space-y-3">
                  <CardTitle className="text-lg font-semibold">
                    {pillar.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {pillar.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-2xl border border-border/60 bg-muted/60 px-4 py-3 text-sm font-medium text-foreground/80">
                    {pillar.stat}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {featureCards.map(({ title, description, points, icon: Icon }) => (
            <Card
              key={title}
              className="h-full border border-border/60 bg-card transition-shadow hover:shadow-lg"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-border/60 bg-muted/60 p-2">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {title}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {points.map((point) => (
                    <li key={point} className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="relative isolate overflow-hidden rounded-[40px] border border-border/50 bg-[#101010] px-8 py-16 text-white sm:px-12">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,159,140,0.28),transparent_55%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,16,16,0.2),#0a0a0a_85%)]" />
          </div>
          <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,0.65fr)_1fr] lg:items-start">
            <div className="space-y-6">
              <Badge variant="outline" className="w-fit border-white/20 bg-white/5 text-white">
                Network telemetry
              </Badge>
              <h3 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Unified monitors across Plasma&apos;s rollups.
              </h3>
              <p className="max-w-lg text-base leading-relaxed text-white/70">
                Our observers live beside validators and sequencers. They ingest
                consensus data, mempool deltas, and liquidity shocks so your
                desk reacts before yield compresses.
              </p>
              <Button
                variant="outline"
                className="w-fit border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                Explore data coverage
                <ArrowUpRight className="ml-2 size-4" />
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {networkMetrics.map(({ label, value, description, icon: Icon }) => (
                <Card
                  key={label}
                  className="h-full border border-white/10 bg-white/5 px-4 py-5 text-left backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-white/20 bg-white/10 p-2">
                      <Icon className="size-4 text-white" />
                    </span>
                    <span className="text-xs uppercase tracking-[0.22em] text-white/60">
                      {label}
                    </span>
                  </div>
                  <div className="mt-4 text-2xl font-semibold tracking-tight text-white">
                    {value}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    {description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,0.65fr)_1fr] lg:items-start">
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Roadmap
            </span>
            <h3 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Shipping alongside Plasma network upgrades.
            </h3>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">
              We coordinate releases with validator councils and ecosystem teams
              so analytics, automation, and governance tooling align with
              protocol schedules.
            </p>
          </div>
          <div className="space-y-6">
            {roadmap.map((item) => (
              <Card key={item.title} className="border border-border/60 bg-card">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-fit border-border/60">
                      {item.tag}
                    </Badge>
                    <CardTitle className="text-lg font-semibold">
                      {item.title}
                    </CardTitle>
                  </div>
                  <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                    {item.timeframe}
                  </p>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="relative isolate overflow-hidden rounded-[36px] border border-border bg-card px-8 py-16 sm:px-12">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(89,141,197,0.22),transparent_60%)]" />
          </div>
          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-4">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Get early access
              </span>
              <h3 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                Bring yields.to into your Plasma operations stack.
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                We onboard funds, DAOs, and teams in cohorts so each desk gets a
                tailored data setup, alerting strategy, and integration support.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="min-w-[12rem] bg-foreground text-background hover:bg-foreground/90"
              >
                Request integration
                <ArrowUpRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" className="min-w-[12rem]">
                Book a walkthrough
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
