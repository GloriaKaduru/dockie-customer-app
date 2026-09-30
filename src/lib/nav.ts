import { BarChart3, CreditCard, FileText, Home, MapPin, MessagesSquare, Package, type LucideIcon } from "lucide-react";

// Sidebar navigation (PRD §0). To add a module: create src/app/(app)/<name>/page.tsx and add it here.
export const mainNav: { href: string; label: string; icon: LucideIcon; badge?: "chats" | "documents" | "issues" }[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/chats", label: "Chats", icon: MessagesSquare, badge: "chats" },
  { href: "/shipments", label: "Shipments", icon: Package, badge: "issues" },
  { href: "/tracking", label: "Tracking", icon: MapPin },
  { href: "/documents", label: "Documents", icon: FileText, badge: "documents" },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];
