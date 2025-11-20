"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { AddProjectDialog } from "@/components/add-project-dialog";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Plasma Yields", href: "/plasma-yields" },
  { label: "Chain Stats", href: "/chain-stats" },
  { label: "Data Sources", href: "/data-sources" },
];

export function Navbar() {
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Yields.to"
              width={32}
              height={32}
              priority
              className="h-8 w-8 dark:invert"
            />
            <div>
              <span className="text-base font-semibold leading-tight">Yields.to</span>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                Plasma
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="default" className="rounded-full px-4 text-sm font-semibold">
                  Explore
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>Pages</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {NAV_LINKS.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href} className="cursor-pointer">
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setAddProjectOpen(true)}
                  className="cursor-pointer"
                >
                  Add Your Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </>
  );
}
