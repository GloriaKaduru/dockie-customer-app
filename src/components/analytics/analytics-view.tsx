"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/app/page-header";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext } from "@/components/dockie/dockie-provider";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { monthlyStats, routeStats } from "@/lib/data";
import { shipmentStatus } from "@/lib/status";

// Single-series charts: one ink (chart-3), one y-axis each, tooltips on hover, table view for accessibility.
const volumeConfig = { shipments: { label: "Shipments", color: "var(--chart-3)" } } satisfies ChartConfig;
const pickupConfig = { pickupDays: { label: "Avg purchase → pickup (days)", color: "var(--chart-3)" } } satisfies ChartConfig;
const routeConfig = { avgDays: { label: "Avg door-to-door (days)", color: "var(--chart-3)" } } satisfies ChartConfig;

/** Analytics — operational performance, not a generic BI tool (PRD §9, P1). */
export function AnalyticsView() {
  const { shipments } = useWorkspace();
  const [range, setRange] = useState("6m");
  const group = (g: string) => shipments.filter((s) => shipmentStatus[s.status].group === g).length;

  const tiles = [
    { label: "Total shipments", value: 82 },
    { label: "In transit", value: group("in_transit") },
    { label: "Delivered", value: 42 },
    { label: "Issues", value: group("issues"), warn: true },
  ];
  const metrics = [
    ["Avg purchase → pickup", "6.8 days", "+1.9 vs Jul"],
    ["Avg pickup → booking", "0.9 days", "−0.2 vs Jul"],
    ["Avg booking → departure", "11.4 days", "+0.6 vs Jul"],
    ["Avg delivery duration", "36 days", "−1 vs Jul"],
    ["Delayed shipments", "1", "−2 vs Jul"],
  ];

  return (
    <>
      <SetDockieContext context={{ kind: "analytics" }} />
      <PageHeader title="Analytics" description="How your shipments are performing.">
        {/* Filters in one row above the charts (PRD §9.4) */}
        <div className="flex flex-wrap gap-2">
          <Filter value={range} onChange={setRange} options={[["30d", "Last 30 days"], ["6m", "Last 6 months"], ["12m", "Last 12 months"]]} />
          <Filter value="any" options={[["any", "All origins"], ["newark", "Newark, NJ"], ["savannah", "Savannah, GA"], ["baltimore", "Baltimore, MD"]]} />
          <Filter value="any" options={[["any", "All destinations"], ["lagos", "Lagos"], ["accra", "Accra"], ["cotonou", "Cotonou"]]} />
          <Filter value="any" options={[["any", "All types"], ["ocean", "Ocean"], ["inland", "Inland"]]} />
          <Filter value="any" options={[["any", "All statuses"], ["transit", "In transit"], ["delivered", "Delivered"], ["issues", "Issues"]]} />
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} size="sm">
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                {t.warn && t.value > 0 && <AlertTriangle className="size-3.5 text-destructive" />}
                {t.label}
              </CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{t.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <ChartCard
            title="Shipments per month"
            description="Bookings created, last 6 months"
            config={volumeConfig}
            table={monthlyStats.map((m) => [m.month, `${m.shipments}`])}
            chart={
              <BarChart data={monthlyStats} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
                <Bar dataKey="shipments" fill="var(--color-shipments)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            }
          />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational metrics</CardTitle>
            <CardDescription>September vs July</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {metrics.map(([k, v, d]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">
                    <span className="font-medium tabular-nums">{v}</span>
                    <span className="block text-xs text-muted-foreground">{d}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <ChartCard
            title="Average pickup time"
            description="Days from purchase to pickup"
            config={pickupConfig}
            table={monthlyStats.map((m) => [m.month, `${m.pickupDays} days`])}
            chart={
              <LineChart data={monthlyStats} margin={{ left: -16, right: 12, top: 8 }}>
                <CartesianGrid vertical={false} strokeOpacity={0.5} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 8]} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="pickupDays" type="monotone" stroke="var(--color-pickupDays)" strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }} activeDot={{ r: 5 }} />
              </LineChart>
            }
          />
        </Card>

        <Card>
          <ChartCard
            title="Longest routes"
            description="Average door-to-door days"
            config={routeConfig}
            table={routeStats.map((r) => [r.route, `${r.avgDays} days`])}
            chart={
              <BarChart data={routeStats} layout="vertical" margin={{ left: 0, right: 12 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="route" tickLine={false} axisLine={false} width={124} tick={{ fontSize: 11 }} />
                <ChartTooltip cursor={{ fillOpacity: 0.4 }} content={<ChartTooltipContent />} />
                <Bar dataKey="avgDays" fill="var(--color-avgDays)" radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            }
          />
        </Card>
      </div>
    </>
  );
}

function ChartCard({ title, description, config, chart, table }: { title: string; description: string; config: ChartConfig; chart: React.ReactElement; table: [string, string][] }) {
  const [view, setView] = useState("chart");
  return (
    <>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <ToggleGroup type="single" size="sm" variant="outline" value={view} onValueChange={(v) => v && setView(v)} aria-label={`${title} view`}>
            <ToggleGroupItem value="chart">Chart</ToggleGroupItem>
            <ToggleGroupItem value="table">Table</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        {view === "chart" ? (
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            {chart}
          </ChartContainer>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{title.includes("route") ? "Route" : "Month"}</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell>{k}</TableCell>
                  <TableCell className="text-right tabular-nums">{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </>
  );
}

function Filter({ value, onChange, options }: { value: string; onChange?: (v: string) => void; options: [string, string][] }) {
  return (
    <Select defaultValue={value} value={onChange ? value : undefined} onValueChange={onChange}>
      <SelectTrigger size="sm" className="w-auto">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
