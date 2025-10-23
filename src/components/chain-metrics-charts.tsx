'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ParentSize } from '@visx/responsive';
import { Group } from '@visx/group';
import { Bar, BarStack, LinePath } from '@visx/shape';
import { scaleBand, scaleLinear, scaleOrdinal, scaleTime } from '@visx/scale';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';

type UsersDatum = {
  day: string;
  active_users?: number;
  new_users?: number;
  returning_users?: number;
  total_unique_wallets?: number;
};

type TransactionsDatum = {
  day: string;
  daily_tx_count?: number;
  cumulative_tx_count?: number;
};

type ContractDatum = {
  day: string;
  contract_creations?: number;
  cumulative_contracts?: number;
};

type BlockDatum = {
  day: string;
  avg_txs_per_block?: number;
  avg_gas_used_per_block?: number;
  avg_gas_price_per_block?: number;
};

type ApiResponse<T> = {
  data?: T[];
};

type ChainMetricsData = {
  users: UsersDatum[];
  transactions: TransactionsDatum[];
  contracts: ContractDatum[];
  blocks: BlockDatum[];
};

const API_BASE = 'https://api-plasma.sumcap.xyz/api';
const DATE_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});
const NUMBER_COMPACT = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function createSampleChainMetrics(): ChainMetricsData {
  const days = 30;
  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);
  baseDate.setDate(baseDate.getDate() - (days - 1));

  const users: UsersDatum[] = [];
  const transactions: TransactionsDatum[] = [];
  const contracts: ContractDatum[] = [];
  const blocks: BlockDatum[] = [];

  let cumulativeWallets = 80_000;
  let cumulativeTx = 2_500_000;
  let cumulativeContracts = 12_000;

  for (let index = 0; index < days; index += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);
    const isoDay = date.toISOString();

    const activeBase =
      3_600 + index * 95 + Math.round(420 * Math.sin(index / 3.5));
    const newcomers = Math.max(
      240,
      Math.round(activeBase * 0.38 + 160 * Math.cos(index / 4.4)),
    );
    const returning = Math.max(0, activeBase - newcomers);
    cumulativeWallets += newcomers;

    users.push({
      day: isoDay,
      active_users: activeBase,
      new_users: newcomers,
      returning_users: returning,
      total_unique_wallets: cumulativeWallets,
    });

    const dailyTx =
      55_000 + index * 950 + Math.round(9_500 * Math.sin(index / 2.15));
    cumulativeTx += dailyTx;

    transactions.push({
      day: isoDay,
      daily_tx_count: dailyTx,
      cumulative_tx_count: cumulativeTx,
    });

    const dailyContracts = Math.max(
      35,
      Math.round(70 + 18 * Math.sin(index / 2.6)),
    );
    cumulativeContracts += dailyContracts;

    contracts.push({
      day: isoDay,
      contract_creations: dailyContracts,
      cumulative_contracts: cumulativeContracts,
    });

    const avgTxPerBlock = Number((16 + Math.sin(index / 3.1) * 5).toFixed(2));
    const avgGasUsed = Number(
      (540_000 + Math.cos(index / 3.8) * 90_000).toFixed(2),
    );
    const avgGasPrice = Math.max(
      1,
      26_000_000_000 + Math.sin(index / 4.7) * 6_500_000_000,
    );

    blocks.push({
      day: isoDay,
      avg_txs_per_block: avgTxPerBlock,
      avg_gas_used_per_block: avgGasUsed,
      avg_gas_price_per_block: avgGasPrice,
    });
  }

  return { users, transactions, contracts, blocks };
}

const SAMPLE_CHAIN_METRICS = createSampleChainMetrics();

type ChainMetricsState = {
  status: 'loading' | 'ready' | 'error';
  data: ChainMetricsData;
  sample: boolean;
  error?: string;
};

type UsersPoint = {
  date: Date;
  active: number;
  newcomers: number;
  returning: number;
  unique: number;
};

type TransactionsPoint = {
  date: Date;
  daily: number;
  cumulative: number;
};

type ContractsPoint = {
  date: Date;
  daily: number;
  cumulative: number;
};

type BlocksPoint = {
  date: Date;
  avgTxPerBlock: number;
  avgGasUsed: number;
  avgGasPriceGwei: number;
};

const lastN = <T,>(values: T[], count: number) =>
  values.length > count ? values.slice(values.length - count) : values;

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border/40 bg-secondary/10 p-6 shadow-sm backdrop-blur">
      <header className="mb-4 flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground md:text-lg">
          {title}
        </h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="relative h-72 w-full flex-1">{children}</div>
    </article>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/50 bg-background/40 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg border border-border/20 bg-background/40 text-sm text-muted-foreground">
      Loading latest metrics…
    </div>
  );
}

function UsersChart({ data }: { data: UsersPoint[] }) {
  if (!data.length) {
    return <EmptyState message="User activity data is currently unavailable." />;
  }

  return (
    <ParentSize debounceTime={40}>
      {({ width, height }) => {
        if (width === 0 || height === 0) return null;

        const margin = { top: 12, right: 12, bottom: 36, left: 48 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const xScale = scaleTime({
          range: [0, innerWidth],
          domain: [
            data[0].date,
            data[data.length - 1].date,
          ] as [Date, Date],
        });

        const maxValue = Math.max(...data.map((d) => d.active));
        const yScale = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxValue * 1.1 || 1],
          nice: true,
        });

        const series = [
          { key: 'active', label: 'Active users', color: '#22c55e' },
          { key: 'newcomers', label: 'New users', color: '#0ea5e9' },
          { key: 'returning', label: 'Returning', color: '#a855f7' },
        ] as const;

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <AxisLeft
                scale={yScale}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'middle',
                  dy: '0.33em',
                })}
                tickFormat={(value) => DATE_LABEL.format(value as Date)}
              />
              {series.map((serie) => (
                <LinePath
                  key={serie.key}
                  data={data}
                  x={(d) => xScale(d.date)}
                  y={(d) => yScale(d[serie.key])}
                  stroke={serie.color}
                  strokeWidth={2}
                  strokeOpacity={1}
                  fill="none"
                />
              ))}
            </Group>
            <Legend items={series.map(({ label, color }) => ({ label, color }))} />
          </svg>
        );
      }}
    </ParentSize>
  );
}

function UserBreakdownChart({ data }: { data: UsersPoint[] }) {
  if (!data.length) {
    return <EmptyState message="User breakdown data is currently unavailable." />;
  }

  return (
    <ParentSize debounceTime={40}>
      {({ width, height }) => {
        if (width === 0 || height === 0) return null;

        const margin = { top: 12, right: 52, bottom: 36, left: 48 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const STACK_KEYS = ['newcomers', 'returning'] as const;
        type StackKey = (typeof STACK_KEYS)[number];
        type BreakdownDatum = {
          date: Date;
          time: number;
          newcomers: number;
          returning: number;
          unique: number;
        };

        const stackData: BreakdownDatum[] = data.map((point) => ({
          date: point.date,
          time: point.date.getTime(),
          newcomers: point.newcomers,
          returning: point.returning,
          unique: point.unique,
        }));

        const xDomain = stackData.map((point) => point.time);
        const xScale = scaleBand<number>({
          range: [0, innerWidth],
          domain: xDomain,
          padding: 0.2,
        });

        const maxStackValue = Math.max(
          ...stackData.map((point) => point.newcomers + point.returning),
        );
        const yBar = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxStackValue * 1.1 || 1],
          nice: true,
        });

        const maxUnique = Math.max(...stackData.map((point) => point.unique));
        const yLine = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxUnique * 1.05 || 1],
          nice: true,
        });

        const colorScale = scaleOrdinal<StackKey, string>({
          domain: STACK_KEYS,
          range: ['#0ea5e9', '#a855f7'],
        });

        const bandWidth = xScale.bandwidth();
        const tickModulo = Math.max(1, Math.ceil(stackData.length / 8));

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <AxisLeft
                scale={yBar}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                stroke="#475569"
                tickStroke="#475569"
                tickValues={xDomain.filter((_, index) => index % tickModulo === 0)}
                tickFormat={(value) => DATE_LABEL.format(new Date(Number(value)))}
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 10,
                  textAnchor: 'middle',
                  dy: '0.5em',
                })}
              />
              <AxisRight
                left={innerWidth}
                scale={yLine}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'start',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />

              <BarStack<BreakdownDatum, StackKey>
                data={stackData}
                keys={STACK_KEYS}
                x={(point) => point.time}
                xScale={xScale}
                yScale={yBar}
                color={colorScale}
              >
                {(barStacks) =>
                  barStacks.map((barStack) =>
                    barStack.bars.map((bar) => (
                      <rect
                        key={`barstack-${barStack.key}-${bar.index}`}
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        fill={bar.color}
                        opacity={0.85}
                      />
                    )),
                  )
                }
              </BarStack>

              <LinePath
                data={stackData}
                x={(point) => {
                  const x = xScale(point.time);
                  return (x ?? 0) + bandWidth / 2;
                }}
                y={(point) => yLine(point.unique)}
                stroke="#22c55e"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </Group>
            <Legend
              items={[
                { label: 'New users (daily)', color: '#0ea5e9' },
                { label: 'Returning users (daily)', color: '#a855f7' },
                { label: 'Total unique wallets', color: '#22c55e' },
              ]}
            />
          </svg>
        );
      }}
    </ParentSize>
  );
}

function TransactionsChart({ data }: { data: TransactionsPoint[] }) {
  if (!data.length) {
    return (
      <EmptyState message="Transaction activity data is currently unavailable." />
    );
  }

  return (
    <ParentSize debounceTime={40}>
      {({ width, height }) => {
        if (width === 0 || height === 0) return null;
        const margin = { top: 12, right: 52, bottom: 36, left: 48 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const xScale = scaleTime({
          range: [0, innerWidth],
          domain: [
            data[0].date,
            data[data.length - 1].date,
          ] as [Date, Date],
        });

        const maxDaily = Math.max(...data.map((d) => d.daily));
        const yLeft = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxDaily * 1.1 || 1],
          nice: true,
        });

        const maxCumulative = Math.max(...data.map((d) => d.cumulative));
        const yRight = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxCumulative * 1.05 || 1],
          nice: true,
        });

        const areaPath = data.map((point, idx) => {
          const x = xScale(point.date);
          const y = yLeft(point.daily);
          if (idx === 0) {
            return `M${x},${innerHeight} L${x},${y}`;
          }
          return `L${x},${y}`;
        });

        const areaClose = `${areaPath.join(' ')} L${xScale(
          data[data.length - 1].date,
        )},${innerHeight} Z`;

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <AxisLeft
                scale={yLeft}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'middle',
                  dy: '0.33em',
                })}
                tickFormat={(value) => DATE_LABEL.format(value as Date)}
              />
              <AxisRight
                left={innerWidth}
                scale={yRight}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'start',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />
              <path
                d={areaClose}
                fill="#0ea5e9"
                fillOpacity={0.2}
                stroke="none"
              />
              <LinePath
                data={data}
                x={(d) => xScale(d.date)}
                y={(d) => yLeft(d.daily)}
                stroke="#0ea5e9"
                strokeWidth={2}
              />
              <LinePath
                data={data}
                x={(d) => xScale(d.date)}
                y={(d) => yRight(d.cumulative)}
                stroke="#22c55e"
                strokeWidth={2}
              />
            </Group>
            <Legend
              items={[
                { label: 'Daily transactions', color: '#0ea5e9' },
                { label: 'Cumulative transactions', color: '#22c55e' },
              ]}
            />
          </svg>
        );
      }}
    </ParentSize>
  );
}

function ContractsChart({ data }: { data: ContractsPoint[] }) {
  if (!data.length) {
    return (
      <EmptyState message="Contract deployment data is currently unavailable." />
    );
  }

  return (
    <ParentSize debounceTime={40}>
      {({ width, height }) => {
        if (width === 0 || height === 0) return null;
        const margin = { top: 12, right: 52, bottom: 36, left: 48 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const xScale = scaleTime({
          range: [0, innerWidth],
          domain: [
            data[0].date,
            data[data.length - 1].date,
          ] as [Date, Date],
        });

        const maxDaily = Math.max(...data.map((d) => d.daily));
        const yLeft = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxDaily * 1.1 || 1],
          nice: true,
        });

        const maxCumulative = Math.max(...data.map((d) => d.cumulative));
        const yRight = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxCumulative * 1.05 || 1],
          nice: true,
        });

        const barWidth = data.length ? Math.max(innerWidth / data.length - 6, 2) : 4;

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <AxisLeft
                scale={yLeft}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'middle',
                  dy: '0.33em',
                })}
                tickFormat={(value) => DATE_LABEL.format(value as Date)}
              />
              <AxisRight
                left={innerWidth}
                scale={yRight}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'start',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
              />

              {data.map((point) => {
                const x = xScale(point.date) - barWidth / 2;
                const y = yLeft(point.daily);
                const heightValue = innerHeight - y;
                return (
                  <Bar
                    key={`bar-${point.date.toISOString()}`}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={heightValue}
                    fill="#8b5cf6"
                    fillOpacity={0.35}
                  />
                );
              })}

              <LinePath
                data={data}
                x={(d) => xScale(d.date)}
                y={(d) => yRight(d.cumulative)}
                stroke="#a855f7"
                strokeWidth={2}
              />
            </Group>
            <Legend
              items={[
                { label: 'Daily contract deployments', color: '#8b5cf6' },
                { label: 'Total contracts', color: '#a855f7' },
              ]}
            />
          </svg>
        );
      }}
    </ParentSize>
  );
}

function BlockMetricsChart({ data }: { data: BlocksPoint[] }) {
  if (!data.length) {
    return (
      <EmptyState message="Block production data is currently unavailable." />
    );
  }

  return (
    <ParentSize debounceTime={40}>
      {({ width, height }) => {
        if (width === 0 || height === 0) return null;
        const margin = { top: 12, right: 52, bottom: 36, left: 48 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const xScale = scaleTime({
          range: [0, innerWidth],
          domain: [
            data[0].date,
            data[data.length - 1].date,
          ] as [Date, Date],
        });

        const maxLeft = Math.max(
          ...data.map((d) => Math.max(d.avgTxPerBlock, d.avgGasUsed / 1_000)),
        );
        const yLeft = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxLeft * 1.1 || 1],
          nice: true,
        });

        const maxRight = Math.max(...data.map((d) => d.avgGasPriceGwei));
        const yRight = scaleLinear({
          range: [innerHeight, 0],
          domain: [0, maxRight * 1.1 || 1],
          nice: true,
        });

        return (
          <svg width={width} height={height}>
            <Group left={margin.left} top={margin.top}>
              <AxisLeft
                scale={yLeft}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'end',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
                label="Tx / block & gas used (×1k)"
                labelProps={{
                  fill: '#94a3b8',
                  fontSize: 10,
                  textAnchor: 'middle',
                  transform: 'translate(-40, -10)',
                }}
              />
              <AxisBottom
                top={innerHeight}
                scale={xScale}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'middle',
                  dy: '0.33em',
                })}
                tickFormat={(value) => DATE_LABEL.format(value as Date)}
              />
              <AxisRight
                left={innerWidth}
                scale={yRight}
                stroke="#475569"
                tickStroke="#475569"
                tickLabelProps={() => ({
                  fill: '#94a3b8',
                  fontSize: 11,
                  textAnchor: 'start',
                  dy: '0.33em',
                })}
                tickFormat={(value) => NUMBER_COMPACT.format(Number(value))}
                label="Avg gas price (Gwei)"
                labelProps={{
                  fill: '#94a3b8',
                  fontSize: 10,
                  textAnchor: 'middle',
                  transform: 'translate(36, -10)',
                }}
              />

              <LinePath
                data={data}
                x={(d) => xScale(d.date)}
                y={(d) => yLeft(d.avgTxPerBlock)}
                stroke="#22d3ee"
                strokeWidth={2}
              />

              <LinePath
                data={data}
                x={(d) => xScale(d.date)}
                y={(d) => yLeft(d.avgGasUsed / 1_000)}
                stroke="#f97316"
                strokeWidth={2}
              />

              <LinePath
                data={data}
                x={(d) => xScale(d.date)}
                y={(d) => yRight(d.avgGasPriceGwei)}
                stroke="#ef4444"
                strokeWidth={2}
              />
            </Group>
            <Legend
              items={[
                { label: 'Avg tx per block', color: '#22d3ee' },
                { label: 'Avg gas used (×1k)', color: '#f97316' },
                { label: 'Avg gas price (Gwei)', color: '#ef4444' },
              ]}
            />
          </svg>
        );
      }}
    </ParentSize>
  );
}

function Legend({
  items,
}: {
  items: Array<{ label: string; color: string }>;
}) {
  return (
    <foreignObject x={12} y={12} width="90%" height={32}>
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {items.map((item) => (
          <span key={item.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </foreignObject>
  );
}

export function ChainMetricsCharts() {
  const [state, setState] = useState<ChainMetricsState>(() => ({
    status: 'ready',
    data: SAMPLE_CHAIN_METRICS,
    sample: true,
  }));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [usersRes, transactionsRes, contractsRes, blocksRes] =
          await Promise.all([
            fetch(`${API_BASE}/users`).then((res) =>
              res.json() as Promise<ApiResponse<UsersDatum>>,
            ),
            fetch(`${API_BASE}/transactions`).then((res) =>
              res.json() as Promise<ApiResponse<TransactionsDatum>>,
            ),
            fetch(`${API_BASE}/contract-data`).then((res) =>
              res.json() as Promise<ApiResponse<ContractDatum>>,
            ),
            fetch(`${API_BASE}/block-data`).then((res) =>
              res.json() as Promise<ApiResponse<BlockDatum>>,
            ),
          ]);

          if (cancelled) return;

          const nextData: ChainMetricsData = {
            users: usersRes.data ?? [],
            transactions: transactionsRes.data ?? [],
            contracts: contractsRes.data ?? [],
            blocks: blocksRes.data ?? [],
          };

          const hasLiveUsers = nextData.users.length > 0;

          if (!hasLiveUsers) {
            setState({
              status: 'error',
              data: SAMPLE_CHAIN_METRICS,
              sample: true,
              error:
                'Live metrics API returned no user data. Showing recent sample metrics instead.',
            });
            return;
          }

          setState({
            status: 'ready',
            data: nextData,
            sample: false,
          });
        } catch (error) {
          if (cancelled) return;
          setState((prev) => ({
            status: 'error',
            data: prev.data,
            sample: prev.sample,
            error:
              error instanceof Error
                ? `Unable to load live Plasma metrics: ${error.message}. Showing sample data.`
                : 'Unable to load live Plasma metrics. Showing sample data.',
          }));
        }
      };

      load();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalized = useMemo(() => {
    if (state.status === 'loading' && !state.sample) {
      return null;
    }

    const source = state.data;
    const users = lastN(
      source.users
        .map((entry) => {
          const date = toDate(entry.day);
          if (!date) return null;
          return {
            date,
            active: Number(entry.active_users ?? 0),
            newcomers: Number(entry.new_users ?? 0),
            returning: Number(entry.returning_users ?? 0),
            unique: Number(entry.total_unique_wallets ?? 0),
          };
        })
        .filter(Boolean) as UsersPoint[],
      60,
    );

    const transactions = lastN(
      source.transactions
        .map((entry) => {
          const date = toDate(entry.day);
          if (!date) return null;
          return {
            date,
            daily: Number(entry.daily_tx_count ?? 0),
            cumulative: Number(entry.cumulative_tx_count ?? 0),
          };
        })
        .filter(Boolean) as TransactionsPoint[],
      60,
    );

    const contracts = lastN(
      source.contracts
        .map((entry) => {
          const date = toDate(entry.day);
          if (!date) return null;
          return {
            date,
            daily: Number(entry.contract_creations ?? 0),
            cumulative: Number(entry.cumulative_contracts ?? 0),
          };
        })
        .filter(Boolean) as ContractsPoint[],
      60,
    );

    const blocks = lastN(
      source.blocks
        .map((entry) => {
          const date = toDate(entry.day);
          if (!date) return null;
          const avgTxPerBlock = Number(entry.avg_txs_per_block ?? 0);
          const avgGasUsed = Number(entry.avg_gas_used_per_block ?? 0);
          const avgGasPriceGwei = Number(entry.avg_gas_price_per_block ?? 0) / 1_000_000_000;
          return {
            date,
            avgTxPerBlock,
            avgGasUsed,
            avgGasPriceGwei,
          };
        })
        .filter(Boolean) as BlocksPoint[],
      60,
    );

    return { users, transactions, contracts, blocks };
  }, [state]);

  if (!normalized) {
    return (
      <section className="grid gap-6 md:grid-cols-2">
        <ChartCard title="User breakdown">
          <LoadingState />
        </ChartCard>
        <ChartCard title="Daily active users">
          <LoadingState />
        </ChartCard>
        <ChartCard title="Transactions">
          <LoadingState />
        </ChartCard>
        <ChartCard title="Contract deployments">
          <LoadingState />
        </ChartCard>
        <ChartCard title="Block metrics">
          <LoadingState />
        </ChartCard>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {state.status === 'error' ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error ||
            'Unable to load live Plasma metrics. Showing sample data.'}
        </div>
      ) : null}
      {state.sample ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-secondary/10 px-4 py-3 text-sm text-muted-foreground">
          Showing sample metrics while the live Plasma data loads.
        </div>
      ) : null}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="User breakdown"
          description="Daily new vs returning wallets with cumulative unique holders."
        >
          <UserBreakdownChart data={normalized.users} />
        </ChartCard>
        <ChartCard
          title="Daily active users"
          description="New vs returning wallets interacting with Plasma."
        >
          <UsersChart data={normalized.users} />
        </ChartCard>
        <ChartCard
          title="Transactions"
          description="Daily throughput alongside total transactions since launch."
        >
          <TransactionsChart data={normalized.transactions} />
        </ChartCard>
        <ChartCard
          title="Contract deployments"
          description="New smart contracts deployed per day and cumulative total."
        >
          <ContractsChart data={normalized.contracts} />
        </ChartCard>
        <ChartCard
          title="Block production"
          description="Average transactions per block, gas used, and gas price."
        >
          <BlockMetricsChart data={normalized.blocks} />
        </ChartCard>
      </div>
    </section>
  );
}
