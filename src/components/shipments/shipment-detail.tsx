"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  Copy,
  Download,
  Eye,
  FileText,
  ImageIcon,
  LifeBuoy,
  Lock,
  MoreHorizontal,
  Pencil,
  Receipt,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, StaleNotice } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext, useDockie } from "@/components/dockie/dockie-provider";
import { UploadDialog } from "@/components/documents/upload-dialog";
import { ETADisplay } from "@/components/domain/eta-display";
import { Journey } from "@/components/domain/journey";
import { LocationDisplay } from "@/components/domain/location-display";
import { DocumentStatusBadge, PaymentStatusBadge, StatusBadge } from "@/components/domain/status-badge";
import { Timeline } from "@/components/domain/timeline";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { dayLabel, formatDate, formatDateTime, formatMoney, hoursSince, timeAgo, vehicleName } from "@/lib/format";
import type { Capability } from "@/lib/permissions";
import type { DocumentType, PhotoCategory, Shipment } from "@/lib/types";

const TABS = ["overview", "tracking", "documents", "photos", "payments", "activity"] as const;
type Tab = (typeof TABS)[number];

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

  return (
    <div className="space-y-6">
      <SetDockieContext context={{ kind: "shipment", id: s.id, label }} />

      {/* Header (PRD §3.1) */}
      <div className="space-y-3">
        <Link href="/shipments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Shipments
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{vehicleName(s.vehicle)}</h1>
              <StatusBadge status={s.status} />
            </div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                Booking <span className="text-foreground">#{s.id}</span>
              </span>
              <span className="flex items-center gap-1">
                VIN <span className="font-mono text-foreground">{s.vehicle.vin}</span>
                <CopyButton value={s.vehicle.vin} />
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMode("open")}>
              <Sparkles /> Ask Dockie
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  Actions <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Shipment actions</DropdownMenuLabel>
                {actions.map((a) => {
                  const allowed = !a.cap || can(a.cap);
                  return (
                    <DropdownMenuItem key={a.label} disabled={!allowed} onSelect={a.onSelect}>
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
        </div>
      </div>

      {/* Alerts */}
      {s.status === "issue_reported" && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Issue reported · ETA moved to {s.eta.date && formatDate(s.eta.date)}</AlertTitle>
          <AlertDescription>{s.delayReason}</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => ask("Why is it delayed?")}>
              <Sparkles /> Ask Dockie why
            </Button>
          </AlertAction>
        </Alert>
      )}
      {!s.location.available && <StaleNotice updatedAt={s.location.updatedAt} what="Location" />}
      {s.locked && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" /> Operations has locked this shipment while they review the issue. Changes are paused.
        </p>
      )}

      {/* Summary — understand state without scrolling (PRD §3.2) */}
      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Current location">
            <LocationDisplay location={s.location} size="lg" />
          </Fact>
          <Fact label="ETA">
            <ETADisplay eta={s.eta} size="lg" />
          </Fact>
          <Fact label="Origin">
            <p className="text-2xl font-semibold tracking-tight">{s.origin.split(",")[0]}</p>
            <p className="text-xs text-muted-foreground">{s.origin}</p>
          </Fact>
          <Fact label="Destination">
            <p className="text-2xl font-semibold tracking-tight">{s.destination.split(",")[0]}</p>
            <p className="text-xs text-muted-foreground">{s.destination}</p>
          </Fact>
        </CardContent>
        <Separator />
        <CardContent className="pt-2">
          <Journey type={s.type} status={s.status} />
        </CardContent>
      </Card>

      {/* Information tabs (PRD §3.5) */}
      <Tabs value={tab} onValueChange={changeTab}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {missingDocs.length > 0 && <span className="grid size-4 place-items-center rounded-full bg-destructive text-[10px] text-white">{missingDocs.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4">
          <Overview s={s} />
        </TabsContent>
        <TabsContent value="tracking" className="mt-4">
          <Tracking s={s} />
        </TabsContent>
        <TabsContent value="documents" className="mt-4">
          <Documents docs={docs} canUpload={can("documents.upload")} onUpload={(type) => setUpload({ open: true, type })} />
        </TabsContent>
        <TabsContent value="photos" className="mt-4">
          <Photos s={s} />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          {can("payments.view") ? (
            <ItemGroup className="max-w-2xl gap-2">
              {pays.length === 0 && <EmptyState icon={Receipt} title="No invoices yet" description="Invoices appear after pickup." />}
              {pays.map((p) => (
                <Item key={p.id} variant="outline" asChild>
                  <Link href={`/payments?invoice=${p.id}`}>
                    <ItemMedia variant="icon">
                      <Receipt />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>Invoice {p.id}</ItemTitle>
                      <ItemDescription>
                        {p.description} · due {formatDate(p.dueAt)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <span className="font-medium tabular-nums">{formatMoney(p.amount)}</span>
                      <PaymentStatusBadge status={p.status} />
                    </ItemActions>
                  </Link>
                </Item>
              ))}
            </ItemGroup>
          ) : (
            <EmptyState icon={Lock} title="Payments are restricted" description="You don't have permission to view payments. Contact your organization admin." />
          )}
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card className="max-w-2xl">
            <CardContent>
              <ol className="space-y-4">
                {s.activity.map((a, i) => (
                  <li key={i} className="flex gap-4 text-sm">
                    <span className="w-20 shrink-0 text-muted-foreground">{dayLabel(a.at)}</span>
                    <span>
                      <span className="font-medium">{a.actor}</span> {a.text}
                      <span className="block text-xs text-muted-foreground">{formatDateTime(a.at)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UploadDialog key={upload.type ?? "any"} open={upload.open} onOpenChange={(o) => setUpload((u) => ({ ...u, open: o }))} shipmentId={s.id} defaultType={upload.type} />
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      {children}
    </div>
  );
}

function CopyButton({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label="Copy VIN"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check /> : <Copy />}
    </Button>
  );
}

function Dl({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 py-2">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-right font-medium">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Overview({ s }: { s: Shipment }) {
  const t = s.timing;
  const days = (n?: number) => (n === undefined ? "—" : `${n} day${n === 1 ? "" : "s"}`);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-1">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Vehicle</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Shipment</CardTitle>
          </CardHeader>
          <CardContent>
            <Dl
              rows={[
                ["Booking #", s.id],
                ["Origin", s.origin],
                ["Destination", s.destination],
                ["Shipment type", s.type === "ocean" ? "Ocean (RoRo)" : "Inland"],
                ["Booked", formatDate(s.bookedAt, { month: "short", day: "numeric", year: "numeric" })],
              ]}
            />
          </CardContent>
        </Card>
        {/* Operational timing — visually secondary (PRD §3.6) */}
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Operational timing</p>
          <Dl rows={[["Purchase → Pickup", days(t.purchaseToPickup)], ["Pickup → Booking", days(t.pickupToBooking)], ["Booking → Departure", days(t.bookingToDeparture)]]} />
        </div>
      </div>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={s.events} />
        </CardContent>
      </Card>
    </div>
  );
}

function Tracking({ s }: { s: Shipment }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6">
        <Card size="sm">
          <CardContent className="space-y-4">
            <Fact label="Current location">
              <LocationDisplay location={s.location} />
            </Fact>
            <Fact label="Last updated">
              <p className="text-sm font-medium">{formatDateTime(s.location.updatedAt)}</p>
              <p className={cn("text-xs text-muted-foreground", hoursSince(s.location.updatedAt) > 48 && "text-warning")}>{timeAgo(s.location.updatedAt)}</p>
            </Fact>
            <Fact label="ETA">
              <ETADisplay eta={s.eta} size="lg" />
            </Fact>
          </CardContent>
        </Card>
        {s.vessel ? (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Vessel</CardTitle>
            </CardHeader>
            <CardContent>
              <Dl
                rows={[
                  ["Vessel", s.vessel.name],
                  ["Voyage", s.vessel.voyage],
                  ["Origin port", s.vessel.originPort],
                  ["Destination port", s.vessel.destinationPort],
                  ["Departure", formatDateTime(s.vessel.departure)],
                  ["Expected arrival", formatDateTime(s.vessel.arrival)],
                ]}
              />
            </CardContent>
          </Card>
        ) : (
          s.type === "ocean" && <p className="text-sm text-muted-foreground">Vessel details appear once the vehicle is booked on a sailing.</p>
        )}
      </div>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          <Timeline events={s.events} />
        </CardContent>
      </Card>
    </div>
  );
}

function Documents({ docs, canUpload, onUpload }: { docs: ReturnType<typeof useWorkspace>["documents"]; canUpload: boolean; onUpload: (t?: DocumentType) => void }) {
  const groups = [
    { title: "Required", list: docs.filter((d) => d.required) },
    { title: "Other", list: docs.filter((d) => !d.required) },
  ];
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" disabled={!canUpload} onClick={() => onUpload()}>
          <Upload /> Upload
        </Button>
      </div>
      {groups.map(
        (g) =>
          g.list.length > 0 && (
            <section key={g.title}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">{g.title}</h3>
              <ItemGroup className="gap-2">
                {g.list.map((d) => {
                  const needsFile = d.status === "required" || d.status === "rejected";
                  return (
                    <Item key={d.id} variant="outline">
                      <ItemMedia variant="icon">
                        <FileText />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{d.type}</ItemTitle>
                        <ItemDescription>{d.note ?? (d.uploadedAt ? `${d.fileName} · ${formatDate(d.uploadedAt)} by ${d.uploadedBy}` : "Not uploaded yet")}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <DocumentStatusBadge status={d.status} />
                        {needsFile ? (
                          <Button size="sm" disabled={!canUpload} onClick={() => onUpload(d.type)}>
                            {d.status === "rejected" ? "Replace" : "Upload"}
                          </Button>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-sm" aria-label={`${d.type} actions`}>
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/documents?doc=${d.id}`}>
                                  <Eye /> Preview
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => toast(`Downloading ${d.fileName}`)}>
                                <Download /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={!canUpload} onSelect={() => onUpload(d.type)}>
                                <RefreshCw /> Replace
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" disabled={!canUpload || d.status === "verified"}>
                                <Trash2 /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </ItemActions>
                    </Item>
                  );
                })}
              </ItemGroup>
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
  if (s.photos.length === 0) return <EmptyState icon={ImageIcon} title="No photos yet" description="The transporter adds photos at pickup. You can add your own anytime." />;
  return (
    <div className="space-y-4">
      <ToggleGroup type="single" value={cat} onValueChange={(v) => v && setCat(v as typeof cat)} variant="outline" size="sm">
        {photoCats.map((c) => (
          <ToggleGroupItem key={c} value={c}>
            {c}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {cat.toLowerCase()} photos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => (
            <figure key={p.id} className="overflow-hidden rounded-lg border">
              {/* Placeholder until real images come from the API */}
              <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-muted to-secondary text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>
              <figcaption className="p-2 text-xs">
                <span className="font-medium">{p.caption}</span>
                <span className="block text-muted-foreground">
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
