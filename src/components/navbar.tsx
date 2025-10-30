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
  { label: "Dashboard", href: "/dashboard" },
  { label: "Plasma Yields", href: "/plasma-yields" },
  { label: "Chain Stats", href: "/chain-stats" },
  { label: "Data Sources", href: "/data-sources" },
];

export function Navbar() {
  const [addProjectOpen, setAddProjectOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Yields.to"
              width={28}
              height={28}
              priority
              className="h-7 w-7 dark:invert"
            />
            <span className="hidden text-xl font-semibold tracking-tight lg:inline">
              Yields.to
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="default"
                  className="bg-foreground text-background hover:bg-foreground/90"
                >
                  Explore
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
      </nav>
      <AddProjectDialog open={addProjectOpen} onOpenChange={setAddProjectOpen} />
    </>
  );
}
