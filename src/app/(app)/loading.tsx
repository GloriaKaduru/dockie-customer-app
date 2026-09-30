import { CardsSkeleton, PageHeaderSkeleton, TableSkeleton } from "@/components/app/skeletons";

// Shown while any workspace page loads — never a blank screen (PRD §17).
export default function Loading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardsSkeleton />
      <TableSkeleton />
    </div>
  );
}
