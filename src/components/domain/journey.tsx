import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { journey } from "@/lib/status";
import type { ShipmentStatus, ShipmentType } from "@/lib/types";

/**
 * Shipment journey (§3.3): horizontal on desktop, vertical on mobile.
 * Inland shipments hide ocean-specific milestones.
 */
export function Journey({ type, status, className }: { type: ShipmentType; status: ShipmentStatus; className?: string }) {
  const { steps, current, done } = journey(type, status);
  const problem = status === "issue_reported";

  return (
    <ol className={cn("flex flex-col gap-0 md:flex-row", className)} aria-label="Shipment journey">
      {steps.map((label, i) => {
        const complete = done || i < current;
        const isCurrent = !done && i === current;
        return (
          <li key={label} className="relative flex flex-1 items-start gap-3 pb-4 md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center" aria-current={isCurrent ? "step" : undefined}>
            {/* connector */}
            {i > 0 && <span className={cn("absolute hidden h-0.5 md:block md:top-3 md:right-1/2 md:w-full", i <= current || done ? "bg-primary" : "bg-border")} aria-hidden />}
            {i < steps.length - 1 && <span className={cn("absolute top-6 left-3 h-full w-0.5 md:hidden", complete ? "bg-primary" : "bg-border")} aria-hidden />}
            <span
              className={cn(
                "relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 bg-background",
                complete && "border-primary bg-primary text-primary-foreground",
                isCurrent && (problem ? "border-destructive text-destructive ring-4 ring-destructive/15" : "border-primary ring-4 ring-primary/10"),
                !complete && !isCurrent && "border-border",
              )}
            >
              {complete ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : isCurrent ? (
                problem ? <AlertTriangle className="size-3" /> : <span className="size-2 rounded-full bg-primary" />
              ) : null}
            </span>
            <span className={cn("pt-0.5 text-sm leading-tight md:px-1 md:pt-0 md:text-xs", isCurrent ? "font-medium" : complete ? "" : "text-muted-foreground")}>
              {label}
              {isCurrent && problem && <span className="block text-xs font-normal text-destructive">Issue reported</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
