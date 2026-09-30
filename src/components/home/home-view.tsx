"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, FileWarning, Package, Sparkles, UserPlus } from "lucide-react";
import Link from "next/link";
import { useWorkspace, useAttention } from "@/components/app/workspace-provider";
import { EmptyState } from "@/components/app/states";
import { Composer } from "@/components/dockie/composer";
import { SetDockieContext, useDockie } from "@/components/dockie/dockie-provider";
import { mockTranscript } from "@/components/dockie/engine";
import { ShipmentTable } from "@/components/shipments/shipment-table";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/data";
import { formatMoney, timeAgo, vehicleName } from "@/lib/format";
import { shipmentStatus, statusGroups } from "@/lib/status";

/** Home: "What's happening, and what needs my attention?" (PRD §1) */
export function HomeView({ empty }: { empty: boolean }) {
  const { shipments } = useWorkspace();
  const { ask, startNewShipment } = useDockie();
  const hour = 14; // prototype clock (see NOW)
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (empty) {
    // New organization (PRD §1.7)
    return (
      <>
        <SetDockieContext context={{ kind: "home" }} />
        <EmptyState icon={Package} title="Welcome to Dockie" description="Your logistics workspace is ready. Start by moving your first vehicle or ask Dockie what you can do." className="min-h-[60vh]">
          <Button onClick={startNewShipment}>Start a shipment</Button>
          <Button variant="outline" onClick={() => ask("What can you do?")}>
            <Sparkles /> Ask Dockie
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/settings?tab=team">
              <UserPlus /> Invite your team
            </Link>
          </Button>
        </EmptyState>
      </>
    );
  }

  const recent = [...shipments].sort((a, b) => +new Date(b.lastUpdated) - +new Date(a.lastUpdated)).slice(0, 5);
  const activity = shipments
    .flatMap((s) => s.activity.map((a) => ({ ...a, shipment: s })))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <SetDockieContext context={{ kind: "home" }} />

      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting}, {currentUser.firstName}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your shipments.</p>
        </div>
        {/* Global Dockie entry — the most important element on Home (PRD §1.3) */}
        <div className="max-w-2xl space-y-2.5">
          <Composer onSend={ask} transcript={() => mockTranscript({ kind: "home" })} placeholder="Ask Dockie anything…" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Try:</span>
            {["Where are my shipments?", "What's delayed?", "Start a new shipment"].map((p) => (
              <Button key={p} variant="outline" size="xs" onClick={() => ask(p === "Start a new shipment" ? "Start a shipment" : p)}>
                {p}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <NeedsAttention />

      <section>
        <h2 className="mb-3 text-sm font-medium">Shipment overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {statusGroups.map(({ key, label }) => {
            const count = shipments.filter((s) => shipmentStatus[s.status].group === key).length;
            return (
              <Link key={key} href={`/shipments?group=${key}`} className="group rounded-xl border p-4 transition-colors hover:bg-muted/50">
                <p className={cn("text-2xl font-semibold tabular-nums", key === "issues" && count > 0 && "text-destructive")}>{count}</p>
                <p className="flex items-center justify-between text-sm text-muted-foreground">
                  {label}
                  <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="py-0 xl:col-span-2">
          <CardHeader className="border-b pt-4">
            <CardTitle>Recent shipments</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/shipments">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <ShipmentTable shipments={recent} columns={["vehicle", "booking", "status", "location", "eta"]} dense />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {activity.map((a, i) => (
                <li key={i} className="text-sm">
                  <p>
                    <span className="font-medium">{a.actor}</span> {a.text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Link href={`/shipments/${a.shipment.id}`} className="hover:underline">
                      {vehicleName(a.shipment.vehicle)} · {a.shipment.id}
                    </Link>{" "}
                    · {timeAgo(a.at)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Needs attention — prioritized above statistics (PRD §1.4). States: normal, warning, critical, empty. */
function NeedsAttention() {
  const { issues, missingTitles, paymentsDue } = useAttention();
  const overdue = paymentsDue.some((p) => p.status === "overdue");
  const dueTotal = paymentsDue.reduce((n, p) => n + p.amount, 0);

  const items = [
    issues.length > 0 && {
      tone: "critical" as const,
      icon: AlertTriangle,
      title: `${issues.length} shipment${issues.length > 1 ? "s" : ""} delayed`,
      detail: issues.map((s) => vehicleName(s.vehicle)).join(", "),
      href: "/shipments?group=issues",
      cta: "View shipments",
    },
    missingTitles.length > 0 && {
      tone: "warning" as const,
      icon: FileWarning,
      title: `${missingTitles.length} missing title${missingTitles.length > 1 ? "s" : ""}`,
      detail: "Titles are needed before vehicles can be loaded.",
      href: "/documents?status=required",
      cta: "Review documents",
    },
    paymentsDue.length > 0 && {
      tone: overdue ? ("critical" as const) : ("warning" as const),
      icon: CreditCard,
      title: `${paymentsDue.length} payments due`,
      detail: `${formatMoney(dueTotal)} total${overdue ? " · 1 overdue" : ""}`,
      href: "/payments",
      cta: "Review payments",
    },
  ].filter(Boolean) as { tone: "critical" | "warning"; icon: typeof AlertTriangle; title: string; detail: string; href: string; cta: string }[];

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Needs attention</h2>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm">
          <CheckCircle2 className="size-5 text-success" />
          You&apos;re all caught up.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((it) => (
            <Card key={it.title} size="sm" className={cn(it.tone === "critical" ? "ring-destructive/25" : "ring-warning/30")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <it.icon className={cn("size-4", it.tone === "critical" ? "text-destructive" : "text-warning")} />
                  {it.title}
                </CardTitle>
                <CardDescription className="line-clamp-1">{it.detail}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="h-auto p-0" asChild>
                  <Link href={it.href}>
                    {it.cta} <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
