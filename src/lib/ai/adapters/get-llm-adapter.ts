import { generateText } from "ai";
import type { LlmAdapter, LlmCompletionRequest } from "@/lib/ai/types";

class VercelAiGatewayAdapter implements LlmAdapter {
  async complete({ system, prompt, maxTokens = 1024 }: LlmCompletionRequest): Promise<string> {
    const result = await generateText({
      model: "anthropic/claude-sonnet-4.5",
      system,
      prompt,
      maxOutputTokens: maxTokens,
    });
    return result.text;
  }
}

/**
 * On Vercel, AI SDK uses AI Gateway automatically. Vercel deployments can
 * authenticate to the gateway using the platform-provided OIDC identity, so
 * the app does not need to read ANTHROPIC_API_KEY at runtime.
 */
export function getLlmAdapter(): LlmAdapter {
  console.info("[ai-config] provider=vercel-ai-gateway", {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN),
  });
  return new VercelAiGatewayAdapter();
}
