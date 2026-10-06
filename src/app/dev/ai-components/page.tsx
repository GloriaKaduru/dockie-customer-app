import ChatComposer from "@/components/primitives/ChatComposer";
import ContextCards from "@/components/primitives/ContextCards";
import LoadingState from "@/components/primitives/LoadingState";
import PromptBar from "@/components/primitives/PromptBar";
import RecommendationCard from "@/components/primitives/RecommendationCard";
import StreamingText from "@/components/primitives/StreamingText";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
import { BorderBeamDemo, ThinkingOrbsDemo, VoiceDemo } from "./effects-demo";

// Scratch gallery for the Beautiful UI primitives (demo data) and the Libraries.dev effects.
const ITEMS = [
  { name: "Border Beam", node: <BorderBeamDemo /> },
  { name: "Thinking Orbs", node: <ThinkingOrbsDemo /> },
  { name: "Voice", node: <VoiceDemo /> },
  { name: "Loading State", node: <LoadingState /> },
  { name: "Thinking", node: <ThinkingState /> },
  { name: "Streaming Text", node: <StreamingText /> },
  { name: "Tool Chips", node: <ToolChips /> },
  { name: "Chat", node: <ChatComposer /> },
  { name: "Prompt Bar", node: <PromptBar /> },
  { name: "Context Cards", node: <ContextCards /> },
  { name: "Recommendation Card", node: <RecommendationCard /> },
];

export default function AiComponentsPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-10 px-4 py-10">
      {ITEMS.map(({ name, node }) => (
        <section key={name} className="grid gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">{name}</h2>
          <div className="flex justify-center rounded-xl border bg-canvas p-6">{node}</div>
        </section>
      ))}
    </main>
  );
}
