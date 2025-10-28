import type { Metadata } from "next";
import { ChainMetricsCharts } from "@/components/chain-metrics-charts";

export const metadata: Metadata = {
  title: "Chain Stats",
  description: "Comprehensive Plasma chain statistics including users, transactions, contracts, and block metrics.",
};

export default function ChainStatsPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:px-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Plasma Chain Statistics
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time and historical metrics for the Plasma chain, including user activity,
          transaction volume, contract deployments, and block production data.
        </p>
      </div>

      <ChainMetricsCharts />
    </main>
  );
}
