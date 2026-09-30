import { AppShell } from "@/components/layout/app-shell";

// Every page inside the (app) folder gets the sidebar + top bar.
// The "(app)" folder name is in brackets, so it does NOT appear in the URL:
// src/app/(app)/dashboard/page.tsx  →  /dashboard
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
