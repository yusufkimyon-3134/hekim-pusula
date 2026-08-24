import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic-adapter";
import { VercelAiGatewayAdapter } from "@/lib/ai/adapters/vercel-ai-gateway-adapter";
import type { LlmAdapter } from "@/lib/ai/types";

/**
 * Provider selection order:
 * 1. Direct Anthropic key, when explicitly configured.
 * 2. Vercel AI Gateway. Production deployments receive VERCEL_OIDC_TOKEN
 *    automatically; AI_GATEWAY_API_KEY is also supported for other runtimes.
 * 3. null, allowing the service layer to use its deterministic local fallback.
 */
export function getLlmAdapter(): LlmAdapter | null {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicApiKey) return new AnthropicAdapter(anthropicApiKey);

  const gatewayToken =
    process.env.AI_GATEWAY_API_KEY?.trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim();

  if (gatewayToken) return new VercelAiGatewayAdapter(gatewayToken);

  console.error("[ai-config] No AI credentials available at runtime", {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
  });
  return null;
}
