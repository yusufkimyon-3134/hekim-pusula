import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic-adapter";
import type { LlmAdapter } from "@/lib/ai/types";

/**
 * Production AI provider selection.
 *
 * Hekim Pusula uses the direct Anthropic Messages API. The API key is a
 * server-only Vercel secret and is never exposed to client-side code.
 */
export function getLlmAdapter(): LlmAdapter | null {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (anthropicApiKey) {
    console.info("[ai-config] provider=anthropic-direct", {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    });
    return new AnthropicAdapter(anthropicApiKey);
  }

  console.error("[ai-config] provider=unavailable; ANTHROPIC_API_KEY missing", {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    hasAnthropicApiKey: false,
  });
  return null;
}
