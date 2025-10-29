import type { Metadata } from "next";
import { ChainDataCharts } from "@/components/chain-data-charts";

export const metadata: Metadata = {
  title: "Chain Data",
  description: "Raw Plasma chain data from SumCap APIs including users, transactions, contracts, and block utilization.",
};

type UserDataPoint = {
  date: string;
  dailyActiveUsers: number;
  cumulativeUsers: number;
};

type TransactionDataPoint = {
  date: string;
  dailyTransactions: number;
  cumulativeTransactions: number;
};

type ContractDataPoint = {
  date: string;
  dailyDeployments: number;
  totalContracts: number;
};

type BlockDataPoint = {
  date: string;
  avgGasPrice: number;
  avgGasUsed: number;
  avgTxPerBlock: number;
};

async function fetchChainData() {
  const baseUrl = "https://api-plasma.sumcap.xyz/api";

  try {
    const [usersRes, txRes, contractsRes, blocksRes] = await Promise.all([
      fetch(`${baseUrl}/users`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${baseUrl}/transactions`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${baseUrl}/contract-data`, { next: { revalidate: 3600 } }).catch(() => null),
      fetch(`${baseUrl}/block-data`, { next: { revalidate: 3600 } }).catch(() => null),
    ]);

    let users: UserDataPoint[] = [];
    let transactions: TransactionDataPoint[] = [];
    let contracts: ContractDataPoint[] = [];
    let blocks: BlockDataPoint[] = [];

    if (usersRes?.ok) {
      const data = await usersRes.json();
      users = Array.isArray(data) ? data : [];
    }

    if (txRes?.ok) {
      const data = await txRes.json();
      transactions = Array.isArray(data) ? data : [];
    }

    if (contractsRes?.ok) {
      const data = await contractsRes.json();
      contracts = Array.isArray(data) ? data : [];
    }

    if (blocksRes?.ok) {
      const data = await blocksRes.json();
      blocks = Array.isArray(data) ? data : [];
    }

    return { users, transactions, contracts, blocks };
  } catch (error) {
    console.error("Failed to fetch chain data:", error);
    return { users: [], transactions: [], contracts: [], blocks: [] };
  }
}

export default async function ChainDataPage() {
  const data = await fetchChainData();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:px-10 lg:px-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Plasma Chain Data
        </h1>
        <p className="text-sm text-muted-foreground">
          Live Plasma chain metrics from SumCap APIs. Data refreshed hourly.
        </p>
      </div>

      <ChainDataCharts
        users={data.users}
        transactions={data.transactions}
        contracts={data.contracts}
        blocks={data.blocks}
      />
    </main>
  );
}
