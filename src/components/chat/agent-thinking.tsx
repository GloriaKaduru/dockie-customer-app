"use client";

import { useEffect, useState } from "react";
import { ThinkingOrb, type OrbState } from "@/components/effects";

// While Dockie works, the orb moves through the stages of an answer.
const STAGES: { orb: OrbState; label: string }[] = [
  { orb: "listening", label: "Reading your question" },
  { orb: "searching", label: "Searching your shipments" },
  { orb: "connecting", label: "Checking documents and payments" },
  { orb: "composing", label: "Writing a reply" },
];
const STAGE_MS = 650;

/** The agent's "thinking" row: an animated orb plus a shimmering stage label. */
export function AgentThinking() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), STAGE_MS);
    return () => clearInterval(t);
  }, []);

  const { orb, label } = STAGES[stage];
  return (
    <div className="flex items-center gap-3" role="status" aria-live="polite">
      <ThinkingOrb state={orb} size={32} aria-hidden />
      <span key={label} className="shimmer-label text-sm">
        {label}…
      </span>
    </div>
  );
}
