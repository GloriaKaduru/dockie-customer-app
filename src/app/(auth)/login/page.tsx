import Link from "next/link";
import { DockieLogo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Sign in" };

// Sign-in isn't wired to a backend yet; the button goes straight to Home.
export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/40 px-4">
      <DockieLogo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Dockie workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" />
            </Field>
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link href="#" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" autoComplete="current-password" />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="mt-6 flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/home">Sign in</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            New to Dockie?{" "}
            <Link href="/onboarding/signup" className="text-foreground underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
