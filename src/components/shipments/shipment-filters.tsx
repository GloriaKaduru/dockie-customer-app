"use client";

import { Check, ChevronDown, ListFilter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { shipmentStatus } from "@/lib/status";
import type { ShipmentStatus } from "@/lib/types";
import { Pill } from "./uber";

export const ANY = "any";

export interface Filters {
  statuses: ShipmentStatus[];
  origin: string;
  destination: string;
  docStatus: string;
  payStatus: string;
}

export const noFilters: Filters = { statuses: [], origin: ANY, destination: ANY, docStatus: ANY, payStatus: ANY };

export const docOptions: [string, string][] = [
  ["missing", "Missing documents"],
  ["complete", "Documents complete"],
];
export const payOptions: [string, string][] = [
  ["unpaid", "Unpaid invoices"],
  ["paid", "All paid"],
];

export function countFilters(f: Filters) {
  return f.statuses.length + [f.origin, f.destination, f.docStatus, f.payStatus].filter((v) => v !== ANY).length;
}

interface PanelProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  statusOptions: { status: ShipmentStatus; count: number }[];
  origins: string[];
  destinations: string[];
  resultCount: number;
}

/** Filters button: a popover on wide screens, a bottom sheet on phones. Same panel inside both. */
export function ShipmentFilters(props: PanelProps) {
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const count = countFilters(props.filters);
  // Uber's filter chip: grey pill, inverted to black while filters are applied.
  const trigger = (iconOnly: boolean) => (
    <Pill selected={count > 0} aria-label={count ? `Filters, ${count} applied` : "Filters"} className={cn("relative", iconOnly ? "w-10 justify-center px-0 lg:hidden" : "hidden lg:inline-flex")}>
      <ListFilter />
      {!iconOnly && "Filters"}
      {count > 0 &&
        (iconOnly ? (
          <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-info text-[10px] text-white tabular-nums">{count}</span>
        ) : (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary-foreground px-1 text-xs text-primary tabular-nums">{count}</span>
        ))}
    </Pill>
  );

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger(false)}
        </PopoverTrigger>
        <PopoverContent align="end" className="uber w-90 rounded-xl p-0 shadow-lg">
          <FilterPanel {...props} onDone={() => setOpen(false)} />
        </PopoverContent>
      </Popover>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          {trigger(true)}
        </SheetTrigger>
        <SheetContent side="bottom" className="uber max-h-[85dvh] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="border-b">
            <SheetTitle className="heading-xs">Filters</SheetTitle>
            <SheetDescription className="sr-only">Narrow the shipment list</SheetDescription>
          </SheetHeader>
          <FilterPanel {...props} sheet onDone={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterPanel({ filters, onChange, statusOptions, origins, destinations, resultCount, onDone, sheet }: PanelProps & { onDone?: () => void; sheet?: boolean }) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const toggleStatus = (s: ShipmentStatus) => set({ statuses: filters.statuses.includes(s) ? filters.statuses.filter((x) => x !== s) : [...filters.statuses, s] });
  const label = (value: string, options: [string, string][]) => options.find(([v]) => v === value)?.[1] ?? "Any";
  const places = (list: string[]): [string, string][] => list.map((p) => [p, p]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className={cn("divide-y overflow-y-auto", sheet ? "flex-1" : "max-h-[60vh]")}>
        {statusOptions.length > 0 && (
          <FilterRow title="Status" summary={filters.statuses.length ? `${filters.statuses.length} selected` : "Any"} defaultOpen={filters.statuses.length > 0}>
            {statusOptions.map(({ status, count }) => (
              <OptionRow key={status} selected={filters.statuses.includes(status)} onSelect={() => toggleStatus(status)} multi meta={count}>
                {shipmentStatus[status].label}
              </OptionRow>
            ))}
          </FilterRow>
        )}
        <SingleRow title="Origin" value={filters.origin} options={places(origins)} onSelect={(origin) => set({ origin })} summary={label(filters.origin, places(origins))} />
        <SingleRow title="Destination" value={filters.destination} options={places(destinations)} onSelect={(destination) => set({ destination })} summary={label(filters.destination, places(destinations))} />
        <SingleRow title="Documents" value={filters.docStatus} options={docOptions} onSelect={(docStatus) => set({ docStatus })} summary={label(filters.docStatus, docOptions)} />
        <SingleRow title="Payments" value={filters.payStatus} options={payOptions} onSelect={(payStatus) => set({ payStatus })} summary={label(filters.payStatus, payOptions)} />
      </div>
      <div className="flex items-center justify-between gap-2 border-t p-3">
        <Button variant="secondary" className="h-10 rounded-lg px-4" onClick={() => onChange(noFilters)} disabled={countFilters(filters) === 0}>
          Clear all
        </Button>
        <Button className="h-10 flex-1 rounded-lg px-4" onClick={onDone}>
          Show {resultCount} {resultCount === 1 ? "shipment" : "shipments"}
        </Button>
      </div>
    </div>
  );
}

function FilterRow({ title, summary, defaultOpen, children }: { title: string; summary: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/row">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center gap-3 px-4 text-left text-sm hover:bg-muted">
        <span className="label-m">{title}</span>
        <span className={cn("ml-auto truncate text-muted-foreground", summary !== "Any" && "text-foreground")}>{summary}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/row:rotate-180" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-2 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function SingleRow({ title, value, options, onSelect, summary }: { title: string; value: string; options: [string, string][]; onSelect: (v: string) => void; summary: string }) {
  return (
    <FilterRow title={title} summary={summary} defaultOpen={value !== ANY}>
      <OptionRow selected={value === ANY} onSelect={() => onSelect(ANY)}>
        Any
      </OptionRow>
      {options.map(([v, l]) => (
        <OptionRow key={v} selected={value === v} onSelect={() => onSelect(v)}>
          {l}
        </OptionRow>
      ))}
    </FilterRow>
  );
}

function OptionRow({ selected, onSelect, multi, meta, children }: { selected: boolean; onSelect: () => void; multi?: boolean; meta?: number; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left paragraph-s hover:bg-muted"
    >
      <span className={cn("grid size-5 shrink-0 place-items-center border-2", multi ? "rounded-[4px]" : "rounded-full", selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/40")}>
        {selected && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="flex-1">{children}</span>
      {meta !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{meta}</span>}
    </button>
  );
}
