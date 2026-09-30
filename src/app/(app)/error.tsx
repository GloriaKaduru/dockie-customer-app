"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/app/states";

// Contextual error for any workspace page (PRD §18). Next.js passes `retry` in this version.
export default function WorkspaceError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="py-16">
      <ErrorState what="information for this page" onRetry={retry} />
    </div>
  );
}
