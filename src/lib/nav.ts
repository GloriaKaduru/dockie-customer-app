import { CreditCard, FileText, LayoutDashboard, Package, PlusCircle, Settings, Sparkles } from "lucide-react";

// The sidebar is built from this list. To add a new module:
//   1. create src/app/(app)/<name>/page.tsx
//   2. add an entry here
export const mainNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/shipments/new", label: "Get a quote", icon: PlusCircle },
  { href: "/assistant", label: "Dockie AI", icon: Sparkles },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/documents", label: "Documents", icon: FileText },
] as const;

export const secondaryNav = [{ href: "/settings", label: "Settings", icon: Settings }] as const;
