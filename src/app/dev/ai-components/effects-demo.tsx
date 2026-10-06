"use client";

import { useState } from "react";
import { BorderBeam, ThinkingOrb, VoiceBeam, useMicrophone, type OrbState } from "@/components/effects";
import { Button } from "@/components/ui/button";

const ORB_STATES: OrbState[] = ["working", "searching", "solving", "listening", "connecting", "weaving", "composing", "breathing", "shaping"];

export function BorderBeamDemo() {
  return (
    <div className="flex flex-col items-center gap-6">
      <BorderBeam>
        <div className="w-72 rounded-2xl border bg-card p-5 text-sm">
          <p className="font-medium">Quote ready</p>
          <p className="text-muted-foreground">Toyota Hilux · Mombasa → Kampala</p>
        </div>
      </BorderBeam>
      <BorderBeam size="sm">
        <Button className="rounded-lg">Book shipment</Button>
      </BorderBeam>
      <BorderBeam size="line" colorVariant="ocean">
        <input className="h-10 w-72 rounded-lg border bg-background px-3 text-sm" placeholder="Ask Dockie anything…" />
      </BorderBeam>
    </div>
  );
}

export function ThinkingOrbsDemo() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {ORB_STATES.map((state) => (
        <div key={state} className="flex flex-col items-center gap-2">
          <ThinkingOrb state={state} size={64} />
          <span className="text-xs text-muted-foreground">{state}</span>
        </div>
      ))}
    </div>
  );
}

export function VoiceDemo() {
  const mic = useMicrophone();
  const [processing, setProcessing] = useState(false);
  const live = mic.state === "live";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <VoiceBeam stream={mic.stream} processing={processing} className="w-full">
        <div className="flex h-12 w-full items-center rounded-xl border bg-background px-4 text-sm text-muted-foreground">
          {live ? "Listening…" : processing ? "Thinking…" : "Tap the mic and speak"}
        </div>
      </VoiceBeam>
      <div className="flex gap-2">
        <Button variant={live ? "secondary" : "default"} onClick={() => (live ? mic.stop() : mic.start())}>
          {live ? "Stop mic" : "Start mic"}
        </Button>
        <Button variant="outline" onClick={() => setProcessing((p) => !p)}>
          {processing ? "Stop processing" : "Simulate processing"}
        </Button>
      </div>
      {mic.state === "denied" && <p className="text-xs text-destructive">Microphone access was blocked.</p>}
    </div>
  );
}
