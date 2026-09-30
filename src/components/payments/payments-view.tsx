"use client";

import { CreditCard, FileText, Lock, Receipt } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState, Restricted } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext } from "@/components/dockie/dockie-provider";
import { PaymentStatusBadge } from "@/components/domain/status-badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney, vehicleName } from "@/lib/format";
import type { Payment } from "@/lib/types";

/** Financial visibility without becoming a banking app (PRD §8). */
export function PaymentsView({ openInvoice }: { openInvoice?: string }) {
  const { payments, getShipment, can, markPaid } = useWorkspace();
  const router = useRouter();
  const [confirming, setConfirming] = useState<Payment | null>(null);
  const [paying, setPaying] = useState(false);
  const selected = payments.find((p) => p.id === openInvoice);

  if (!can("payments.view")) {
    return (
      <>
        <SetDockieContext context={{ kind: "payments" }} />
        <EmptyState icon={Lock} title="Payments are restricted" description="You don't have permission to view payments. Contact your organization admin." className="min-h-[50vh]" />
      </>
    );
  }

  const sum = (f: (p: Payment) => boolean) => payments.filter(f).reduce((n, p) => n + p.amount, 0);
  const overdue = payments.filter((p) => p.status === "overdue");
  const summary = [
    { label: "Outstanding", value: sum((p) => p.status === "outstanding" || p.status === "overdue"), note: overdue.length ? `${formatMoney(sum((p) => p.status === "overdue"))} overdue` : "Nothing overdue", warn: overdue.length > 0 },
    { label: "Pending", value: sum((p) => p.status === "pending"), note: "Awaiting confirmation" },
    { label: "Paid", value: sum((p) => p.status === "paid"), note: "Last 90 days" },
  ];
  const open = (id?: string) => router.replace(id ? `/payments?invoice=${id}` : "/payments", { scroll: false });
  const sorted = [...payments].sort((a, b) => Number(a.status === "paid") - Number(b.status === "paid") || +new Date(a.dueAt) - +new Date(b.dueAt));

  function pay() {
    if (!confirming) return;
    setPaying(true);
    setTimeout(() => {
      markPaid(confirming.id);
      toast.success(`Invoice ${confirming.id} paid`, { description: `${formatMoney(confirming.amount)} charged to Visa •••• 4242.` });
      setPaying(false);
      setConfirming(null);
    }, 1200);
  }

  return (
    <>
      <SetDockieContext context={{ kind: "payments" }} />
      <PageHeader title="Payments" description="Invoices for your shipments." />

      <div className="grid gap-3 sm:grid-cols-3">
        {summary.map((s) => (
          <Card key={s.label} size="sm">
            <CardHeader>
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums">{formatMoney(s.value)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn("text-xs text-muted-foreground", s.warn && "text-destructive")}>{s.note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 py-0">
        {payments.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" description="Invoices appear here after a vehicle is picked up." />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Invoice</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead className="pr-4">Date paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => {
                  const s = getShipment(p.shipmentId);
                  return (
                    <TableRow key={p.id} className="cursor-pointer" onClick={() => open(p.id)}>
                      <TableCell className="pl-4 font-medium">{p.id}</TableCell>
                      <TableCell>
                        {p.shipmentId}
                        {s && <span className="block text-xs text-muted-foreground">{vehicleName(s.vehicle)}</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatMoney(p.amount)}</TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={p.status} />
                      </TableCell>
                      <TableCell className={cn(p.status === "overdue" && "font-medium text-destructive")}>{formatDate(p.dueAt)}</TableCell>
                      <TableCell className="pr-4 text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Payment detail (PRD §8.3) */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && open()}>
        <SheetContent className="w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Invoice {selected.id}</SheetTitle>
                <SheetDescription>{selected.description}</SheetDescription>
              </SheetHeader>
              <dl className="divide-y px-4 text-sm">
                <Row k="Shipment">
                  <Link href={`/shipments/${selected.shipmentId}?tab=payments`} className="hover:underline">
                    {selected.shipmentId}
                  </Link>
                </Row>
                <Row k="Amount">
                  <span className="text-lg font-semibold tabular-nums">{formatMoney(selected.amount)}</span>
                </Row>
                <Row k="Status">
                  <PaymentStatusBadge status={selected.status} />
                </Row>
                <Row k="Due">{formatDate(selected.dueAt, { month: "short", day: "numeric", year: "numeric" })}</Row>
                {selected.paidAt && <Row k="Paid">{formatDate(selected.paidAt, { month: "short", day: "numeric", year: "numeric" })}</Row>}
              </dl>
              <SheetFooter className="flex-row">
                <Button variant="outline" className="flex-1" onClick={() => toast("Opening invoice PDF…")}>
                  <FileText /> View invoice
                </Button>
                {selected.status !== "paid" && selected.status !== "pending" && (
                  <Restricted allowed={can("payments.pay")} reason="Only Finance and Admin roles can make payments.">
                    <Button className="flex-1" onClick={() => setConfirming(selected)}>
                      <CreditCard /> Pay {formatMoney(selected.amount)}
                    </Button>
                  </Restricted>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Explicit confirmation for money movement (PRD §8.3, §25) */}
      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && !paying && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pay invoice {confirming?.id}?</AlertDialogTitle>
            <AlertDialogDescription>Review the payment before confirming.</AlertDialogDescription>
          </AlertDialogHeader>
          {confirming && (
            <dl className="divide-y rounded-lg border px-3 text-sm">
              <Row k="Shipment">{confirming.shipmentId}</Row>
              <Row k="For">{confirming.description}</Row>
              <Row k="Amount">
                <span className="font-semibold">{formatMoney(confirming.amount)}</span>
              </Row>
              <Row k="Pay with">Visa •••• 4242</Row>
            </dl>
          )}
          <p className="text-sm text-muted-foreground">Your card is charged immediately. Receipts are emailed to finance@lagosautoimports.com.</p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={paying}>Cancel</AlertDialogCancel>
            <Button onClick={pay} disabled={paying}>
              {paying && <Spinner />}
              {paying ? "Processing…" : `Confirm payment`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
