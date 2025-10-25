import { NextResponse } from "next/server";

export type ChateauMetrics = {
  totalReserves: number;
  fundsInTransit: number;
  protocolBackingRatio: number;
  ytdSharpeRatio: number;
  chUsdPrice: number;
  schUsdPrice: number;
  chUsdSupply: number;
  schUsdSupply: number;
  schUsdOneWeekIRR: number;
  schUsdFourWeekIRR: number;
  schUsdFiftyTwoWeekIRR: number;
  schUsdNav: number;
  chUsdTvl: number;
  timestamp: string;
  lastUpdated: number;
};

const CHATEAU_API = "https://app.chateau.capital/api/metrics";

export async function GET() {
  try {
    const response = await fetch(CHATEAU_API, {
      next: { revalidate: 1200 }, // Cache for 20 minutes
    });

    if (!response.ok) {
      throw new Error(`Chateau API returned ${response.status}`);
    }

    const data = (await response.json()) as ChateauMetrics;
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Chateau Capital API unavailable";
    return new NextResponse(message, { status: 502 });
  }
}
