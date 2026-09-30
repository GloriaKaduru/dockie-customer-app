import { AlertTriangle, CheckCircle2, Circle, CircleDot, Clock, Loader, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { documentStatus, paymentStatus, shipmentStatus, type Tone } from "@/lib/status";
import type { DocumentStatus, PaymentStatus, ShipmentStatus } from "@/lib/types";

// Tone → colour + icon. Status is always text + icon, never colour alone (PRD §2.3).
const toneClass: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  progress: "bg-info/10 text-info",
  info: "bg-info/10 text-info",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const toneIcon: Record<Tone, React.ComponentType<{ className?: string }>> = {
  neutral: Circle,
  progress: CircleDot,
  info: Clock,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

export function ToneBadge({ tone, children, className, icon }: { tone: Tone; children: React.ReactNode; className?: string; icon?: React.ComponentType<{ className?: string }> }) {
  const Icon = icon ?? toneIcon[tone];
  return (
    <Badge variant="secondary" className={cn("gap-1 font-medium", toneClass[tone], className)}>
      <Icon aria-hidden />
      {children}
    </Badge>
  );
}

/** Shipment status. Pass `at` to show when the status was set. */
export function StatusBadge({ status, at, className }: { status: ShipmentStatus; at?: string; className?: string }) {
  const { label, tone } = shipmentStatus[status];
  return (
    <ToneBadge tone={tone} className={className}>
      {label}
      {at && <span className="font-normal opacity-70">· {at}</span>}
    </ToneBadge>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { label, tone } = documentStatus[status];
  return (
    <ToneBadge tone={tone} icon={status === "processing" ? Loader : undefined}>
      {label}
    </ToneBadge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, tone } = paymentStatus[status];
  return <ToneBadge tone={tone}>{label}</ToneBadge>;
}
