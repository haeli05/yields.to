import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Script from "next/script";
import "./globals.css";

import { Navbar } from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "yields.to",
  url: "https://yields.to",
  description: "Find the best yields on Plasma",
  inLanguage: "en-US",
  publisher: {
    "@type": "Organization",
    name: "yields.to",
    url: "https://yields.to",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL("https://yields.to"),
  title: {
    default: "yields.to",
    template: "%s | yields.to",
  },
  description: "Find the best yields on Plasma",
  keywords: [
    "Plasma chain",
    "DeFi yields",
    "staking",
    "restaking",
    "onchain analytics",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "Finance",
  openGraph: {
    title: "yields.to · Plasma yield discovery",
    description:
      "Track validator incentives, liquidity mining programs, and structured strategies across the Plasma ecosystem.",
    url: "https://yields.to",
    siteName: "yields.to",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://yields.to/logo.png",
        width: 746,
        height: 635,
        alt: "yields.to logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "yields.to · Plasma yield discovery",
    description:
      "Actionable yield intelligence for builders and funds operating on the Plasma chain.",
    images: ["https://yields.to/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="site-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <Navbar />
          <div className="flex-1">{children}</div>
          <footer className="border-t border-border bg-card px-6 py-8">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} yields.to. All rights reserved.</span>
              <a
                href="https://x.com/yields_to"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Follow us on X @yields_to
              </a>
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
