"use client";

import { ArrowLeft, Building2, Car, MailCheck, MapPin, MessagesSquare, Package, Sparkles, Truck, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DockieLogo } from "@/components/app/logo";
import { InviteLink, InviteRows, type Invite } from "@/components/settings/invite-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { STEPS, type Step } from "./steps";

/** Onboarding (PRD §10). One route per step: /onboarding/<step>. */
export function OnboardingFlow({ step }: { step: Step }) {
  const router = useRouter();
  const [form, setForm] = useOnboardingState();
  const index = STEPS.indexOf(step);
  const next = (to?: Step) => router.push(`/onboarding/${to ?? STEPS[index + 1]}`);
  const back = index > 0 ? `/onboarding/${STEPS[index - 1]}` : "/login";

  if (step === "walkthrough") return <Walkthrough />;

  return (
    <div className="flex min-h-svh flex-col items-center bg-muted/40 px-4 py-8 sm:py-14">
      <div className="mb-8 flex w-full max-w-md items-center justify-between">
        <DockieLogo />
        {/* Progress dots */}
        <div className="flex gap-1.5" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-primary" : i < index ? "w-1.5 bg-primary/60" : "w-1.5 bg-border")} />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <Button variant="ghost" size="icon-sm" asChild className="-ml-1 mb-1">
            <Link href={back} aria-label="Back">
              <ArrowLeft />
            </Link>
          </Button>
          {step === "signup" && <Title title="Create your Dockie account" description="Move vehicles, track them and handle paperwork in one place." />}
          {step === "verify-email" && <Title title="Check your email" description={`We sent a verification link to ${form.email || "your email"}.`} />}
          {step === "verify-phone" && <Title title="Verify your phone" description={`Enter the 6-digit code sent to ${form.phone || "+234…"}.`} />}
          {step === "account-type" && <Title title="How will you use Dockie?" />}
          {step === "business" && <Title title="Set up your business" description="Your team and shipments will live in this workspace." />}
          {step === "team" && <Title title="Build your team" description="Invite teammates to Dockie. You can do this later." />}
        </CardHeader>

        {step === "signup" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input id="name" required autoComplete="name" value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ email: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input id="phone" type="tel" required autoComplete="tel" placeholder="+234 …" value={form.phone} onChange={(e) => setForm({ phone: e.target.value })} />
                  <FieldDescription>We&apos;ll text you a code to verify it.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="mt-6 flex-col gap-3">
              <Button type="submit" className="w-full">
                Continue
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}

        {step === "verify-email" && <VerifyEmail onVerified={() => next()} onChange={() => router.push("/onboarding/signup")} />}
        {step === "verify-phone" && <VerifyPhone onVerified={() => next()} onChange={() => router.push("/onboarding/signup")} />}

        {step === "account-type" && (
          <>
            <CardContent>
              <RadioGroup value={form.accountType} onValueChange={(v) => setForm({ accountType: v })} className="gap-2">
                {[
                  { v: "dealer", icon: Car, label: "I'm a dealer", hint: "Buying and moving vehicles on my own" },
                  { v: "business", icon: Building2, label: "I'm part of a dealership or business", hint: "Set up a workspace for your team" },
                  { v: "forwarder", icon: Truck, label: "I'm a freight forwarder", hint: "Manage vehicles for your clients", soon: true },
                ].map((o) => (
                  <label
                    key={o.v}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-muted/50",
                      o.soon && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <o.icon className="size-5 text-muted-foreground" />
                    <span className="flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {o.label} {o.soon && <Badge variant="secondary">Coming soon</Badge>}
                      </span>
                      <span className="text-xs text-muted-foreground">{o.hint}</span>
                    </span>
                    <RadioGroupItem value={o.v} disabled={o.soon} />
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="mt-6">
              <Button className="w-full" disabled={!form.accountType} onClick={() => next(form.accountType === "dealer" ? "walkthrough" : "business")}>
                Continue
              </Button>
            </CardFooter>
          </>
        )}

        {step === "business" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="biz">Business name</FieldLabel>
                  <Input id="biz" required value={form.business} onChange={(e) => setForm({ business: e.target.value })} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="bizid">Business identifier</FieldLabel>
                  <Input id="bizid" placeholder="e.g. RC-1482093" value={form.businessId} onChange={(e) => setForm({ businessId: e.target.value })} />
                  <FieldDescription>Your CAC or company registration number. Optional for now.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="mt-6">
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "team" && <TeamStep onDone={() => next()} />}
      </Card>
    </div>
  );
}

function Title({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <CardTitle className="text-xl">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </>
  );
}

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return { left, restart: () => setLeft(seconds) };
}

function VerifyEmail({ onVerified, onChange }: { onVerified: () => void; onChange: () => void }) {
  const { left, restart } = useCountdown(30);
  return (
    <>
      <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted">
          <MailCheck className="size-6" />
        </span>
        <p className="text-sm text-muted-foreground">Open the link on this device to continue.</p>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {/* Prototype shortcut for the link click */}
        <Button className="w-full" onClick={onVerified}>
          I&apos;ve verified my email
        </Button>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" disabled={left > 0} onClick={restart}>
            {left > 0 ? `Resend in 0:${String(left).padStart(2, "0")}` : "Resend"}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onChange}>
            Change email
          </Button>
        </div>
      </CardFooter>
    </>
  );
}

/** Any 6 digits work except 000000, which shows the error state. */
function VerifyPhone({ onVerified, onChange }: { onVerified: () => void; onChange: () => void }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "checking" | "error">("idle");
  const { left, restart } = useCountdown(30);

  const verify = (value: string) => {
    setState("checking");
    setTimeout(() => {
      if (value === "000000") {
        setState("error");
        setCode("");
      } else onVerified();
    }, 700);
  };

  return (
    <>
      <CardContent>
        <Field data-invalid={state === "error"}>
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => {
              setCode(v);
              if (state === "error") setState("idle");
            }}
            onComplete={verify}
            aria-invalid={state === "error"}
            containerClassName="justify-center"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {state === "error" ? <FieldError className="text-center">That code didn&apos;t match. Check the latest text and try again.</FieldError> : <FieldDescription className="text-center">Tip: any code works except 000000.</FieldDescription>}
        </Field>
      </CardContent>
      <CardFooter className="mt-4 flex-col gap-2">
        <Button className="w-full" disabled={code.length < 6 || state === "checking"} onClick={() => verify(code)}>
          {state === "checking" && <Spinner />} Verify
        </Button>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" disabled={left > 0} onClick={restart}>
            {left > 0 ? `Resend code in 0:${String(left).padStart(2, "0")}` : "Resend code"}
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onChange}>
            Change phone
          </Button>
        </div>
      </CardFooter>
    </>
  );
}

function TeamStep({ onDone }: { onDone: () => void }) {
  const [rows, setRows] = useState<Invite[]>([
    { email: "", role: "operations" },
    { email: "", role: "finance" },
  ]);
  const valid = rows.filter((r) => /\S+@\S+\.\S+/.test(r.email));
  return (
    <>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium">Email addresses</p>
          <p className="text-xs text-muted-foreground">Pick what each person will do. Roles control what they can see and change.</p>
        </div>
        <InviteRows rows={rows} setRows={setRows} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" /> OR <Separator className="flex-1" />
        </div>
        <InviteLink />
      </CardContent>
      <CardFooter className="mt-6 flex-col gap-2">
        <Button className="w-full" disabled={!valid.length} onClick={onDone}>
          Send {valid.length > 1 ? `${valid.length} invites` : "invite"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onDone}>
          Skip for now
        </Button>
      </CardFooter>
    </>
  );
}

const walkthrough = [
  { icon: Sparkles, title: "Meet Dockie", body: "Your AI logistics agent. Ask about any vehicle, and Dockie explains, proposes and — once you confirm — acts." },
  { icon: MessagesSquare, title: "Start shipments", body: "Tell Dockie what vehicle you're moving. It collects the details step by step and gives you a quote." },
  { icon: Package, title: "Manage shipments", body: "Everything about your vehicles in one place: status, documents, photos and payments." },
  { icon: MapPin, title: "Track movement", body: "Follow locations, ports and vessels, with an event history for every vehicle." },
  { icon: Users, title: "Work with your team", body: "Invite teammates and control access with roles." },
];

/** Product walkthrough — a few focused steps, always skippable (PRD §10.8–10.9). */
function Walkthrough() {
  const [i, setI] = useState(0);
  const router = useRouter();
  const finish = () => router.push("/home");
  const s = walkthrough[i];
  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip walkthrough
            </Button>
          </div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <s.icon className="size-6" />
          </span>
          <CardTitle className="mt-4 text-xl">{s.title}</CardTitle>
          <CardDescription className="text-balance">{s.body}</CardDescription>
        </CardHeader>
        <CardFooter className="mt-4 flex-col gap-4">
          <div className="flex gap-1.5">
            {walkthrough.map((w, j) => (
              <button key={w.title} onClick={() => setI(j)} aria-label={`Step ${j + 1}: ${w.title}`} className={cn("h-1.5 rounded-full transition-all", j === i ? "w-5 bg-primary" : "w-1.5 bg-border")} />
            ))}
          </div>
          <div className="flex w-full gap-2">
            {i > 0 && (
              <Button variant="outline" className="flex-1" onClick={() => setI(i - 1)}>
                Back
              </Button>
            )}
            <Button className="flex-1" onClick={() => (i < walkthrough.length - 1 ? setI(i + 1) : finish())}>
              {i < walkthrough.length - 1 ? "Next" : "Go to Home"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Form values survive client-side navigation between steps. The real app would post each step to the API.
type OnboardingState = { name: string; email: string; phone: string; accountType: string; business: string; businessId: string };
let saved: OnboardingState = { name: "", email: "", phone: "", accountType: "", business: "", businessId: "" };

function useOnboardingState(): [OnboardingState, (patch: Partial<OnboardingState>) => void] {
  const [state, setState] = useState<OnboardingState>(saved);
  const update = (patch: Partial<OnboardingState>) =>
    setState((s) => {
      saved = { ...s, ...patch };
      return saved;
    });
  return [state, update];
}
