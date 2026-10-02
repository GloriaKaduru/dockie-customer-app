"use client";

import { Anchor, PackageCheck, Plus, Route, SearchX, Ship, Sparkles, Truck, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Restricted } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { MapArt, Pill } from "./uber";

const steps = [
  { icon: Truck, title: "Pickup", text: "We collect the vehicle from the auction or seller." },
  { icon: Ship, title: "Ocean freight", text: "It's loaded and shipped to your destination port." },
  { icon: Anchor, title: "Clearance", text: "Customs clears it, then you collect or we deliver." },
];

/** First use, modelled on Uber's "Request a ride" hero: big headline and black CTA beside the map. */
export function FirstShipment({ canCreate, onCreate, onAsk }: { canCreate: boolean; onCreate: () => void; onAsk: () => void }) {
  return (
    <section className="mt-8 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      <div>
        <h2 className="heading-xxl max-sm:heading-l">Ship your first vehicle</h2>
        <p className="mt-3 max-w-md paragraph-m text-muted-foreground">
          Book a vehicle and Dockie tracks it from pickup to delivery, with its documents and payments in one place.
        </p>

        <ol className="mt-8 max-w-md">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-4 border-b py-4 last:border-b-0">
              <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
              <span>
                <span className="block label-m">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </span>
                <span className="mt-1 block paragraph-s text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Restricted allowed={canCreate} reason="You don't have permission to create shipments.">
            <Button onClick={onCreate} className="h-12 gap-2 rounded-lg px-6 text-base">
              <Plus /> New shipment
            </Button>
          </Restricted>
          <Button variant="secondary" onClick={onAsk} className="h-12 gap-2 rounded-lg px-6 text-base">
            <Sparkles /> Ask Dockie how it works
          </Button>
        </div>
      </div>
      <div className="aspect-[4/3] overflow-hidden rounded-2xl max-lg:hidden">
        <MapArt seed="first-shipment" ocean progress={0.35} variant="full" labels={{ from: "Savannah", to: "Accra", badge: "18 days" }} />
      </div>
    </section>
  );
}

/** Uber's empty card: a map banner across the top, a bold one-liner, and pill actions. */
function EmptyCard({ seed, icon: Icon, title, description, children }: { seed: string; icon: LucideIcon; title: string; description: string; children?: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border">
      <div className="relative h-32 sm:h-40">
        <MapArt seed={seed} progress={null} variant="full" className="absolute inset-0" />
        <span className="absolute top-1/2 left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-foreground text-background shadow-lg">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="label-l">{title}</h3>
        <p className="mt-1 paragraph-s text-muted-foreground">{description}</p>
        {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
      </div>
    </section>
  );
}

export function NoActiveShipments({ canCreate, onCreate, onShowDelivered }: { canCreate: boolean; onCreate: () => void; onShowDelivered: () => void }) {
  return (
    <EmptyCard seed="no-active" icon={Route} title="Nothing on the move right now" description="All your shipments have been delivered. Start a new one whenever you're ready.">
      <Restricted allowed={canCreate} reason="You don't have permission to create shipments.">
        <Pill selected onClick={onCreate}>
          <Plus /> New shipment
        </Pill>
      </Restricted>
      <Pill onClick={onShowDelivered}>View delivered</Pill>
    </EmptyCard>
  );
}

export function NoDeliveredShipments({ activeCount, onShowActive }: { activeCount: number; onShowActive: () => void }) {
  return (
    <EmptyCard seed="no-delivered" icon={PackageCheck} title="No deliveries yet" description={`Shipments move here once they've been delivered. You have ${activeCount} on the way.`}>
      <Pill onClick={onShowActive}>View active shipments</Pill>
    </EmptyCard>
  );
}

export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <EmptyCard seed="no-matches" icon={SearchX} title="No shipments match" description="Try a different search, or remove a filter.">
      <Pill onClick={onClear}>Clear filters</Pill>
      <p className="w-full pt-1 paragraph-xs text-muted-foreground">
        Can&apos;t find a shipment?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-2"
          onClick={() => toast.success("Support request sent", { description: "Operations will reply within an hour." })}
        >
          Contact support
        </button>
      </p>
    </EmptyCard>
  );
}
