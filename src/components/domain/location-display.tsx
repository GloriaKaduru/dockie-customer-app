import { MapPin, MapPinOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime, hoursSince, timeAgo } from "@/lib/format";
import type { KnownLocation } from "@/lib/types";

/** Location + timestamp + source (§15). Handles "location unavailable" (§3.7) and stale data. */
export function LocationDisplay({ location, size = "sm", className }: { location: KnownLocation; size?: "sm" | "lg"; className?: string }) {
  const big = size === "lg";
  const stale = hoursSince(location.updatedAt) > 48;

  if (!location.available) {
    return (
      <div className={className}>
        <p className={cn("flex items-center gap-1.5 font-medium text-muted-foreground", big && "text-base")}>
          <MapPinOff className="size-4" /> Location unavailable
        </p>
        <p className="text-xs text-muted-foreground">
          Last known: <span className="text-foreground">{location.label}</span> · {formatDateTime(location.updatedAt)}
        </p>
      </div>
    );
  }
  return (
    <div className={className}>
      <p className={cn("font-medium", big && "text-2xl font-semibold tracking-tight")}>
        {!big && <MapPin className="mr-1 inline size-3.5 -translate-y-px text-muted-foreground" />}
        {location.label}
      </p>
      <p className={cn("text-xs text-muted-foreground", stale && "text-warning")}>
        {timeAgo(location.updatedAt)} · {location.source}
        {stale && " · may be outdated"}
      </p>
    </div>
  );
}
