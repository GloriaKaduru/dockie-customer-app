"use client";

import { ArrowUp, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type VoiceState = "idle" | "recording" | "processing";

/**
 * Text + voice input (PRD §1.3, §5.4).
 * Voice: idle → recording → processing → transcription lands in the box for review/editing → send.
 */
export function Composer({
  onSend,
  transcript,
  placeholder = "Ask Dockie anything…",
  disabled,
  autoFocus,
  className,
}: {
  onSend: (text: string) => void;
  transcript: () => string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const [value, setValue] = useState("");
  const [voice, setVoice] = useState<VoiceState>("idle");
  const [seconds, setSeconds] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (voice !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [voice]);

  function submit() {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  function toggleVoice() {
    if (voice === "idle") {
      setSeconds(0);
      setVoice("recording");
    } else if (voice === "recording") {
      setVoice("processing");
      setTimeout(() => {
        setValue(transcript());
        setVoice("idle");
        ref.current?.focus();
      }, 900);
    }
  }

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <InputGroup className={cn(voice === "recording" && "ring-2 ring-destructive/30")}>
        <InputGroupTextarea
          ref={ref}
          value={voice === "recording" ? "" : value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={voice === "recording" ? `Listening… 0:${String(seconds).padStart(2, "0")}` : voice === "processing" ? "Transcribing…" : placeholder}
          rows={1}
          autoFocus={autoFocus}
          disabled={voice !== "idle"}
          className="max-h-40 min-h-10"
          aria-label="Message Dockie"
        />
        <InputGroupAddon align="inline-end" className="self-end pb-2">
          <InputGroupButton
            type="button"
            size="icon-sm"
            variant={voice === "recording" ? "destructive" : "ghost"}
            onClick={toggleVoice}
            disabled={voice === "processing"}
            aria-label={voice === "recording" ? "Stop recording" : "Speak"}
          >
            {voice === "processing" ? <Spinner /> : voice === "recording" ? <Square className="fill-current" /> : <Mic />}
          </InputGroupButton>
          <InputGroupButton type="submit" size="icon-sm" variant="default" disabled={!value.trim() || voice !== "idle" || disabled} aria-label="Send">
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
