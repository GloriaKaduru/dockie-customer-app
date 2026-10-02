"use client";

import { ArrowUp, AtSign, Check, ChevronDown, Mic, Plus, Slash, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BorderBeam, useMicrophone, VoiceBeam } from "@/components/effects";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Voice = "idle" | "listening" | "transcribing";

const MODELS = [
  { id: "auto", label: "Auto", hint: "Picks the right depth for the question" },
  { id: "fast", label: "Fast", hint: "Quick answers from your workspace" },
  { id: "thorough", label: "Thorough", hint: "Checks every shipment, document and payment" },
];
const RADIUS = 16;

/**
 * Obvious-style composer: a raised card with the prompt on top and a tool row beneath.
 * - A border beam rides the edge while the pointer is over the box.
 * - Voice mode wraps the box in a glow that follows the microphone level, then sweeps
 *   while the recording is transcribed into the box for review before sending.
 */
export function ChatComposer({
  onSend,
  transcript,
  disabled,
  placeholder = "What should we work on?",
  className,
}: {
  onSend: (text: string) => void;
  /** Stand-in speech-to-text: returns what the user "said". */
  transcript: () => string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [hovered, setHovered] = useState(false);
  const [voice, setVoice] = useState<Voice>("idle");
  const [seconds, setSeconds] = useState(0);
  const [model, setModel] = useState("auto");
  const mic = useMicrophone();
  const input = useRef<HTMLTextAreaElement>(null);

  // Grow the textarea with its content, up to a cap.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    if (voice !== "listening") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [voice]);

  // Leaving voice mode re-mounts the textarea; put the caret back in it for review.
  const wasVoice = useRef(false);
  useEffect(() => {
    if (voice === "idle" && wasVoice.current) input.current?.focus();
    wasVoice.current = voice !== "idle";
  }, [voice]);

  const canSend = !!value.trim() && voice === "idle" && !disabled;

  function submit() {
    if (!canSend) return;
    onSend(value);
    setValue("");
  }

  function insert(token: string) {
    setValue((v) => (v && !v.endsWith(" ") ? `${v} ${token}` : `${v}${token}`));
    input.current?.focus();
  }

  async function startVoice() {
    setSeconds(0);
    setVoice("listening");
    const stream = await mic.start();
    if (!stream) toast("Microphone unavailable", { description: "Showing a simulated voice level instead." });
  }

  function stopVoice(keep: boolean) {
    mic.stop();
    if (!keep) return setVoice("idle");
    setVoice("transcribing");
    setTimeout(() => {
      setValue(transcript());
      setVoice("idle");
    }, 1400);
  }

  const listening = voice === "listening";
  const live = listening && !!mic.stream;

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <BorderBeam active={hovered && voice === "idle"} borderRadius={RADIUS} className="w-full">
        <VoiceBeam
          active={voice !== "idle"}
          stream={live ? mic.stream : null}
          // No mic stream (denied / unsupported): breathe with a gentle synthetic level.
          level={listening && !live ? () => 0.35 + 0.25 * Math.sin(Date.now() / 180) * Math.sin(Date.now() / 470) : undefined}
          processing={voice === "transcribing"}
          borderRadius={RADIUS}
          className="w-full"
        >
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => voice === "idle" && input.current?.focus()}
            className="flex cursor-text flex-col gap-2 rounded-2xl border bg-card p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)]"
          >
            {voice === "idle" ? (
              <textarea
                ref={input}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder={placeholder}
                aria-label="Message Dockie"
                className="max-h-[200px] min-h-10 w-full resize-none bg-transparent px-1 pt-1 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
              />
            ) : (
              <p className="flex min-h-10 items-center gap-2 px-1 pt-1 text-[15px] text-muted-foreground" aria-live="polite">
                {listening ? (
                  <>
                    <span className="size-2 animate-pulse rounded-full bg-destructive" />
                    Listening… <span className="font-mono text-xs tabular-nums">0:{String(seconds).padStart(2, "0")}</span>
                  </>
                ) : (
                  <span className="shimmer-label">Transcribing…</span>
                )}
              </p>
            )}

            <div className="flex items-center gap-1">
              {voice === "idle" ? (
                <>
                  <ToolButton label="Attach files" onClick={() => toast("Attachments are coming soon")}>
                    <Plus />
                  </ToolButton>
                  <ToolButton label="Mention a shipment" onClick={() => insert("@")}>
                    <AtSign />
                  </ToolButton>
                  <ToolButton label="Voice input" onClick={startVoice}>
                    <Mic />
                  </ToolButton>
                  <ToolButton label="Commands" onClick={() => insert("/")}>
                    <Slash />
                  </ToolButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="ml-auto gap-1 font-normal text-muted-foreground">
                        {MODELS.find((m) => m.id === model)?.label}
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuRadioGroup value={model} onValueChange={setModel}>
                        {MODELS.map((m) => (
                          <DropdownMenuRadioItem key={m.id} value={m.id} className="flex-col items-start gap-0">
                            <span>{m.label}</span>
                            <span className="text-xs text-muted-foreground">{m.hint}</span>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button type="submit" size="icon-sm" disabled={!canSend} className="rounded-full disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100" aria-label="Send">
                    <ArrowUp />
                  </Button>
                </>
              ) : (
                <>
                  <span className="px-1 text-xs text-muted-foreground">{listening ? "Speak naturally — I'll fill in the message for you to check." : "Turning your voice into text…"}</span>
                  <div className="ml-auto flex gap-1">
                    <ToolButton label="Cancel voice input" onClick={() => stopVoice(false)} disabled={!listening}>
                      <X />
                    </ToolButton>
                    <Button type="button" size="icon-sm" className="rounded-full" onClick={() => stopVoice(true)} disabled={!listening} aria-label="Finish speaking">
                      <Check />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </VoiceBeam>
      </BorderBeam>
    </form>
  );
}

function ToolButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" className="text-muted-foreground" onClick={onClick} disabled={disabled} aria-label={label}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
