"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav, secondaryNav } from "@/lib/nav";
import { currentUser } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

// Pick the most specific nav item that matches the URL, so /shipments/new
// highlights "Get a quote" rather than "Shipments".
function activeHref(pathname: string) {
  const all = [...mainNav, ...secondaryNav].map((i) => i.href as string);
  return all
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = activeHref(pathname);

  const item = ({ href, label, icon: Icon }: (typeof mainNav)[number] | (typeof secondaryNav)[number]) => (
    <Link
      key={href}
      href={href}
      onClick={onNavigate}
      aria-current={active === href ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active === href ? "bg-brand-soft text-brand" : "text-muted hover:bg-subtle hover:text-ink",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </Link>
  );

  return (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Main">
      <div className="px-3 pt-2 pb-5">
        <Logo />
      </div>
      {mainNav.map(item)}
      <div className="mt-auto flex flex-col gap-1">
        {secondaryNav.map(item)}
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">
            {currentUser.initials}
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">{currentUser.name}</p>
            <p className="truncate text-xs text-muted">{currentUser.company}</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
