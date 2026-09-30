"use client";

import { Building2, ChevronsUpDown, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { chats, organization } from "@/lib/data";
import { mainNav } from "@/lib/nav";
import { useAttention } from "./workspace-provider";
import { DockieMark } from "./logo";

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const { issues, missingTitles } = useAttention();
  const badges = { chats: chats.filter((c) => c.unread).length, documents: missingTitles.length, issues: issues.length };
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Dockie">
              <Link href="/home" onClick={() => setOpenMobile(false)}>
                <DockieMark />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Dockie</span>
                  <span className="truncate text-xs text-muted-foreground">{organization.name}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(({ href, label, icon: Icon, badge }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={isActive(href)} tooltip={label}>
                    <Link href={href} onClick={() => setOpenMobile(false)}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {badge && badges[badge] > 0 && <SidebarMenuBadge>{badges[badge]}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Organization settings">
              <Link href="/settings" onClick={() => setOpenMobile(false)}>
                <Building2 />
                <span>Organization</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/profile")} tooltip="Profile">
              <Link href="/profile" onClick={() => setOpenMobile(false)}>
                <Settings />
                <span>Profile & preferences</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
