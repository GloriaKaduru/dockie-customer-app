"use client";

import { ArrowUpDown, ListFilter, Package, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Restricted, EmptyState } from "@/components/app/states";
import { PageHeader } from "@/components/app/page-header";
import { useWorkspace } from "@/components/app/workspace-provider";
import { SetDockieContext, useDockie } from "@/components/dockie/dockie-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { allStatuses, shipmentStatus, statusGroups, type StatusGroup } from "@/lib/status";
import type { ShipmentStatus } from "@/lib/types";
import { ShipmentTable } from "./shipment-table";

type Sort = "updated" | "eta" | "booked" | "vehicle";
const ANY = "any";

export function ShipmentsView({ initialGroup, initialStatus }: { initialGroup?: StatusGroup; initialStatus?: ShipmentStatus }) {
  const { shipments, documents, payments, can } = useWorkspace();
  const { startNewShipment } = useDockie();

  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<ShipmentStatus[]>(
    initialStatus ? [initialStatus] : initialGroup ? allStatuses.filter((s) => shipmentStatus[s].group === initialGroup) : [],
  );
  const [origin, setOrigin] = useState(ANY);
  const [destination, setDestination] = useState(ANY);
  const [docStatus, setDocStatus] = useState(ANY);
  const [payStatus, setPayStatus] = useState(ANY);
  const [sort, setSort] = useState<Sort>("updated");

  const origins = [...new Set(shipments.map((s) => s.origin))].sort();
  const destinations = [...new Set(shipments.map((s) => s.destination))].sort();
  const activeFilters = statuses.length + [origin, destination, docStatus, payStatus].filter((v) => v !== ANY).length;

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments
      .filter((s) => {
        // Search: VIN, booking #, make, model (PRD §2.5)
        if (q && ![s.id, s.vehicle.vin, s.vehicle.make, s.vehicle.model, `${s.vehicle.year}`].some((f) => f.toLowerCase().includes(q))) return false;
        if (statuses.length && !statuses.includes(s.status)) return false;
        if (origin !== ANY && s.origin !== origin) return false;
        if (destination !== ANY && s.destination !== destination) return false;
        if (docStatus !== ANY) {
          const docs = documents.filter((d) => d.shipmentId === s.id && d.required);
          const missing = docs.some((d) => d.status === "required" || d.status === "rejected");
          if (docStatus === "missing" ? !missing : missing) return false;
        }
        if (payStatus !== ANY) {
          const unpaid = payments.some((p) => p.shipmentId === s.id && p.status !== "paid");
          if (payStatus === "unpaid" ? !unpaid : unpaid) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "vehicle") return a.vehicle.make.localeCompare(b.vehicle.make);
        if (sort === "eta") return +new Date(a.eta.date ?? "2100-01-01") - +new Date(b.eta.date ?? "2100-01-01");
        if (sort === "booked") return +new Date(b.bookedAt) - +new Date(a.bookedAt);
        return +new Date(b.lastUpdated) - +new Date(a.lastUpdated);
      });
  }, [shipments, documents, payments, query, statuses, origin, destination, docStatus, payStatus, sort]);

  const clear = () => {
    setStatuses([]);
    setOrigin(ANY);
    setDestination(ANY);
    setDocStatus(ANY);
    setPayStatus(ANY);
    setQuery("");
  };

  const toggleStatus = (s: ShipmentStatus) => setStatuses((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  return (
    <>
      <SetDockieContext context={{ kind: "shipments" }} />
      <PageHeader
        title="Shipments"
        description={`${shipments.length} vehicles in your workspace`}
        actions={
          <Restricted allowed={can("shipments.create")} reason="You don't have permission to create shipments.">
            <Button onClick={startNewShipment}>
              <Plus /> New shipment
            </Button>
          </Restricted>
        }
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <InputGroup className="sm:max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search VIN, booking #, vehicle…" aria-label="Search shipments" />
            {query && (
              <InputGroupAddon align="inline-end">
                <button onClick={() => setQuery("")} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </InputGroupAddon>
            )}
          </InputGroup>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <ListFilter /> Filters
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-5 min-w-5 px-1 tabular-nums">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(92vw,560px)] p-0">
                <div className="grid sm:grid-cols-[1fr_220px]">
                  <div className="border-b p-3 sm:border-r sm:border-b-0">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">Status</p>
                      <Select value="" onValueChange={(g) => setStatuses(allStatuses.filter((s) => shipmentStatus[s].group === g))}>
                        <SelectTrigger size="sm" className="h-7 w-auto text-xs">
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusGroups.map((g) => (
                            <SelectItem key={g.key} value={g.key}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <ScrollArea className="h-64">
                      <div className="space-y-1 pr-3">
                        {allStatuses.map((s) => (
                          <Label key={s} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 font-normal hover:bg-muted">
                            <Checkbox checked={statuses.includes(s)} onCheckedChange={() => toggleStatus(s)} />
                            {shipmentStatus[s].label}
                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{shipments.filter((x) => x.status === s).length}</span>
                          </Label>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  <div className="space-y-3 p-3">
                    <FilterSelect label="Origin" value={origin} onChange={setOrigin} options={origins.map((o) => [o, o])} />
                    <FilterSelect label="Destination" value={destination} onChange={setDestination} options={destinations.map((o) => [o, o])} />
                    <FilterSelect label="Document status" value={docStatus} onChange={setDocStatus} options={[["missing", "Missing documents"], ["complete", "Complete"]]} />
                    <FilterSelect label="Payment status" value={payStatus} onChange={setPayStatus} options={[["unpaid", "Unpaid invoices"], ["paid", "All paid"]]} />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between p-2">
                  <Button variant="ghost" size="sm" onClick={clear} disabled={activeFilters === 0 && !query}>
                    Clear all
                  </Button>
                  <p className="self-center pr-2 text-xs text-muted-foreground">{rows.length} results</p>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ArrowUpDown /> Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as Sort)}>
                  <DropdownMenuRadioItem value="updated">Last updated</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="eta">ETA (soonest)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="booked">Booked (newest)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="vehicle">Vehicle (A–Z)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {statuses.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((s) => (
              <Badge key={s} variant="outline" className="gap-1 pr-1">
                {shipmentStatus[s].label}
                <button onClick={() => toggleStatus(s)} aria-label={`Remove ${shipmentStatus[s].label}`} className="rounded-sm hover:bg-muted">
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <Button variant="link" size="xs" onClick={() => setStatuses([])}>
              Clear
            </Button>
          </div>
        )}
      </PageHeader>

      <Card className="py-0">
        {rows.length ? (
          <ShipmentTable shipments={rows} columns={["vehicle", "vin", "booking", "status", "origin", "destination", "location", "eta", "updated"]} />
        ) : (
          <EmptyState icon={Package} title="No shipments match" description="Try a different search or clear your filters.">
            <Button variant="outline" onClick={clear}>
              Clear filters
            </Button>
          </EmptyState>
        )}
      </Card>
    </>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any</SelectItem>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
