// Formatting helpers. Everything is relative to NOW so the prototype always reads the same.
export const NOW = new Date("2026-09-30T14:00:00Z");

const tz = "UTC";

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return formatDate(iso, { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(iso: string) {
  return formatDate(iso, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "4h ago", "2d ago", "just now" */
export function timeAgo(iso: string) {
  const mins = Math.round((NOW.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/** Hours since an ISO date — used to flag stale data. */
export function hoursSince(iso: string) {
  return (NOW.getTime() - new Date(iso).getTime()) / 3_600_000;
}

/** "Today", "Yesterday" or "Sep 27" — for grouping timelines by day. */
export function dayLabel(iso: string) {
  const d = new Date(iso);
  const day = (x: Date) => Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate());
  const diff = Math.round((day(NOW) - day(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  return formatDate(iso);
}

export function vehicleName(v: { year: number; make: string; model: string }) {
  return `${v.year} ${v.make} ${v.model}`;
}

export function shortVin(vin: string) {
  return `…${vin.slice(-6)}`;
}
