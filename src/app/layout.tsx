import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yields.to"),
  title: {
    default: "yields.to",
    template: "%s | yields.to",
  },
  description: "Find the best yields on Plasma.",
  keywords: [
    "Plasma chain",
    "DeFi yields",
    "staking",
    "restaking",
    "onchain analytics",
  ],
  openGraph: {
    title: "yields.to · Plasma yield discovery",
    description:
      "Track validator incentives, liquidity mining programs, and structured strategies across the Plasma ecosystem.",
    url: "https://yields.to",
    siteName: "yields.to",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "yields.to · Plasma yield discovery",
    description:
      "Actionable yield intelligence for builders and funds operating on the Plasma chain.",
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
        {children}
      </body>
    </html>
  );
}
