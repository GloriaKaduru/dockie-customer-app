"use client";

import { Car, ChevronRight, FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useWorkspace } from "@/components/app/workspace-provider";
import { DocumentStatusBadge, PaymentStatusBadge, StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { formatDate, formatMoney, vehicleName } from "@/lib/format";
import type { Part } from "./engine";

type Handlers = {
  send: (input: string, display?: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onNavigate?: () => void;
  interactive: boolean; // only the latest message's choices stay clickable
};

export function MessagePart({ part, h }: { part: Part; h: Handlers }) {
  switch (part.kind) {
    case "text":
      return <p className="text-sm leading-relaxed whitespace-pre-line">{part.text}</p>;
    case "note":
      return <p className="text-xs text-muted-foreground">{part.text}</p>;
    case "shipments":
      return <ShipmentList ids={part.ids} onNavigate={h.onNavigate} />;
    case "documents":
      return <DocumentList ids={part.ids} onNavigate={h.onNavigate} />;
    case "payments":
      return <PaymentList ids={part.ids} onNavigate={h.onNavigate} />;
    case "choices":
      return <Choices part={part} h={h} />;
    case "action":
      return null; // rendered by AgentActionCard in the conversation
    case "vin-input":
      return <VinInput disabled={!h.interactive} onSubmit={(vin) => h.send(`ns:vin:${vin}`, `VIN ${vin}`)} />;
    case "vehicle":
      return (
        <Card size="sm">
          <CardContent className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-muted">
              <Car className="size-5" />
            </span>
            <div>
              <p className="font-medium">
                {part.vehicle.year} {part.vehicle.make} {part.vehicle.model}
              </p>
              <p className="text-muted-foreground">
                {part.vehicle.trim} · VIN <span className="font-mono text-xs">{part.vehicle.vin}</span>
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between gap-2">
            <span className="text-muted-foreground">Is this correct?</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!h.interactive} onClick={() => h.send("ns:edit", "Edit")}>
                Edit
              </Button>
              <Button size="sm" disabled={!h.interactive} onClick={() => h.send("ns:yes", "Yes")}>
                Yes
              </Button>
            </div>
          </CardFooter>
        </Card>
      );
    case "quote":
      return (
        <Card size="sm">
          <CardContent>
            <dl className="space-y-1.5">
              {part.lines.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
          <CardFooter className="justify-between">
            <span className="font-medium">Estimated total</span>
            <span className="text-base font-semibold tabular-nums">{part.total}</span>
          </CardFooter>
        </Card>
      );
  }
}

function Choices({ part, h }: { part: Extract<Part, { kind: "choices" }>; h: Handlers }) {
  return (
    <div className="space-y-2">
      {part.prompt && <p className="text-sm font-medium">{part.prompt}</p>}
      <div className="flex flex-wrap gap-2">
        {part.options.map((o) =>
          o.href ? (
            <Button key={o.label} asChild variant="outline" size="sm" className="h-auto min-h-7 py-1 whitespace-normal">
              <Link href={o.href} onClick={h.onNavigate}>
                {o.label}
              </Link>
            </Button>
          ) : (
            <Button
              key={o.label}
              variant="outline"
              size="sm"
              className="h-auto min-h-7 py-1 text-left whitespace-normal"
              disabled={!h.interactive}
              onClick={() => (o.command ? h.send(o.command, o.label) : h.send(o.send ?? o.label))}
            >
              {o.label}
            </Button>
          ),
        )}
      </div>
    </div>
  );
}

function ShipmentList({ ids, onNavigate }: { ids: string[]; onNavigate?: () => void }) {
  const { getShipment } = useWorkspace();
  if (!ids.length) return null;
  return (
    <ItemGroup className="gap-1.5">
      {ids.map((id) => {
        const s = getShipment(id);
        if (!s) return null;
        return (
          <Item key={id} asChild variant="outline" size="sm">
            <Link href={`/shipments/${id}`} onClick={onNavigate}>
              <ItemContent>
                <ItemTitle>{vehicleName(s.vehicle)}</ItemTitle>
                <ItemDescription>
                  {s.id} · {s.location.label}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <StatusBadge status={s.status} />
                <ChevronRight className="size-4 text-muted-foreground" />
              </ItemActions>
            </Link>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

function DocumentList({ ids, onNavigate }: { ids: string[]; onNavigate?: () => void }) {
  const { documents } = useWorkspace();
  return (
    <ItemGroup className="gap-1.5">
      {ids.map((id) => {
        const d = documents.find((x) => x.id === id);
        if (!d) return null;
        return (
          <Item key={id} asChild variant="outline" size="sm">
            <Link href={`/documents?doc=${d.id}`} onClick={onNavigate}>
              <ItemMedia variant="icon">
                <FileText />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{d.type}</ItemTitle>
                <ItemDescription>{d.shipmentId}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <DocumentStatusBadge status={d.status} />
              </ItemActions>
            </Link>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

function PaymentList({ ids, onNavigate }: { ids: string[]; onNavigate?: () => void }) {
  const { payments } = useWorkspace();
  return (
    <ItemGroup className="gap-1.5">
      {ids.map((id) => {
        const p = payments.find((x) => x.id === id);
        if (!p) return null;
        return (
          <Item key={id} asChild variant="outline" size="sm">
            <Link href={`/payments?invoice=${p.id}`} onClick={onNavigate}>
              <ItemMedia variant="icon">
                <Receipt />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {p.id} · {formatMoney(p.amount)}
                </ItemTitle>
                <ItemDescription>
                  {p.shipmentId} · due {formatDate(p.dueAt)}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <PaymentStatusBadge status={p.status} />
              </ItemActions>
            </Link>
          </Item>
        );
      })}
    </ItemGroup>
  );
}

function VinInput({ onSubmit, disabled }: { onSubmit: (vin: string) => void; disabled: boolean }) {
  const [vin, setVin] = useState("");
  const valid = /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit(vin.toUpperCase());
      }}
    >
      <InputGroup>
        <InputGroupInput
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          placeholder="Enter 17-character VIN"
          maxLength={17}
          disabled={disabled}
          className="font-mono"
          aria-label="VIN"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" variant="default" size="xs" disabled={!valid || disabled}>
            Look up
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="mt-1 text-xs text-muted-foreground">{vin.length}/17 — try 5FNYF6H59LB041278</p>
    </form>
  );
}
