"use client";

import { Anchor, PackageCheck, Plus, Route, SearchX, Ship, Sparkles, Truck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Restricted } from "@/components/app/states";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Truck, title: "Pickup", text: "We collect the vehicle from the auction or seller." },
  { icon: Ship, title: "Ocean freight", text: "It's loaded and shipped to your destination port." },
  { icon: Anchor, title: "Clearance", text: "Customs clears it, then you collect or we deliver." },
];

/** First use: no shipments at all. No cards or zero counts, just what this page is for and how to start. */
export function FirstShipment({ canCreate, onCreate, onAsk }: { canCreate: boolean; onCreate: () => void; onAsk: () => void }) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center py-10 text-center sm:py-16">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
        <Ship className="size-6" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight">Your shipments will show here</h2>
      <p className="mt-2 max-w-md text-sm text-balance text-muted-foreground">
        Book a vehicle and Dockie tracks it from pickup to delivery, with its documents and payments in one place.
      </p>

      <ol className="mt-8 grid w-full gap-px overflow-hidden rounded-xl border bg-border text-left sm:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="flex gap-3 bg-card p-4 sm:flex-col sm:gap-2">
            <span className="flex items-center gap-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
              <Icon className="size-4" aria-hidden />
              <span className="sr-only">Step {i + 1}:</span>
            </span>
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-sm text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Restricted allowed={canCreate} reason="You don't have permission to create shipments.">
          <Button onClick={onCreate}>
            <Plus /> New shipment
          </Button>
        </Restricted>
        <Button variant="outline" onClick={onAsk}>
          <Sparkles /> Ask Dockie how it works
        </Button>
      </div>
    </section>
  );
}

export function NoActiveShipments({ canCreate, onCreate, onShowDelivered }: { canCreate: boolean; onCreate: () => void; onShowDelivered: () => void }) {
  return (
    <EmptyState icon={Route} title="Nothing on the move right now" description="All your shipments have been delivered. Start a new one whenever you're ready." className="border py-12">
      <Restricted allowed={canCreate} reason="You don't have permission to create shipments.">
        <Button onClick={onCreate}>
          <Plus /> New shipment
        </Button>
      </Restricted>
      <Button variant="outline" onClick={onShowDelivered}>
        View delivered
      </Button>
    </EmptyState>
  );
}

export function NoDeliveredShipments({ activeCount, onShowActive }: { activeCount: number; onShowActive: () => void }) {
  return (
    <EmptyState
      icon={PackageCheck}
      title="No deliveries yet"
      description={`Shipments move here once they've been delivered. You have ${activeCount} on the way.`}
      className="border py-12"
    >
      <Button variant="outline" onClick={onShowActive}>
        View active shipments
      </Button>
    </EmptyState>
  );
}

export function NoMatches({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState icon={SearchX} title="No shipments match" description="Try a different search, or remove a filter." className="border py-12">
      <Button variant="outline" onClick={onClear}>
        Clear filters
      </Button>
      <p className="w-full text-xs text-muted-foreground">
        Can&apos;t find a shipment?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-2"
          onClick={() => toast.success("Support request sent", { description: "Operations will reply within an hour." })}
        >
          Contact support
        </button>
      </p>
    </EmptyState>
  );
}
