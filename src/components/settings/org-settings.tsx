"use client";

import { Check, Lock, Mail, MoreHorizontal, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Restricted } from "@/components/app/states";
import { useWorkspace } from "@/components/app/workspace-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { members as seedMembers, organization, shipments } from "@/lib/data";
import { formatDateTime, timeAgo } from "@/lib/format";
import { capabilityLabels, roles, type Capability } from "@/lib/permissions";
import type { Member, Role } from "@/lib/types";
import { InviteDialog } from "./invite-dialog";

const TABS = ["general", "team", "roles", "billing", "activity"];

/** Organization settings (PRD §13). */
export function OrgSettings({ initialTab }: { initialTab?: string }) {
  const { can } = useWorkspace();
  const canManage = can("team.manage");
  const [tab, setTab] = useState(TABS.includes(initialTab ?? "") ? initialTab! : "general");

  return (
    <>
      <PageHeader title="Organization" description={`${organization.name} · ${organization.plan} plan`} />
      {!canManage && (
        <Alert className="mb-6">
          <Lock />
          <AlertDescription>You can view organization settings, but only admins can change them.</AlertDescription>
        </Alert>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList variant="line" className="w-full justify-start border-b">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="roles">Roles &amp; permissions</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general" className="mt-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Business details</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="org-name">Business name</FieldLabel>
                  <Input id="org-name" defaultValue={organization.name} disabled={!canManage} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="org-id">Business identifier</FieldLabel>
                  <Input id="org-id" defaultValue={organization.identifier} disabled={!canManage} />
                  <FieldDescription>Your CAC registration number. Used on invoices and customs filings.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-end">
              <Restricted allowed={canManage}>
                <Button size="sm" onClick={() => toast.success("Organization updated")}>
                  Save changes
                </Button>
              </Restricted>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="mt-6">
          <Team canManage={canManage} />
        </TabsContent>
        <TabsContent value="roles" className="mt-6">
          <RolesSummary />
        </TabsContent>
        <TabsContent value="billing" className="mt-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Payment method</CardTitle>
              <CardDescription>Used for shipment invoices when you choose to pay in Dockie.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-sm">
                Visa •••• 4242 <span className="text-muted-foreground">· expires 08/28</span>
              </span>
              <Restricted allowed={can("payments.pay")}>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </Restricted>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-6 max-w-3xl">
          <Card>
            <CardContent>
              <ol className="divide-y text-sm">
                {shipments
                  .flatMap((s) => s.activity.map((a) => ({ ...a, id: s.id })))
                  .sort((a, b) => +new Date(b.at) - +new Date(a.at))
                  .slice(0, 12)
                  .map((a, i) => (
                    <li key={i} className="flex justify-between gap-4 py-2.5">
                      <span>
                        <span className="font-medium">{a.actor}</span> {a.text} <span className="text-muted-foreground">· {a.id}</span>
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatDateTime(a.at)}</span>
                    </li>
                  ))}
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Team({ canManage }: { canManage: boolean }) {
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  return (
    <Card className="py-0">
      <CardHeader className="border-b pt-4">
        <CardTitle>Team</CardTitle>
        <CardDescription>{members.filter((m) => m.status === "active").length} members · {members.filter((m) => m.status === "invited").length} pending</CardDescription>
        <CardAction>
          <Restricted allowed={canManage}>
            <Button size="sm" onClick={() => setInviting(true)}>
              <UserPlus /> Invite
            </Button>
          </Restricted>
        </CardAction>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last active</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{(m.name || m.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{m.name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select
                    value={m.role}
                    disabled={!canManage || m.id === "u1"}
                    onValueChange={(v) => {
                      setMembers((l) => l.map((x) => (x.id === m.id ? { ...x, role: v as Role } : x)));
                      toast.success(`${m.name || m.email} is now ${roles[v as Role].label}`);
                    }}
                  >
                    <SelectTrigger size="sm" className="w-36" aria-label={`Role for ${m.email}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(roles) as Role[]).map((r) => (
                        <SelectItem key={r} value={r}>
                          {roles[r].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {m.status === "active" ? (
                    <Badge variant="secondary" className="bg-success/12 text-success">
                      <Check /> Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-warning/15 text-warning">
                      <Mail /> Invited
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{m.lastActive ? timeAgo(m.lastActive) : "—"}</TableCell>
                <TableCell className="pr-4">
                  {m.id !== "u1" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" disabled={!canManage} aria-label={`Actions for ${m.email}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {m.status === "invited" && (
                          <DropdownMenuItem onSelect={() => toast.success(`Invitation resent to ${m.email}`)}>
                            <Mail /> Resend invitation
                          </DropdownMenuItem>
                        )}
                        {m.status === "invited" && <DropdownMenuSeparator />}
                        <DropdownMenuItem variant="destructive" onSelect={() => setRemoving(m)}>
                          <Trash2 /> {m.status === "invited" ? "Revoke invitation" : "Remove from team"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        onInvite={(invites) => {
          setMembers((l) => [...l, ...invites.map((i, n) => ({ id: `new-${Date.now()}-${n}`, name: "", email: i.email, role: i.role, status: "invited" as const }))]);
          toast.success(`${invites.length} invitation${invites.length > 1 ? "s" : ""} sent`);
        }}
      />

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name || removing?.email}?</AlertDialogTitle>
            <AlertDialogDescription>They&apos;ll lose access to Lagos Auto Imports immediately. Shipments they created stay in the workspace.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setMembers((l) => l.filter((x) => x.id !== removing?.id));
                toast(`${removing?.name || removing?.email} removed`);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/** Role-level capability summary, not a permission matrix (PRD §13.2). */
function RolesSummary() {
  const caps = Object.keys(capabilityLabels) as Capability[];
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {(Object.keys(roles) as Role[]).map((r) => (
        <Card key={r} size="sm">
          <CardHeader>
            <CardTitle>{roles[r].label}</CardTitle>
            <CardDescription>{roles[r].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {caps.map((c) => {
                const yes = roles[r].can.includes(c);
                return (
                  <li key={c} className={yes ? "" : "text-muted-foreground"}>
                    {yes ? <Check className="mr-2 inline size-4 text-success" /> : <X className="mr-2 inline size-4" />}
                    {capabilityLabels[c]}
                    <span className="sr-only">{yes ? " (allowed)" : " (not allowed)"}</span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
