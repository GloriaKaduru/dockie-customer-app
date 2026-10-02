"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  Hash,
  ImageIcon,
  LifeBuoy,
  Lock,
  MapPin,
  MapPinOff,
  MoreHorizontal,
  Pencil,
  Receipt,
  RefreshCw,
  Ship,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { StaleNotice } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext, useDockie } from "@/components/dockie/dockie-provider";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { Timeline } from "@/components/domain/timeline";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { dayLabel, formatDate, formatDateTime, formatMoney, hoursSince, timeAgo, vehicleName } from "@/lib/format";
import type { Capability } from "@/lib/permissions";
import { documentStatus, paymentStatus } from "@/lib/status";
import type { DocumentType, PhotoCategory, Shipment } from "@/lib/types";
import { city, countdown } from "./shipment-signals";
import { InfoRow, journeyProgress, Pill, RouteMap, RouteSteps, SegmentedProgress, StatusTag, Tag } from "./uber";

const TABS = ["overview", "tracking", "documents", "photos", "payments", "activity"] as const;
type Tab = (typeof TABS)[number];

/** Uber's trip headline: lead with when, not what ("Pickup in 3 min", "Dropoff at 7:44 PM"). */
function headline(s: Shipment) {
  const c = countdown(s);
  if (s.status === "delivered") return s.eta.date ? `Delivered ${formatDate(s.eta.date, { weekday: "short", month: "short", day: "numeric" })}` : "Delivered";
  if (s.status === "issue_reported") return "Issue on this shipment";
  if (s.status === "ready_for_collection") return "Ready for collection";
  if (c.kind === "number") return `Arriving in ${c.value} ${c.unit}`;
  if (c.label === "Today") return "Arriving today";
  if (c.label === "Due") return "Arrival overdue";
  return "Waiting for pickup";
}

export function ShipmentDetail({ id, initialTab }: { id: string; initialTab?: string }) {
  const { getShipment, documents, payments, can } = useWorkspace();
  const { setMode, ask } = useDockie();
  const s = getShipment(id)!;
  const [tab, setTab] = useState<Tab>(TABS.includes(initialTab as Tab) ? (initialTab as Tab) : "overview");
  const [upload, setUpload] = useState<{ open: boolean; type?: DocumentType }>({ open: false });
  const docs = documents.filter((d) => d.shipmentId === id);
  const pays = payments.filter((p) => p.shipmentId === id);
  const missingDocs = docs.filter((d) => d.required && (d.status === "required" || d.status === "rejected"));
  const label = `${vehicleName(s.vehicle)} · ${s.id}`;
  const { steps, current, done } = journeyProgress(s);
  const c = countdown(s);

  const changeTab = (t: string) => {
    setTab(t as Tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url);
  };

  // Permission-aware action menu (PRD §24). Unavailable actions stay visible with a reason (§19).
  const actions: { label: string; icon: typeof Pencil; cap?: Capability; onSelect: () => void }[] = [
    { label: "Edit shipment", icon: Pencil, cap: "shipments.edit", onSelect: () => ask("Change destination") },
    { label: "Upload document", icon: Upload, cap: "documents.upload", onSelect: () => setUpload({ open: true }) },
    { label: "Add photo", icon: Camera, cap: "documents.upload", onSelect: () => toast("Photo upload opens the camera on mobile.") },
    { label: "Update information", icon: RefreshCw, cap: "shipments.edit", onSelect: () => ask("Update pickup location") },
    { label: "View invoice", icon: Receipt, cap: "payments.view", onSelect: () => changeTab("payments") },
    { label: "Request support", icon: LifeBuoy, onSelect: () => toast.success("Support request sent", { description: "Operations will reply within an hour." }) },
  ];

  const eta = s.eta;
  const etaNote =
    eta.kind === "unknown" || !eta.date ? (
      "ETA available after pickup"
    ) : eta.kind === "delayed" ? (
      <span className="text-destructive">
        Delayed from <span className="line-through">{eta.previousDate && formatDate(eta.previousDate)}</span>
        {eta.updatedAt && ` · Updated ${timeAgo(eta.updatedAt)}`}
      </span>
    ) : eta.kind === "delivered" ? (
      "Delivered"
    ) : (
      <>Estimated{eta.updatedAt && ` · Updated ${timeAgo(eta.updatedAt)}`}</>
    );
  const stale = hoursSince(s.location.updatedAt) > 48;

  return (
    <div className="space-y-6">
      <SetDockieContext context={{ kind: "shipment", id: s.id, label }} />

      <Link href="/shipments" className="inline-flex items-center gap-2 label-s hover:underline hover:underline-offset-4">
        <ArrowLeft className="size-4" /> Back to shipments
      </Link>

      {/* Alerts */}
      {s.status === "issue_reported" && (
        <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/5">
          <AlertTriangle />
          <AlertTitle className="label-m">Issue reported · ETA moved to {s.eta.date && formatDate(s.eta.date)}</AlertTitle>
          <AlertDescription>{s.delayReason}</AlertDescription>
          <AlertAction>
            <Pill size="sm" onClick={() => ask("Why is it delayed?")}>
              <Sparkles /> Ask Dockie why
            </Pill>
          </AlertAction>
        </Alert>
      )}
      {!s.location.available && <StaleNotice updatedAt={s.location.updatedAt} what="Location" />}
      {s.locked && (
        <p className="flex items-center gap-2 paragraph-s text-muted-foreground">
          <Lock className="size-4" /> Operations has locked this shipment while they review the issue. Changes are paused.
        </p>
      )}

      {/* Trip view (PRD §3.1–3.3): Uber's reservation panel beside the map */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:gap-6">
        <section className="rounded-xl border p-5 sm:p-6" aria-label="Shipment summary">
          <h1 className="heading-m max-sm:heading-s">{headline(s)}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tag tone="strong">{vehicleName(s.vehicle)}</Tag>
            <StatusTag shipment={s} />
          </div>

          <SegmentedProgress shipment={s} className="mt-6" />
          <p className="mt-2 paragraph-xs text-muted-foreground">
            {done ? "All milestones complete" : `Step ${current + 1} of ${steps.length} · ${steps[current]}`}
          </p>

          <div className="mt-4">
            <InfoRow icon={<CalendarDays />} title={eta.date ? formatDate(eta.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "ETA not set yet"}>
              {etaNote}
            </InfoRow>
            <div className="border-b py-4">
              <RouteSteps from={{ title: city(s.origin), detail: s.vessel ? `${s.origin} · ${s.vessel.originPort}` : s.origin }} to={{ title: city(s.destination), detail: s.vessel ? `${s.destination} · ${s.vessel.destinationPort}` : s.destination }} />
            </div>
            <InfoRow icon={s.location.available ? <MapPin /> : <MapPinOff />} title={s.location.available ? s.location.label : "Location unavailable"}>
              {s.location.available ? (
                <span className={cn(stale && "text-warning")}>
                  {timeAgo(s.location.updatedAt)} · {s.location.source}
                  {stale && " · may be outdated"}
                </span>
              ) : (
                <>Last known: {s.location.label} · {formatDateTime(s.location.updatedAt)}</>
              )}
            </InfoRow>
            <InfoRow icon={<Hash />} title={`Booking #${s.id}`} action={<CopyButton value={s.vehicle.vin} />}>
              VIN <span className="font-mono text-foreground">{s.vehicle.vin}</span>
            </InfoRow>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setMode("open")} className="h-12 gap-2 rounded-lg text-base">
              <Sparkles /> Ask Dockie
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-12 gap-2 rounded-lg text-base">
                  Manage <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="uber w-60 rounded-xl p-2 shadow-lg">
                <DropdownMenuLabel>Shipment actions</DropdownMenuLabel>
                {actions.map((a) => {
                  const allowed = !a.cap || can(a.cap);
                  return (
                    <DropdownMenuItem key={a.label} disabled={!allowed} onSelect={a.onSelect} className="min-h-10 rounded-lg">
                      {allowed ? <a.icon /> : <Lock />}
                      <span className="flex-1">{a.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                {actions.some((a) => a.cap && !can(a.cap)) && (
                  <>
                    <DropdownMenuSeparator />
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Some actions need a different role. Contact your organization admin.</p>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        <div className="relative order-first h-64 overflow-hidden rounded-xl sm:h-80 xl:order-none xl:h-auto">
          <RouteMap
            shipment={s}
            variant="full"
            className="absolute inset-0"
            labels={{ from: `From ${city(s.origin)}`, to: `To ${city(s.destination)}`, badge: s.status !== "delivered" && c.kind === "number" ? `${c.value} ${c.unit}` : undefined }}
          />
          {s.location.available && s.status !== "delivered" && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-2 rounded-full bg-foreground px-3 py-1.5 label-xs text-background shadow-lg">
              <span className="size-2 rounded-full bg-live motion-safe:animate-pulse" aria-hidden />
              Live · {timeAgo(s.location.updatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Information tabs (PRD §3.5) */}
      <Tabs value={tab} onValueChange={changeTab} className="pt-4">
        <div className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="h-auto justify-start gap-6 p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="h-auto flex-none rounded-none px-0 pt-1 pb-3 label-m text-muted-foreground capitalize data-active:text-foreground group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-1"
              >
                {t}
                {t === "documents" && missingDocs.length > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-destructive text-[11px] text-white" aria-label={`${missingDocs.length} missing`}>
                    {missingDocs.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6">
          <Overview s={s} />
        </TabsContent>
        <TabsContent value="tracking" className="mt-6">
          <Tracking s={s} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <Documents docs={docs} canUpload={can("documents.upload")} onUpload={(type) => setUpload({ open: true, type })} />
        </TabsContent>
        <TabsContent value="photos" className="mt-6">
          <Photos s={s} />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          {can("payments.view") ? (
            <section className="max-w-2xl">
              {pays.length === 0 ? (
                <Quiet icon={<Receipt />} title="No invoices yet" text="Invoices appear after pickup." />
              ) : (
                <>
                  <div className="flex items-baseline justify-between border-b-2 border-foreground pb-3">
                    <h2 className="heading-xs">Total</h2>
                    <span className="heading-xs tabular-nums">{formatMoney(pays.reduce((n, p) => n + p.amount, 0))}</span>
                  </div>
                  <ul>
                    {pays.map((p) => (
                      <li key={p.id} className="border-b">
                        <Link href={`/payments?invoice=${p.id}`} className="flex items-center gap-4 py-4 hover:bg-muted/60 sm:-mx-2 sm:rounded-lg sm:px-2">
                          <Receipt className="size-5 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block label-m">{p.description}</span>
                            <span className="mt-1 block paragraph-s text-muted-foreground">
                              Invoice {p.id} · due {formatDate(p.dueAt)}
                            </span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <span className="label-m tabular-nums">{formatMoney(p.amount)}</span>
                            <Tag tone={paymentStatus[p.status].tone}>{paymentStatus[p.status].label}</Tag>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          ) : (
            <Quiet icon={<Lock />} title="Payments are restricted" text="You don't have permission to view payments. Contact your organization admin." />
          )}
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <ol className="max-w-2xl">
            {s.activity.map((a, i) => (
              <li key={i} className="flex gap-4 border-b py-4 last:border-b-0">
                <span className="w-24 shrink-0 label-s text-muted-foreground">{dayLabel(a.at)}</span>
                <span className="paragraph-s">
                  <span className="font-medium">{a.actor}</span> {a.text}
                  <span className="mt-1 block paragraph-xs text-muted-foreground">{formatDateTime(a.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>

      <UploadDialog key={upload.type ?? "any"} open={upload.open} onOpenChange={(o) => setUpload((u) => ({ ...u, open: o }))} shipmentId={s.id} defaultType={upload.type} />
    </div>
  );
}

/** Quiet inline empty state: icon, bold line, one sentence. */
function Quiet({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex max-w-2xl gap-4 rounded-xl bg-muted p-5 [&>svg]:size-5 [&>svg]:shrink-0">
      {icon}
      <div>
        <p className="label-m">{title}</p>
        <p className="mt-1 paragraph-s text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <Pill
      size="sm"
      aria-label="Copy VIN"
      className="self-center"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check /> : <Copy />}
      {done ? "Copied" : "Copy VIN"}
    </Pill>
  );
}

/** Uber receipt rows: label left in grey, value right, hairline between. */
function Dl({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl>
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b py-3 paragraph-s last:border-b-0">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="mb-2 heading-xs">{title}</h2>
      {children}
    </section>
  );
}

function Overview({ s }: { s: Shipment }) {
  const t = s.timing;
  const days = (n?: number) => (n === undefined ? "—" : `${n} day${n === 1 ? "" : "s"}`);
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="space-y-10">
        <Section title="Vehicle">
          <Dl
            rows={[
              ["VIN", <span key="v" className="font-mono text-xs">{s.vehicle.vin}</span>],
              ["Year", s.vehicle.year],
              ["Make", s.vehicle.make],
              ["Model", s.vehicle.model],
              ["Trim", s.vehicle.trim],
              ["Purchase date", formatDate(s.vehicle.purchaseDate, { month: "short", day: "numeric", year: "numeric" })],
            ]}
          />
        </Section>
        <Section title="Shipment">
          <Dl
            rows={[
              ["Booking #", s.id],
              ["Origin", s.origin],
              ["Destination", s.destination],
              ["Shipment type", s.type === "ocean" ? "Ocean (RoRo)" : "Inland"],
              ["Booked", formatDate(s.bookedAt, { month: "short", day: "numeric", year: "numeric" })],
            ]}
          />
        </Section>
        {/* Operational timing — visually secondary (PRD §3.6) */}
        <div className="rounded-xl bg-muted p-4">
          <p className="mb-1 label-xs text-muted-foreground">Operational timing</p>
          <Dl rows={[["Purchase → Pickup", days(t.purchaseToPickup)], ["Pickup → Booking", days(t.pickupToBooking)], ["Booking → Departure", days(t.bookingToDeparture)]]} />
        </div>
      </div>
      <Section title="Timeline" className="lg:col-span-2">
        <Timeline events={s.events} className="pt-2" />
      </Section>
    </div>
  );
}

/** Journey milestones as Uber's vertical route: filled dots done, ringed dot now, hollow dots ahead. */
function Milestones({ s }: { s: Shipment }) {
  const { steps, current, done } = journeyProgress(s);
  const problem = s.status === "issue_reported";
  return (
    <ol aria-label="Shipment journey">
      {steps.map((label, i) => {
        const complete = done || i < current;
        const now = !done && i === current;
        const last = i === steps.length - 1;
        return (
          <li key={label} className="relative flex gap-4 pb-5 last:pb-0" aria-current={now ? "step" : undefined}>
            {!last && <span className={cn("absolute top-4 bottom-0 left-[5px] w-0.5", complete ? "bg-foreground" : "bg-border")} aria-hidden />}
            <span
              className={cn(
                "relative mt-1 size-3 shrink-0",
                last ? "rounded-[2px]" : "rounded-full",
                complete && "bg-foreground",
                now && (problem ? "bg-destructive ring-4 ring-destructive/20" : "bg-live ring-4 ring-live/20"),
                !complete && !now && "border-2 border-border bg-background",
              )}
              aria-hidden
            />
            <span className={cn("paragraph-s", now ? "font-semibold" : complete ? "" : "text-muted-foreground")}>
              {label}
              {now && problem && <span className="block paragraph-xs text-destructive">Issue reported</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Tracking({ s }: { s: Shipment }) {
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="space-y-10">
        <Section title="Journey">
          <div className="pt-2">
            <Milestones s={s} />
          </div>
        </Section>
        {s.vessel ? (
          <Section title="Vessel">
            <Dl
              rows={[
                ["Vessel", <span key="v" className="inline-flex items-center gap-1.5"><Ship className="size-4" />{s.vessel.name}</span>],
                ["Voyage", s.vessel.voyage],
                ["Origin port", s.vessel.originPort],
                ["Destination port", s.vessel.destinationPort],
                ["Departure", formatDateTime(s.vessel.departure)],
                ["Expected arrival", formatDateTime(s.vessel.arrival)],
              ]}
            />
          </Section>
        ) : (
          s.type === "ocean" && <p className="paragraph-s text-muted-foreground">Vessel details appear once the vehicle is booked on a sailing.</p>
        )}
      </div>
      <Section title="Recent events" className="lg:col-span-2">
        <Timeline events={s.events} className="pt-2" />
      </Section>
    </div>
  );
}

function Documents({ docs, canUpload, onUpload }: { docs: ReturnType<typeof useWorkspace>["documents"]; canUpload: boolean; onUpload: (t?: DocumentType) => void }) {
  const groups = [
    { title: "Required", list: docs.filter((d) => d.required) },
    { title: "Other", list: docs.filter((d) => !d.required) },
  ];
  return (
    <div className="max-w-3xl space-y-10">
      {groups.map(
        (g, gi) =>
          g.list.length > 0 && (
            <section key={g.title}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <h2 className="heading-xs">{g.title}</h2>
                {gi === 0 && (
                  <Pill disabled={!canUpload} onClick={() => onUpload()}>
                    <Upload /> Upload
                  </Pill>
                )}
              </div>
              <ul>
                {g.list.map((d) => {
                  const needsFile = d.status === "required" || d.status === "rejected";
                  const st = documentStatus[d.status];
                  return (
                    <li key={d.id} className="flex items-center gap-4 border-b py-4 last:border-b-0">
                      <FileText className="size-5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="label-m">{d.type}</p>
                        <p className="mt-1 truncate paragraph-s text-muted-foreground">{d.note ?? (d.uploadedAt ? `${d.fileName} · ${formatDate(d.uploadedAt)} by ${d.uploadedBy}` : "Not uploaded yet")}</p>
                      </div>
                      <Tag tone={st.tone} className="max-sm:hidden">
                        {st.label}
                      </Tag>
                      {needsFile ? (
                        <Button disabled={!canUpload} onClick={() => onUpload(d.type)} className="h-9 rounded-lg px-4">
                          {d.status === "rejected" ? "Replace" : "Upload"}
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Pill className="w-9 justify-center px-0" aria-label={`${d.type} actions`}>
                              <MoreHorizontal />
                            </Pill>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="uber rounded-xl p-2 shadow-lg">
                            <DropdownMenuItem asChild className="rounded-lg">
                              <Link href={`/documents?doc=${d.id}`}>
                                <Eye /> Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg" onSelect={() => toast(`Downloading ${d.fileName}`)}>
                              <Download /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg" disabled={!canUpload} onSelect={() => onUpload(d.type)}>
                              <RefreshCw /> Replace
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-lg" variant="destructive" disabled={!canUpload || d.status === "verified"}>
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
      )}
    </div>
  );
}

const photoCats: ("All" | PhotoCategory)[] = ["All", "Vehicle", "Pickup", "Condition", "Arrival"];

function Photos({ s }: { s: Shipment }) {
  const [cat, setCat] = useState<(typeof photoCats)[number]>("All");
  const list = s.photos.filter((p) => cat === "All" || p.category === cat);
  if (s.photos.length === 0) return <Quiet icon={<ImageIcon />} title="No photos yet" text="The transporter adds photos at pickup. You can add your own anytime." />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Photo category">
        {photoCats.map((c) => (
          <Pill key={c} role="radio" aria-checked={cat === c} selected={cat === c} onClick={() => setCat(c)}>
            {c}
          </Pill>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="paragraph-s text-muted-foreground">No {cat.toLowerCase()} photos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <figure key={p.id}>
              {/* Placeholder until real images come from the API */}
              <div className="grid aspect-[4/3] place-items-center rounded-xl bg-muted text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
              <figcaption className="mt-2">
                <span className="block label-s">{p.caption}</span>
                <span className="mt-1 block paragraph-xs text-muted-foreground">
                  {p.category} · {formatDate(p.takenAt)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
