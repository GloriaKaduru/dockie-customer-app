import { Skeleton } from "@/components/ui/skeleton";

// Loading skeletons that roughly match final layouts (PRD §17).

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-2">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border">
      <div className="border-b p-3">
        <Skeleton className="h-4 w-1/3" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b p-3 last:border-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid gap-4 rounded-xl border p-5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

/** Shipments landing: header, three summary cards, tabs, then rows. */
export function ShipmentsSkeleton() {
  return (
    <div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border p-3 sm:p-4">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="mt-4 rounded-xl border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
            <Skeleton className="h-9 w-10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="hidden h-4 w-28 sm:block" />
            <Skeleton className="hidden h-4 w-16 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
