"use client";

import { ArrowUpDown, ChevronDown, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Restricted } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext, useDockie } from "@/components/dockie/dockie-provider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { allStatuses, shipmentStatus, type StatusGroup } from "@/lib/status";
import { timeAgo } from "@/lib/format";
import type { Shipment, ShipmentStatus } from "@/lib/types";
import { ANY, ShipmentFilters, countFilters, docOptions, noFilters, payOptions, type Filters } from "./shipment-filters";
import { ShipmentList, type Sort, type SortKey } from "./shipment-list";
import { ShipmentSummary, type SummaryGroup } from "./shipment-summary";
import { FirstShipment, NoActiveShipments, NoDeliveredShipments, NoMatches } from "./shipments-empty";
import { Pill } from "./uber";

type Tab = "active" | "delivered";
/** Preview states for the prototype: ?state=empty | no-active | no-delivered */
export type DemoState = "empty" | "no-active" | "no-delivered";

const summaryGroups: StatusGroup[] = ["in_transit", "at_port", "awaiting_pickup"];
const groupLabels: Record<SummaryGroup, string> = { in_transit: "In transit", at_port: "At port", awaiting_pickup: "Awaiting pickup" };
const sortLabels: Record<SortKey, string> = { updated: "Last updated", eta: "ETA", booked: "Booked", vehicle: "Vehicle" };
const defaultDir = (k: SortKey, tab: Tab): Sort["dir"] => (k === "vehicle" || (k === "eta" && tab === "active") ? "asc" : "desc");
const defaultSort = (tab: Tab): Sort => (tab === "active" ? { key: "updated", dir: "desc" } : { key: "eta", dir: "desc" });

export function ShipmentsView({ initialGroup, initialStatus, demo }: { initialGroup?: StatusGroup; initialStatus?: ShipmentStatus; demo?: DemoState }) {
  const { shipments: all, documents, payments, can } = useWorkspace();
  const { startNewShipment, ask } = useDockie();

  const initialTab: Tab = initialGroup === "delivered" || initialStatus === "delivered" ? "delivered" : "active";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [group, setGroup] = useState<SummaryGroup | null>(initialGroup && summaryGroups.includes(initialGroup) ? (initialGroup as SummaryGroup) : null);
  const [filters, setFilters] = useState<Filters>({
    ...noFilters,
    // Home links to ?group=issues, which has no summary card; apply it as a status filter instead.
    statuses: initialStatus && initialStatus !== "delivered" ? [initialStatus] : initialGroup === "issues" ? allStatuses.filter((s) => shipmentStatus[s].group === "issues") : [],
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>(defaultSort(initialTab));

  const shipments = useMemo(
    () => (demo === "empty" ? [] : demo === "no-active" ? all.filter((s) => s.status === "delivered") : demo === "no-delivered" ? all.filter((s) => s.status !== "delivered") : all),
    [all, demo],
  );
  const active = shipments.filter((s) => s.status !== "delivered");
  const delivered = shipments.filter((s) => s.status === "delivered");
  const tabList = tab === "active" ? active : delivered;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dir = sort.dir === "asc" ? 1 : -1;
    const time = (iso?: string) => (iso ? +new Date(iso) : Number.MAX_SAFE_INTEGER);
    return tabList
      .filter((s) => {
        if (tab === "active" && group && shipmentStatus[s.status].group !== group) return false;
        // Search: VIN, booking #, make, model, year (PRD §2.5)
        if (q && ![s.id, s.vehicle.vin, s.vehicle.make, s.vehicle.model, `${s.vehicle.year}`].some((f) => f.toLowerCase().includes(q))) return false;
        if (filters.statuses.length && !filters.statuses.includes(s.status)) return false;
        if (filters.origin !== ANY && s.origin !== filters.origin) return false;
        if (filters.destination !== ANY && s.destination !== filters.destination) return false;
        if (filters.docStatus !== ANY) {
          const missing = documents.some((d) => d.shipmentId === s.id && d.required && (d.status === "required" || d.status === "rejected"));
          if (filters.docStatus === "missing" ? !missing : missing) return false;
        }
        if (filters.payStatus !== ANY) {
          const unpaid = payments.some((p) => p.shipmentId === s.id && p.status !== "paid");
          if (filters.payStatus === "unpaid" ? !unpaid : unpaid) return false;
        }
        return true;
      })
      .sort((a: Shipment, b: Shipment) => {
        if (sort.key === "vehicle") return dir * `${a.vehicle.make} ${a.vehicle.model}`.localeCompare(`${b.vehicle.make} ${b.vehicle.model}`);
        if (sort.key === "eta") return dir * (time(a.eta.date) - time(b.eta.date));
        if (sort.key === "booked") return dir * (time(a.bookedAt) - time(b.bookedAt));
        return dir * (time(a.lastUpdated) - time(b.lastUpdated));
      });
  }, [tabList, tab, group, query, filters, sort, documents, payments]);

  const filtering = Boolean(query.trim()) || countFilters(filters) > 0 || (tab === "active" && group !== null);
  const latest = shipments.map((s) => s.lastUpdated).sort().at(-1);
  const places = (key: "origin" | "destination") => [...new Set(tabList.map((s) => s[key]))].sort();
  const statusOptions =
    tab === "active"
      ? allStatuses.filter((s) => s !== "delivered").map((status) => ({ status, count: active.filter((x) => x.status === status).length })).filter((o) => o.count > 0 || filters.statuses.includes(o.status))
      : [];

  const changeTab = (t: string) => {
    setTab(t as Tab);
    setSort(defaultSort(t as Tab));
    setFilters((f) => ({ ...f, statuses: [] }));
  };
  const selectGroup = (g: SummaryGroup | null) => {
    setGroup(g);
    if (tab !== "active") changeTab("active");
  };
  const clearAll = () => {
    setFilters(noFilters);
    setGroup(null);
    setQuery("");
  };
  const canCreate = can("shipments.create");

  if (shipments.length === 0) {
    return (
      <>
        <SetDockieContext context={{ kind: "shipments" }} />
        <h1 className="heading-xl max-sm:heading-m">Shipments</h1>
        <FirstShipment canCreate={canCreate} onCreate={startNewShipment} onAsk={() => ask("How does shipping a vehicle with Dockie work?")} />
      </>
    );
  }

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(tab === "active" && group ? [{ key: "group", label: groupLabels[group], remove: () => setGroup(null) }] : []),
    ...filters.statuses.map((s) => ({ key: s, label: shipmentStatus[s].label, remove: () => setFilters((f) => ({ ...f, statuses: f.statuses.filter((x) => x !== s) })) })),
    ...(filters.origin !== ANY ? [{ key: "origin", label: `From ${filters.origin}`, remove: () => setFilters((f) => ({ ...f, origin: ANY })) }] : []),
    ...(filters.destination !== ANY ? [{ key: "destination", label: `To ${filters.destination}`, remove: () => setFilters((f) => ({ ...f, destination: ANY })) }] : []),
    ...(filters.docStatus !== ANY ? [{ key: "docs", label: docOptions.find(([v]) => v === filters.docStatus)![1], remove: () => setFilters((f) => ({ ...f, docStatus: ANY })) }] : []),
    ...(filters.payStatus !== ANY ? [{ key: "pay", label: payOptions.find(([v]) => v === filters.payStatus)![1], remove: () => setFilters((f) => ({ ...f, payStatus: ANY })) }] : []),
  ];

  const body = () => {
    if (tab === "active" && active.length === 0) return <NoActiveShipments canCreate={canCreate} onCreate={startNewShipment} onShowDelivered={() => changeTab("delivered")} />;
    if (tab === "delivered" && delivered.length === 0) return <NoDeliveredShipments activeCount={active.length} onShowActive={() => changeTab("active")} />;
    return (
      <>
        {/* Table numbers vs card numbers: when the list is narrowed, say so and show what narrowed it. */}
        {filtering && (
          <div className="mb-5 flex min-h-8 flex-wrap items-center gap-2">
            <p className="mr-1 paragraph-s text-muted-foreground tabular-nums">
              Showing {rows.length} of {tabList.length}
            </p>
            {chips.map((c) => (
              <Pill key={c.key} size="sm" selected onClick={c.remove} aria-label={`Remove filter: ${c.label}`} className="pr-2">
                {c.label}
                <X />
              </Pill>
            ))}
            {chips.length > 1 && (
              <button type="button" onClick={clearAll} className="label-s underline underline-offset-4 hover:text-muted-foreground">
                Clear all
              </button>
            )}
          </div>
        )}
        {rows.length ? <ShipmentList shipments={rows} sort={sort} delivered={tab === "delivered"} /> : <NoMatches onClear={clearAll} />}
      </>
    );
  };

  return (
    <>
      <SetDockieContext context={{ kind: "shipments" }} />

      {/* Orientation: what am I looking at, how fresh is it */}
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="heading-xl max-sm:heading-m">Shipments</h1>
          <p className="mt-1 paragraph-s text-muted-foreground tabular-nums">
            {active.length} active <span aria-hidden>·</span> {delivered.length} delivered
            {latest && (
              <>
                {" "}
                <span aria-hidden>·</span> Updated {timeAgo(latest)}
              </>
            )}
          </p>
        </div>
        <Restricted allowed={canCreate} reason="You don't have permission to create shipments.">
          <Button onClick={startNewShipment} className="h-11 gap-2 rounded-lg px-5 text-base max-sm:size-11 max-sm:px-0" aria-label="New shipment">
            <Plus />
            <span className="max-sm:sr-only">New shipment</span>
          </Button>
        </Restricted>
      </header>

      {/* Overview: global counts of active shipments, never affected by filters */}
      {active.length > 0 && (
        <div className="mt-8">
          <ShipmentSummary shipments={active} selected={tab === "active" ? group : null} onSelect={selectGroup} />
        </div>
      )}

      {/* Work surface */}
      <Tabs value={tab} onValueChange={changeTab} className="mt-10 gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:border-b xl:items-end xl:justify-between">
          <TabsList variant="line" className="h-auto w-full justify-start gap-6 rounded-none border-b p-0 xl:w-auto xl:border-0">
            {(["active", "delivered"] as const).map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="h-auto flex-none rounded-none px-0 pt-1 pb-3 heading-xs text-muted-foreground data-active:text-foreground group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-1"
              >
                {t === "active" ? "Active" : "Delivered"} <span className="label-m text-muted-foreground tabular-nums">{t === "active" ? active.length : delivered.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabList.length > 0 && (
            <div className="flex min-w-0 items-center gap-2 xl:pb-3">
              {/* Uber's search: a filled grey pill, no border; black ring on focus */}
              <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-secondary px-4 focus-within:ring-2 focus-within:ring-ring xl:w-80 xl:flex-none">
                <Search className="size-4 shrink-0" aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search VIN, booking #, vehicle"
                  aria-label="Search shipments"
                  className="min-w-0 flex-1 bg-transparent paragraph-s outline-none placeholder:text-muted-foreground"
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="grid size-5 place-items-center rounded-full bg-foreground text-background">
                    <X className="size-3" />
                  </button>
                )}
              </label>
              <ShipmentFilters filters={filters} onChange={setFilters} statusOptions={statusOptions} origins={places("origin")} destinations={places("destination")} resultCount={rows.length} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Pill className="max-lg:w-10 max-lg:justify-center max-lg:px-0" aria-label={`Sort by ${sortLabels[sort.key]}`}>
                    <ArrowUpDown className="lg:hidden" />
                    <span className="max-lg:sr-only">{sort.key === "eta" && tab === "delivered" ? "Delivered" : sortLabels[sort.key]}</span>
                    <ChevronDown className="max-lg:hidden" />
                  </Pill>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="uber min-w-52 rounded-xl p-2 shadow-lg">
                  <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={sort.key} onValueChange={(k) => setSort({ key: k as SortKey, dir: defaultDir(k as SortKey, tab) })}>
                    <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="eta">{tab === "active" ? "ETA (soonest)" : "Delivered (newest)"}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="booked">Booked (newest)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="vehicle">Vehicle (A to Z)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <TabsContent value="active">{body()}</TabsContent>
        <TabsContent value="delivered">{body()}</TabsContent>
      </Tabs>
    </>
  );
}
