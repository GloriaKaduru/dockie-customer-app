"use client";

import { BadgeCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { currentUser } from "@/lib/data";

const notificationPrefs = [
  { id: "status", label: "Status changes", hint: "When a shipment moves to a new stage", on: true },
  { id: "issues", label: "Issues and delays", hint: "When Dockie or operations flags a problem", on: true },
  { id: "documents", label: "Document requests", hint: "When a title or receipt is required or rejected", on: true },
  { id: "payments", label: "Payments due", hint: "Three days before an invoice is due", on: false },
];

/** User profile (PRD §14). */
export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile & preferences" />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  <AvatarFallback>{currentUser.initials}</AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Change photo
                </Button>
              </div>
              <Field>
                <FieldLabel htmlFor="name">Full name</FieldLabel>
                <Input id="name" defaultValue={currentUser.name} />
              </Field>
              <Field>
                <FieldLabel htmlFor="email" className="flex items-center gap-2">
                  Email <VerifiedBadge ok={currentUser.emailVerified} />
                </FieldLabel>
                <Input id="email" type="email" defaultValue={currentUser.email} />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone" className="flex items-center gap-2">
                  Phone <VerifiedBadge ok={currentUser.phoneVerified} />
                </FieldLabel>
                <Input id="phone" type="tel" defaultValue={currentUser.phone} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button size="sm" onClick={() => toast.success("Profile saved")}>
              Save changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Email and in-app. Critical issues always notify you.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {notificationPrefs.map((n) => (
                <Field key={n.id} orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={`n-${n.id}`}>{n.label}</FieldLabel>
                    <FieldDescription>{n.hint}</FieldDescription>
                  </FieldContent>
                  <Switch id={`n-${n.id}`} defaultChecked={n.on} />
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice</CardTitle>
            <CardDescription>How Dockie handles spoken questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="review">Review transcripts before sending</FieldLabel>
                  <FieldDescription>Edit what Dockie heard before it acts.</FieldDescription>
                </FieldContent>
                <Switch id="review" defaultChecked />
              </Field>
              <Field>
                <FieldLabel>Spoken language</FieldLabel>
                <Select defaultValue="en-NG">
                  <SelectTrigger className="w-60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-NG">English (Nigeria)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline">Change password</Button>
            <Button variant="outline" asChild>
              <Link href="/login">
                <LogOut /> Sign out
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function VerifiedBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <Badge variant="secondary" className="bg-success/12 text-success">
      <BadgeCheck /> Verified
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-warning/15 text-warning">
      Not verified
    </Badge>
  );
}
