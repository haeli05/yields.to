import { ChainMetricsCharts } from '@/components/chain-metrics-charts';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-24 sm:px-8 lg:px-12">
      <section className="flex w-full flex-col items-center gap-8 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Find the best yields on Plasma.
        </h1>
        <div className="w-full">
          test
          <ChainMetricsCharts />
        </div>
      </section>
    </main>
  );
}
