"use client";

/*
  Libraries.dev effects (MIT): border-beam, thinking-orbs, voice-glow.
  The packages ship without "use client", and BorderBeam / VoiceBeam default to
  their dark palette with an `auto` mode that follows the OS, not our next-themes
  class. These wrappers mark them client-side and pin the palette to the app theme
  unless a `theme` prop is passed explicitly.
*/

import { useTheme } from "next-themes";
import { BorderBeam as BaseBorderBeam, type BorderBeamProps } from "border-beam";
import { VoiceBeam as BaseVoiceBeam, type VoiceBeamProps } from "voice-glow";

export { ThinkingOrb, type ThinkingOrbProps, type OrbState } from "thinking-orbs";
export { useMicrophone } from "voice-glow";

function useAppTheme(): "light" | "dark" {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "dark" : "light";
}

export function BorderBeam(props: BorderBeamProps) {
  const theme = useAppTheme();
  return <BaseBorderBeam theme={theme} {...props} />;
}

export function VoiceBeam(props: VoiceBeamProps) {
  const theme = useAppTheme();
  return <BaseVoiceBeam theme={theme} {...props} />;
}
