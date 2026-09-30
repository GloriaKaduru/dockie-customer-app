import type { InvoiceStatus, ShipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "ok" | "warn" | "bad" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-muted",
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

const shipmentStatus: Record<ShipmentStatus, { label: string; tone: Tone }> = {
  booked: { label: "Booked", tone: "neutral" },
  picked_up: { label: "Picked up", tone: "info" },
  in_transit: { label: "In transit", tone: "brand" },
  customs: { label: "In customs", tone: "warn" },
  out_for_delivery: { label: "Out for delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "ok" },
  delayed: { label: "Delayed", tone: "bad" },
};

export function shipmentStatusLabel(status: ShipmentStatus) {
  return shipmentStatus[status].label;
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const { label, tone } = shipmentStatus[status];
  return (
    <Badge tone={tone}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </Badge>
  );
}

const invoiceStatus: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "ok" },
  due: { label: "Due", tone: "warn" },
  overdue: { label: "Overdue", tone: "bad" },
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, tone } = invoiceStatus[status];
  return <Badge tone={tone}>{label}</Badge>;
}
