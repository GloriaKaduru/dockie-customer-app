import { AlertTriangle, ArrowRight, Package, Plus, Sparkles, Timer, Wallet } from "lucide-react";
import Link from "next/link";
import { ShipmentsTable } from "@/components/shipments/shipments-table";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getInvoices, getShipments } from "@/lib/api";
import { currentUser, monthlyVolume } from "@/lib/mock-data";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Overview" };

// This is a Server Component (no "use client"), so it can await data directly.
export default async function DashboardPage() {
  const [shipments, invoices] = await Promise.all([getShipments(), getInvoices()]);

  const active = shipments.filter((s) => s.status !== "delivered");
  const attention = shipments.filter((s) => s.status === "delayed" || s.status === "customs");
  const arrivingSoon = active.filter((s) => new Date(s.eta) <= new Date("2026-10-07"));
  const outstanding = invoices.filter((i) => i.status !== "paid").reduce((sum, i) => sum + i.amount, 0);
  const maxVolume = Math.max(...monthlyVolume.map((m) => m.count));

  const stats = [
    { label: "Active shipments", value: active.length, icon: Package, href: "/shipments" },
    { label: "Arriving in 7 days", value: arrivingSoon.length, icon: Timer, href: "/shipments" },
    { label: "Need attention", value: attention.length, icon: AlertTriangle, href: "/shipments?status=attention", alert: attention.length > 0 },
    { label: "Outstanding balance", value: formatMoney(outstanding), icon: Wallet, href: "/billing" },
  ];

  return (
    <>
      <PageHeader
        title={`Good afternoon, ${currentUser.name.split(" ")[0]}`}
        description="Here's what's moving for Acme Trading today."
        actions={
          <ButtonLink href="/shipments/new">
            <Plus className="size-4" /> New shipment
          </ButtonLink>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, alert }) => (
          <Link key={label} href={href} className="rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand/40">
            <div className="flex items-center justify-between text-muted">
              <span className="text-xs font-medium sm:text-sm">{label}</span>
              <Icon className={alert ? "size-4 text-bad" : "size-4"} />
            </div>
            <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* AI insights */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-brand" /> Dockie AI insights
              </span>
            }
          />
          <ul className="divide-y divide-line">
            {attention.map((s) => (
              <li key={s.id}>
                <Link href={`/shipments/${s.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-subtle">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-warn-soft text-warn">
                    <AlertTriangle className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {s.id} · {s.origin.city} → {s.destination.city}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{s.aiNote}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* Volume chart */}
        <Card>
          <CardHeader title="Shipments per month" />
          <div className="flex h-48 items-end gap-3 px-5 pt-4 pb-3">
            {monthlyVolume.map((m, i) => (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs text-muted tabular-nums">{m.count}</span>
                <div
                  className={i === monthlyVolume.length - 1 ? "w-full rounded-t-md bg-brand" : "w-full rounded-t-md bg-brand/25"}
                  style={{ height: `${(m.count / maxVolume) * 100}px` }}
                />
                <span className="text-xs text-muted">{m.month}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader
          title="Recent shipments"
          action={
            <Link href="/shipments" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <ShipmentsTable shipments={shipments.slice(0, 5)} />
      </Card>
    </>
  );
}
