import BrownianCandles from "@/components/brownian-candles";

export default function Home() {
  return (
    <div className="pb-24">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-20 px-6 py-16 sm:px-8 lg:px-12">
        <section className="rounded-[44px] border border-black/10 bg-white px-8 py-20 text-black sm:px-12">
          <div className="relative mx-auto flex max-w-3xl flex-col gap-10">
            <h1 className="relative z-10 text-balance text-4xl font-semibold tracking-tight mix-blend-difference sm:text-5xl lg:text-7xl">
              The best yields on Plasma.
            </h1>
            <div className="relative z-0">
              <BrownianCandles />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
