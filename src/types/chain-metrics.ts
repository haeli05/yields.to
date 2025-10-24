export type UsersDatum = {
  day: string;
  active_users?: number;
  new_users?: number;
  returning_users?: number;
  total_unique_wallets?: number;
};

export type TransactionsDatum = {
  day: string;
  daily_tx_count?: number;
  cumulative_tx_count?: number;
};

export type ContractDatum = {
  day: string;
  contract_creations?: number;
  cumulative_contracts?: number;
};

export type BlockDatum = {
  day: string;
  avg_txs_per_block?: number;
  avg_gas_used_per_block?: number;
  avg_gas_price_per_block?: number;
};

export type ChainMetricsData = {
  users: UsersDatum[];
  transactions: TransactionsDatum[];
  contracts: ContractDatum[];
  blocks: BlockDatum[];
};

export type ApiResponse<T> = {
  data?: T[];
};

export type ChainMetricsEnvelope = ChainMetricsData & {
  errors?: string[];
  fetchedAt?: string;
};
