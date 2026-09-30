import { cn } from "@/lib/utils";
import { formatDate, timeAgo } from "@/lib/format";
import type { Eta } from "@/lib/types";

/** ETA in all four states the PRD requires: estimated, unknown, delayed, delivered (§15). */
export function ETADisplay({ eta, size = "sm", className }: { eta: Eta; size?: "sm" | "lg"; className?: string }) {
  const big = size === "lg";
  if (eta.kind === "unknown" || !eta.date) {
    return (
      <div className={className}>
        <p className={cn("font-medium text-muted-foreground", big && "text-2xl")}>—</p>
        {big && <p className="text-xs text-muted-foreground">ETA available after pickup</p>}
      </div>
    );
  }
  return (
    <div className={className}>
      <p className={cn("font-medium tabular-nums", big && "text-2xl font-semibold tracking-tight", eta.kind === "delayed" && "text-destructive")}>
        {formatDate(eta.date, big ? { weekday: "short", month: "short", day: "numeric" } : undefined)}
      </p>
      {big && (
        <p className="text-xs text-muted-foreground">
          {eta.kind === "delivered" && "Delivered"}
          {eta.kind === "estimated" && <>Estimated{eta.updatedAt && ` · Updated ${timeAgo(eta.updatedAt)}`}</>}
          {eta.kind === "delayed" && (
            <>
              Delayed from <span className="line-through">{eta.previousDate && formatDate(eta.previousDate)}</span>
              {eta.updatedAt && ` · Updated ${timeAgo(eta.updatedAt)}`}
            </>
          )}
        </p>
      )}
      {!big && eta.kind === "delayed" && <p className="text-xs text-destructive">Delayed</p>}
    </div>
  );
}
