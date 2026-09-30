import { AppShell } from "@/components/app/app-shell";

// Every authenticated screen shares this shell (PRD §0).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
