import { cn } from "@/lib/utils";

/** Dockie brand mark: a vehicle on a dock line. */
export function DockieMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground", className)}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 17h18" />
        <path d="M5 14l2-4h8l3 4" />
        <circle cx="8" cy="14.5" r="0.5" />
        <circle cx="16" cy="14.5" r="0.5" />
      </svg>
    </span>
  );
}

export function DockieLogo() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <DockieMark className="size-7" />
      Dockie
    </span>
  );
}
