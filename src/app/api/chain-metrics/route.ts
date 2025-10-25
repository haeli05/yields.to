import { NextResponse } from "next/server";

import type {
  ApiResponse,
  BlockDatum,
  ChainMetricsData,
  ChainMetricsEnvelope,
  ContractDatum,
  TransactionsDatum,
  UsersDatum,
} from "@/types/chain-metrics";

const DEFAULT_BASE = "https://api-plasma.sumcap.xyz/api";
const API_BASE =
  process.env.SUMCAP_API_BASE?.replace(/\/$/, "") ?? DEFAULT_BASE;

const DEFAULT_HEADERS = {
  "User-Agent": "yields.to-app",
};

const ENDPOINTS = {
  users: "users",
  transactions: "transactions",
  contracts: "contract-data",
  blocks: "block-data",
} as const;

type EndpointKey = keyof typeof ENDPOINTS;

type EndpointResult = {
  key: EndpointKey;
  data: unknown[];
  error?: string;
};

async function fetchJson(url: string): Promise<ApiResponse<unknown>> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: DEFAULT_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as ApiResponse<unknown>;
}

async function loadMetrics(): Promise<{
  data: ChainMetricsData;
  errors: string[];
}> {
  const entries = Object.entries(ENDPOINTS) as Array<[EndpointKey, string]>;
  const results = await Promise.all(
    entries.map(async ([key, path]) => {
      const url = `${API_BASE}/${path}`;
      try {
        const json = await fetchJson(url);
        const data = Array.isArray(json.data) ? json.data : [];
        return { key, data } as EndpointResult;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        return { key, data: [], error: message } as EndpointResult;
      }
    }),
  );

  const nextData: ChainMetricsData = {
    users: [],
    transactions: [],
    contracts: [],
    blocks: [],
  };
  const errors: string[] = [];

  for (const result of results) {
    switch (result.key) {
      case "users":
        nextData.users = result.data as UsersDatum[];
        break;
      case "transactions":
        nextData.transactions = result.data as TransactionsDatum[];
        break;
      case "contracts":
        nextData.contracts = result.data as ContractDatum[];
        break;
      case "blocks":
        nextData.blocks = result.data as BlockDatum[];
        break;
      default:
        break;
    }

    if (result.error) {
      errors.push(`${result.key}: ${result.error}`);
    }
  }

  return { data: nextData, errors };
}

export async function GET() {
  try {
    const { data, errors } = await loadMetrics();
    const body: ChainMetricsEnvelope = {
      ...data,
      errors: errors.length ? errors : undefined,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "s-maxage=1200, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";

    const fallback: ChainMetricsEnvelope = {
      users: [],
      transactions: [],
      contracts: [],
      blocks: [],
      errors: [`Unexpected failure: ${message}`],
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(fallback, { status: 502 });
  }
}
