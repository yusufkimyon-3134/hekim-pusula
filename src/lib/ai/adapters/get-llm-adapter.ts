import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic-adapter";
import type { LlmAdapter } from "@/lib/ai/types";

/**
 * Production provider selection.
 * Prefer the server-only Anthropic key so clinic summaries do not depend on
 * Vercel AI Gateway billing or OIDC configuration.
 */
export function getLlmAdapter(): LlmAdapter {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!anthropicApiKey) {
    console.error("[ai-config] ANTHROPIC_API_KEY missing", {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    });
    throw new Error("ANTHROPIC_API_KEY is not available to the server runtime.");
  }

  console.info("[ai-config] provider=anthropic-direct", {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
  });

  return new AnthropicAdapter(anthropicApiKey);
}
