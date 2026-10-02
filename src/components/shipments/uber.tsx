import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { journey, shipmentStatus, type Tone } from "@/lib/status";
import type { Shipment } from "@/lib/types";

// Uber-style primitives for the Shipments module. They read the `.uber` tokens in globals.css.
// Patterns come from Uber web/iOS on Mobbin: grey pill chips with a leading icon, small square-cornered
// status tags, the dot → line → square route glyph, icon-led rows split by hairlines, and the map.

/* ---------- Pill: Uber's grey chip button ("Help", "Details", "Personal ▾") ---------- */

const pillClass = (selected?: boolean, size: "sm" | "md" = "md") =>
  cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap transition-colors outline-none select-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    size === "sm" ? "h-8 px-3 text-xs [&_svg]:size-3.5" : "h-9 px-3.5 text-sm [&_svg]:size-4",
    selected ? "bg-primary text-primary-foreground hover:bg-primary/85" : "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary),var(--foreground)_8%)]",
  );

export function Pill({ selected, size, className, ...props }: ComponentProps<"button"> & { selected?: boolean; size?: "sm" | "md" }) {
  return <button type="button" className={cn(pillClass(selected, size), className)} {...props} />;
}

export function PillLink({ selected, size, className, ...props }: ComponentProps<typeof Link> & { selected?: boolean; size?: "sm" | "md" }) {
  return <Link className={cn(pillClass(selected, size), className)} {...props} />;
}

/* ---------- Tag: small, square-cornered status label ("Uber Taxi reserved") ---------- */

const tagTone: Record<Tone | "strong", string> = {
  neutral: "bg-secondary text-secondary-foreground",
  progress: "bg-info/10 text-info",
  info: "bg-secondary text-secondary-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  critical: "bg-destructive/10 text-destructive",
  strong: "bg-foreground text-background",
};

export function Tag({ tone = "neutral", className, children }: { tone?: Tone | "strong"; className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex h-6 items-center rounded-[4px] px-2 label-xs whitespace-nowrap", tagTone[tone], className)}>{children}</span>;
}

/** Status in words, coloured only when the status carries meaning. */
export function StatusTag({ shipment, className }: { shipment: Shipment; className?: string }) {
  const { label, tone } = shipmentStatus[shipment.status];
  return (
    <Tag tone={tone} className={className}>
      {label}
    </Tag>
  );
}

/* ---------- RouteSteps: dot → line → square, with place and detail ---------- */

export function RouteSteps({ from, to, className }: { from: { title: ReactNode; detail?: ReactNode }; to: { title: ReactNode; detail?: ReactNode }; className?: string }) {
  return (
    <ol className={cn("relative", className)} aria-label="Route">
      {[from, to].map((p, i) => (
        <li key={i} className={cn("relative flex gap-4", i === 0 && "pb-5")}>
          {/* connector: from the origin dot down to the destination square */}
          {i === 0 && <span className="absolute top-2.5 -bottom-1 left-[5px] w-0.5 bg-foreground" aria-hidden />}
          <span className={cn("relative mt-1 size-3 shrink-0 bg-foreground", i === 0 ? "rounded-full" : "rounded-[2px]")} aria-hidden />
          <span className="min-w-0">
            <span className="sr-only">{i === 0 ? "From: " : "To: "}</span>
            <span className="block label-m">{p.title}</span>
            {p.detail && <span className="mt-1 block paragraph-s text-muted-foreground">{p.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ---------- InfoRow: icon-led row with a hairline under it (Uber trip receipt rows) ---------- */

export function InfoRow({ icon, title, children, action, className }: { icon: ReactNode; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex gap-4 border-b py-4 last:border-b-0 [&>svg]:mt-0.5 [&>svg]:size-5 [&>svg]:shrink-0", className)}>
      {icon}
      <div className="min-w-0 flex-1">
        <div className="label-m">{title}</div>
        {children && <div className="mt-1 paragraph-s text-muted-foreground">{children}</div>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Segmented progress: Uber's delivery tracker bar ---------- */

export function journeyProgress(s: Shipment) {
  const { steps, current, done } = journey(s.type, s.status);
  return { steps, current, done, ratio: done ? 1 : (current + 0.5) / steps.length };
}

export function SegmentedProgress({ shipment, className }: { shipment: Shipment; className?: string }) {
  const { steps, current, done } = journeyProgress(shipment);
  const problem = shipment.status === "issue_reported";
  return (
    <div className={cn("flex gap-1", className)} role="progressbar" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={done ? steps.length : current + 1} aria-valuetext={done ? "Delivered" : steps[current]}>
      {steps.map((label, i) => {
        const complete = done || i < current;
        const now = !done && i === current;
        return (
          <span key={label} title={label} className="relative h-1 flex-1 overflow-hidden rounded-full bg-border">
            {complete && <span className="absolute inset-0 bg-foreground" />}
            {now && <span className={cn("absolute inset-y-0 left-0 w-1/2 motion-safe:animate-pulse", problem ? "bg-destructive" : "bg-foreground")} />}
          </span>
        );
      })}
    </div>
  );
}

/* ---------- RouteMap: a stylised map with the route, like Uber's trip map ---------- */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const bezier = (t: number, a: number, c: number, b: number) => (1 - t) ** 2 * a + 2 * (1 - t) * t * c + t ** 2 * b;

/**
 * Decorative, deterministic map for a shipment: street grid, water for ocean legs, the route in black,
 * a dot at the origin, a square at the destination, and a blue "live" marker where the vehicle is.
 */
export function RouteMap({ shipment, ...props }: { shipment: Shipment; variant?: "thumb" | "full"; className?: string; labels?: { from: string; to: string; badge?: string } }) {
  return <MapArt seed={shipment.id} ocean={shipment.type === "ocean"} progress={shipment.status === "delivered" ? null : journeyProgress(shipment).ratio} {...props} />;
}

/** The map drawing itself. `progress` places the live marker along the route (null hides it). */
export function MapArt({
  seed,
  ocean,
  progress,
  variant = "thumb",
  className,
  labels,
}: {
  seed: string;
  ocean?: boolean;
  progress: number | null;
  variant?: "thumb" | "full";
  className?: string;
  labels?: { from: string; to: string; badge?: string };
}) {
  const rand = hash(seed);
  const W = variant === "full" ? 800 : 320;
  const H = variant === "full" ? 480 : 200;
  // The SVG fills its box with `slice`, so wide boxes crop top/bottom and tall ones crop the sides.
  // Endpoints (and their labels) stay inside a centre safe zone that survives aspects from ~0.9:1 to 2.5:1.
  const ax = W * (0.28 + rand() * 0.05);
  const ay = H * (0.6 + rand() * 0.08);
  const bx = W * (0.7 + rand() * 0.04);
  const by = H * (0.24 + rand() * 0.08);
  const cx = W * (0.35 + rand() * 0.3);
  const cy = H * (rand() > 0.5 ? 0.05 : 0.95);
  const px = bezier(progress ?? 0, ax, cx, bx);
  const py = bezier(progress ?? 0, ay, cy, by);
  const route = `M${ax},${ay} Q${cx},${cy} ${bx},${by}`;
  const step = variant === "full" ? 64 : 40;
  const blocks: { x: number; y: number; w: number; h: number }[] = [];
  for (let x = -10; x < W; x += step) for (let y = -10; y < H; y += step) if (rand() > 0.35) blocks.push({ x: x + 6, y: y + 6, w: step - 12, h: step - 12 });
  const stroke = variant === "full" ? 5 : 3.5;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={cn("block size-full bg-[var(--uber-map)]", className)} aria-hidden>
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} rx={3} fill="var(--uber-map-block)" />
      ))}
      {ocean && <path d={`M${W * 0.3},${H} C${W * 0.4},${H * 0.55} ${W * 0.62},${H * 0.75} ${W * 0.7},${H * 0.3} L${W * 0.82},${-10} L${W * 1.1},${-10} L${W * 1.1},${H} Z`} fill="var(--uber-map-water)" />}
      <path d={route} fill="none" stroke="var(--uber-map-street)" strokeWidth={stroke + 6} strokeLinecap="round" />
      <path d={route} fill="none" stroke="var(--foreground)" strokeWidth={stroke} strokeLinecap="round" />
      <circle cx={ax} cy={ay} r={stroke + 3} fill="var(--foreground)" stroke="var(--background)" strokeWidth={2} />
      <rect x={bx - (stroke + 3)} y={by - (stroke + 3)} width={(stroke + 3) * 2} height={(stroke + 3) * 2} fill="var(--foreground)" stroke="var(--background)" strokeWidth={2} />
      {progress !== null && (
        <g>
          <circle cx={px} cy={py} r={variant === "full" ? 22 : 13} fill="var(--uber-live)" opacity={0.18} />
          <circle cx={px} cy={py} r={variant === "full" ? 9 : 6} fill="var(--uber-live)" stroke="#fff" strokeWidth={variant === "full" ? 3 : 2} />
        </g>
      )}
      {variant === "full" && labels && (
        <>
          <MapLabel x={ax} y={ay + 22} text={labels.from} anchor="start" />
          <MapLabel x={bx} y={by + 22} text={labels.to} anchor="end" badge={labels.badge} />
        </>
      )}
    </svg>
  );
}

function MapLabel({ x, y, text, anchor, badge }: { x: number; y: number; text: string; anchor: "start" | "end"; badge?: string }) {
  const w = text.length * 8.4 + 28;
  const bw = badge ? badge.length * 8 + 20 : 0;
  const total = w + bw;
  const left = anchor === "start" ? Math.max(8, x - 20) : Math.min(800 - 8 - total, x - total + 20);
  return (
    <g style={{ fontFamily: "var(--font-text)" }}>
      {badge && (
        <>
          <rect x={left} y={y} width={bw} height={34} fill="var(--foreground)" />
          <text x={left + bw / 2} y={y + 22} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--background)">
            {badge}
          </text>
        </>
      )}
      <rect x={left + bw} y={y} width={w} height={34} fill="var(--background)" filter="drop-shadow(0 1px 3px rgb(0 0 0 / 0.2))" />
      <text x={left + bw + 14} y={y + 22} fontSize={14} fontWeight={500} fill="var(--foreground)">
        {text}
      </text>
    </g>
  );
}
