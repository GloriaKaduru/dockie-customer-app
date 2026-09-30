"use client";

import { Copy, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { roles } from "@/lib/permissions";
import type { Role } from "@/lib/types";

export type Invite = { email: string; role: Role };

/** Email rows with a role each, "+ Add another", or copy an invite link (PRD §10.6–10.7). */
export function InviteRows({ rows, setRows }: { rows: Invite[]; setRows: (r: Invite[]) => void }) {
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <Input
            type="email"
            placeholder="name@company.com"
            value={r.email}
            onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, email: e.target.value } : x)))}
            aria-label={`Email ${i + 1}`}
          />
          <Select value={r.role} onValueChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, role: v as Role } : x)))}>
            <SelectTrigger className="w-36 shrink-0" aria-label={`Role ${i + 1}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roles) as Role[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {roles[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {rows.length > 1 && (
            <Button variant="ghost" size="icon" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label="Remove row">
              <X />
            </Button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setRows([...rows, { email: "", role: "operations" }])}>
        <Plus /> Add another
      </Button>
    </div>
  );
}

export function InviteLink() {
  const link = "https://app.dockie.co/join/lai-7f3k2";
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground">Or share an invite link</Label>
      <InputGroup>
        <InputGroupInput readOnly value={link} className="font-mono text-xs" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            onClick={() => {
              navigator.clipboard?.writeText(link);
              toast.success("Invite link copied");
            }}
          >
            <Copy /> Copy
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

export function InviteDialog({ open, onOpenChange, onInvite }: { open: boolean; onOpenChange: (o: boolean) => void; onInvite: (i: Invite[]) => void }) {
  const [rows, setRows] = useState<Invite[]>([{ email: "", role: "operations" }]);
  const valid = rows.filter((r) => /\S+@\S+\.\S+/.test(r.email));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite teammates</DialogTitle>
          <DialogDescription>They&apos;ll get an email to join Lagos Auto Imports on Dockie.</DialogDescription>
        </DialogHeader>
        <InviteRows rows={rows} setRows={setRows} />
        <Separator />
        <InviteLink />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid.length}
            onClick={() => {
              onInvite(valid);
              setRows([{ email: "", role: "operations" }]);
              onOpenChange(false);
            }}
          >
            Send {valid.length > 1 ? `${valid.length} invites` : "invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
