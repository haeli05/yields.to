import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 pb-20 pt-24 text-foreground sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_theme(colors.primary/25),_transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-w-xl flex-col items-center gap-10 text-center">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
          <Image
            src="/logo.png"
            alt="Yields.to logo"
            width={96}
            height={96}
            priority
            className="mix-blend-difference"
          />
          <div
            className="absolute inset-4 rounded-full border border-primary/40 mix-blend-difference"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">
            404
          </p>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            You’ve drifted past the Plasma perimeter.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            The page you’re looking for isn’t indexed yet. Head back to the
            dashboard to keep exploring the latest on-chain yields.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}

