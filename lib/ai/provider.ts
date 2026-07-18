import "server-only";
import type { ResearchInput, ResearchOutput } from "@/lib/ai/schemas";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { GeminiProvider } from "@/lib/ai/providers/gemini";

// Provider-agnostic contract (PRD §4.5) — calling code only ever depends on this interface, never
// on a concrete SDK, so swapping/adding a provider never touches lib/catalog-pipeline or the
// server actions that call it.
export interface AiProvider {
  research(input: ResearchInput): Promise<ResearchOutput>;
}

const PROVIDERS: Record<string, () => AiProvider> = {
  gemini: () => new GeminiProvider(),
  anthropic: () => new AnthropicProvider(),
};

// Default is "gemini" (owner decision: free-tier Gemini Flash, no Anthropic key in use) — override
// per-call or via AI_PROVIDER env var.
export function getAiProvider(name: string = process.env.AI_PROVIDER || "gemini"): AiProvider {
  const factory = PROVIDERS[name];
  if (!factory) {
    throw new Error(`AI_PROVIDER "${name}" tidak dikenal. Provider terdaftar: ${Object.keys(PROVIDERS).join(", ")}`);
  }
  return factory();
}
