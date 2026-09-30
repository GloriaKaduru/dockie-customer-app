// No "use client": these render on the server or the client depending on who imports them.
import { AlertCircle, Clock, Lock, RotateCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateTime } from "@/lib/format";

/** Every module's empty state: icon, explanation, primary action, optional secondary (PRD §15). */
export function EmptyState({ icon: Icon, title, description, children, className }: { icon: LucideIcon; title: string; description: string; children?: ReactNode; className?: string }) {
  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children && <EmptyContent className="flex-row flex-wrap justify-center">{children}</EmptyContent>}
    </Empty>
  );
}

/** Contextual error (PRD §18) with optional cached timestamp. */
export function ErrorState({ what, lastUpdated, onRetry }: { what: string; lastUpdated?: string; onRetry?: () => void }) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle />
        </EmptyMedia>
        <EmptyTitle>We couldn&apos;t load the latest {what}.</EmptyTitle>
        {lastUpdated && <EmptyDescription>Last available update: {formatDateTime(lastUpdated)}.</EmptyDescription>}
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            <RotateCw /> Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

/** Stale data banner (PRD §31). */
export function StaleNotice({ updatedAt, what = "This information" }: { updatedAt: string; what?: string }) {
  return (
    <Alert>
      <Clock />
      <AlertTitle>{what} may be out of date</AlertTitle>
      <AlertDescription>Last update received {formatDateTime(updatedAt)}. We&apos;ll refresh it as soon as the port or carrier reports again.</AlertDescription>
    </Alert>
  );
}

/** Permission-restricted action: keep it visible, explain why it's unavailable (PRD §19). */
export function Restricted({ allowed, reason = "You don't have permission to do this. Contact your organization admin.", children }: { allowed: boolean; reason?: string; children: ReactNode }) {
  if (allowed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="inline-flex cursor-not-allowed [&>*]:pointer-events-none [&>*]:opacity-50">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        <Lock className="mr-1 inline size-3" />
        {reason}
      </TooltipContent>
    </Tooltip>
  );
}
