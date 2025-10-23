import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo.png"
            alt="Yields.to"
            width={36}
            height={36}
            priority
            className="h-auto w-auto"
          />
          <span className="text-xl font-semibold tracking-tight">
            Yields.to
          </span>
        </Link>
        <Button
          asChild
          size="default"
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Link href="/dashboard">
            Launch dashboard
            <ArrowUpRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>
    </nav>
  );
}
