"use client";

import { AlertTriangle, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { ActionState, ProposedAction } from "./engine";

/**
 * AgentActionCard (PRD §15, §25): what · where · from · to · consequence · explicit action.
 * Consequential actions never happen from natural language alone.
 */
export function AgentActionCard({
  action,
  state,
  error,
  onConfirm,
  onCancel,
}: {
  action: ProposedAction;
  state: ActionState;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const href = `/shipments/${action.targetId}`;

  if (state === "success") {
    return (
      <Card size="sm" className="ring-success/30">
        <CardContent className="flex gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div className="min-w-0 space-y-2">
            <p className="font-medium">
              {action.type === "create_shipment" ? "Shipment created" : `${action.field} updated`}
            </p>
            <p className="text-muted-foreground">
              {action.type === "create_shipment"
                ? `${action.targetId} is booked. We'll assign a transporter within 24 hours.`
                : `${action.targetId} now has ${action.to} as its ${action.field?.toLowerCase()}.`}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={href}>View shipment</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "failed") {
    return (
      <Card size="sm" className="ring-destructive/30">
        <CardContent className="flex gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="min-w-0 space-y-2">
            <p className="font-medium">We couldn&apos;t update the {action.field?.toLowerCase() ?? "shipment"}.</p>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onConfirm}>
                Try again
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href={href}>View shipment</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "cancelled") {
    return <p className="text-sm text-muted-foreground">Cancelled. Nothing was changed.</p>;
  }

  const running = state === "running";
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{action.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">{action.type === "create_shipment" ? "Vehicle" : "Shipment"}</p>
          <p className="font-medium">{action.targetLabel}</p>
        </div>
        {action.from ? (
          <div className="rounded-lg border">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">Current {action.field?.toLowerCase()}</p>
              <p>{action.from}</p>
            </div>
            <div className="relative border-t px-3 py-2">
              <ArrowDown className="absolute -top-2.5 left-3 size-5 rounded-full border bg-background p-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">New {action.field?.toLowerCase()}</p>
              <p className="font-medium">{action.to}</p>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs text-muted-foreground">Route</p>
            <p>{action.to}</p>
          </div>
        )}
        {action.consequence && (
          <p className="flex items-start gap-2 text-muted-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            {action.consequence}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={running}>
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={running}>
          {running && <Spinner />}
          {running ? "Working…" : action.confirmLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
