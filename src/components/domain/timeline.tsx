import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { dayLabel, formatTime } from "@/lib/format";
import type { TimelineEvent as TEvent } from "@/lib/types";

/** One event: title, time, location, source and metadata (§15 TimelineEvent). */
export function TimelineEvent({ event, first, last }: { event: TEvent; first?: boolean; last?: boolean }) {
  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && <span className="absolute top-3 left-[5px] h-full w-px bg-border" aria-hidden />}
      <span className={cn("relative mt-1.5 size-[11px] shrink-0 rounded-full border-2", first ? "border-primary bg-primary" : "border-border bg-background")} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-sm font-medium">{event.title}</p>
          <time className="text-xs text-muted-foreground tabular-nums">{formatTime(event.at)}</time>
        </div>
        {event.location && <p className="text-sm text-muted-foreground">{event.location}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {event.source && (
            <Badge variant="outline" className="h-5 font-normal text-muted-foreground">
              {event.source === "Dockie" && <Sparkles />}
              {event.source}
            </Badge>
          )}
          {event.metadata && <span>{event.metadata}</span>}
        </div>
      </div>
    </li>
  );
}

/** Chronological activity grouped by day: "Today", "Yesterday", "Sep 27" (§3.4). */
export function Timeline({ events, className }: { events: TEvent[]; className?: string }) {
  const sorted = [...events].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const groups = new Map<string, TEvent[]>();
  for (const e of sorted) {
    const key = dayLabel(e.at);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  let index = 0;
  return (
    <div className={cn("space-y-5", className)}>
      {[...groups].map(([day, list]) => (
        <section key={day}>
          <h4 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{day}</h4>
          <ol>
            {list.map((e, i) => {
              const isFirst = index++ === 0;
              return <TimelineEvent key={e.id} event={e} first={isFirst} last={i === list.length - 1} />;
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
