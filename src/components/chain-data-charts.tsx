"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XYChart, AnimatedLineSeries, AnimatedAreaSeries, Axis, Grid, Tooltip } from "@visx/xychart";

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

type ChainDataChartsProps = {
  users: UserDataPoint[];
  transactions: TransactionDataPoint[];
  contracts: ContractDataPoint[];
  blocks: BlockDataPoint[];
};

const accessors = {
  xAccessor: (d: any) => new Date(d.date),
  yAccessor: (d: any) => d.value,
};

const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { notation: "compact" });

export function ChainDataCharts({ users, transactions, contracts, blocks }: ChainDataChartsProps) {
  // Transform data for charts
  const usersChartData = users.map(d => ({ date: d.date, value: d.dailyActiveUsers }));
  const cumulativeUsersData = users.map(d => ({ date: d.date, value: d.cumulativeUsers }));

  const txChartData = transactions.map(d => ({ date: d.date, value: d.dailyTransactions }));
  const cumulativeTxData = transactions.map(d => ({ date: d.date, value: d.cumulativeTransactions }));

  const contractsChartData = contracts.map(d => ({ date: d.date, value: d.dailyDeployments }));
  const cumulativeContractsData = contracts.map(d => ({ date: d.date, value: d.totalContracts }));

  const gasChartData = blocks.map(d => ({ date: d.date, value: d.avgGasPrice }));

  return (
    <div className="grid gap-6">
      {/* User Activity Chart */}
      <Card className="border border-border/60 bg-card">
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <CardDescription>
            Daily active wallets and cumulative unique addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersChartData.length > 0 ? (
            <XYChart
              height={300}
              xScale={{ type: "time" }}
              yScale={{ type: "linear" }}
            >
              <Grid columns={false} numTicks={4} />
              <AnimatedLineSeries
                dataKey="Daily Active"
                data={usersChartData}
                {...accessors}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
              <AnimatedAreaSeries
                dataKey="Cumulative Users"
                data={cumulativeUsersData}
                {...accessors}
                fill="hsl(var(--muted))"
                fillOpacity={0.3}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
              />
              <Axis orientation="bottom" numTicks={5} />
              <Axis orientation="left" numTicks={5} tickFormat={(v) => NUMBER_FORMAT.format(v)} />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }: any) => (
                  <div className="rounded-lg border bg-background p-2 shadow-lg">
                    <div className="text-xs font-semibold">
                      {tooltipData?.nearestDatum?.datum?.date ?
                        new Date(tooltipData.nearestDatum.datum.date).toLocaleDateString() :
                        'N/A'}
                    </div>
                    {Object.entries(tooltipData?.datumByKey ?? {}).map(([key, datum]: [string, any]) => (
                      <div key={key} className="text-xs">
                        {key}: {NUMBER_FORMAT.format(datum.datum.value)}
                      </div>
                    ))}
                  </div>
                )}
              />
            </XYChart>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transactions Chart */}
      <Card className="border border-border/60 bg-card">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Daily transaction throughput and cumulative count
          </CardDescription>
        </CardHeader>
        <CardContent>
          {txChartData.length > 0 ? (
            <XYChart
              height={300}
              xScale={{ type: "time" }}
              yScale={{ type: "linear" }}
            >
              <Grid columns={false} numTicks={4} />
              <AnimatedLineSeries
                dataKey="Daily Transactions"
                data={txChartData}
                {...accessors}
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
              <AnimatedAreaSeries
                dataKey="Cumulative Transactions"
                data={cumulativeTxData}
                {...accessors}
                fill="hsl(var(--muted))"
                fillOpacity={0.3}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
              />
              <Axis orientation="bottom" numTicks={5} />
              <Axis orientation="left" numTicks={5} tickFormat={(v) => NUMBER_FORMAT.format(v)} />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }: any) => (
                  <div className="rounded-lg border bg-background p-2 shadow-lg">
                    <div className="text-xs font-semibold">
                      {tooltipData?.nearestDatum?.datum?.date ?
                        new Date(tooltipData.nearestDatum.datum.date).toLocaleDateString() :
                        'N/A'}
                    </div>
                    {Object.entries(tooltipData?.datumByKey ?? {}).map(([key, datum]: [string, any]) => (
                      <div key={key} className="text-xs">
                        {key}: {NUMBER_FORMAT.format(datum.datum.value)}
                      </div>
                    ))}
                  </div>
                )}
              />
            </XYChart>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contract Deployments Chart */}
      <Card className="border border-border/60 bg-card">
        <CardHeader>
          <CardTitle>Contract Deployments</CardTitle>
          <CardDescription>
            Daily deployments and total contracts on Plasma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contractsChartData.length > 0 ? (
            <XYChart
              height={300}
              xScale={{ type: "time" }}
              yScale={{ type: "linear" }}
            >
              <Grid columns={false} numTicks={4} />
              <AnimatedLineSeries
                dataKey="Daily Deployments"
                data={contractsChartData}
                {...accessors}
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
              <AnimatedAreaSeries
                dataKey="Total Contracts"
                data={cumulativeContractsData}
                {...accessors}
                fill="hsl(var(--muted))"
                fillOpacity={0.3}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
              />
              <Axis orientation="bottom" numTicks={5} />
              <Axis orientation="left" numTicks={5} tickFormat={(v) => NUMBER_FORMAT.format(v)} />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }: any) => (
                  <div className="rounded-lg border bg-background p-2 shadow-lg">
                    <div className="text-xs font-semibold">
                      {tooltipData?.nearestDatum?.datum?.date ?
                        new Date(tooltipData.nearestDatum.datum.date).toLocaleDateString() :
                        'N/A'}
                    </div>
                    {Object.entries(tooltipData?.datumByKey ?? {}).map(([key, datum]: [string, any]) => (
                      <div key={key} className="text-xs">
                        {key}: {NUMBER_FORMAT.format(datum.datum.value)}
                      </div>
                    ))}
                  </div>
                )}
              />
            </XYChart>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block Utilization Chart */}
      <Card className="border border-border/60 bg-card">
        <CardHeader>
          <CardTitle>Average Gas Price</CardTitle>
          <CardDescription>
            Block-level gas price trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gasChartData.length > 0 ? (
            <XYChart
              height={300}
              xScale={{ type: "time" }}
              yScale={{ type: "linear" }}
            >
              <Grid columns={false} numTicks={4} />
              <AnimatedLineSeries
                dataKey="Avg Gas Price"
                data={gasChartData}
                {...accessors}
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
              />
              <Axis orientation="bottom" numTicks={5} />
              <Axis orientation="left" numTicks={5} tickFormat={(v) => NUMBER_FORMAT.format(v)} />
              <Tooltip
                snapTooltipToDatumX
                snapTooltipToDatumY
                showVerticalCrosshair
                showSeriesGlyphs
                renderTooltip={({ tooltipData }: any) => (
                  <div className="rounded-lg border bg-background p-2 shadow-lg">
                    <div className="text-xs font-semibold">
                      {tooltipData?.nearestDatum?.datum?.date ?
                        new Date(tooltipData.nearestDatum.datum.date).toLocaleDateString() :
                        'N/A'}
                    </div>
                    {Object.entries(tooltipData?.datumByKey ?? {}).map(([key, datum]: [string, any]) => (
                      <div key={key} className="text-xs">
                        {key}: {NUMBER_FORMAT.format(datum.datum.value)}
                      </div>
                    ))}
                  </div>
                )}
              />
            </XYChart>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
