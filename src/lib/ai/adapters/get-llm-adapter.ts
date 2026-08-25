import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic-adapter";
import { VercelAiGatewayAdapter } from "@/lib/ai/adapters/vercel-ai-gateway-adapter";
import type { LlmAdapter } from "@/lib/ai/types";

/**
 * Provider selection order:
 * 1. Direct Anthropic key, when explicitly configured.
 * 2. Vercel AI Gateway. Production deployments receive VERCEL_OIDC_TOKEN
 *    automatically; AI_GATEWAY_API_KEY is also supported for other runtimes.
 * 3. null, allowing the service layer to surface an unavailable state.
 *
 * This commit intentionally forces a fresh production deployment after the
 * Production secret was re-saved in Vercel, so the new function snapshot picks
 * up the latest environment configuration.
 */
export function getLlmAdapter(): LlmAdapter | null {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const aiGatewayApiKey = process.env.AI_GATEWAY_API_KEY?.trim();
  const vercelOidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

  if (anthropicApiKey) {
    console.info("[ai-config] provider=anthropic-direct", {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    });
    return new AnthropicAdapter(anthropicApiKey);
  }

  if (aiGatewayApiKey) {
    console.info("[ai-config] provider=vercel-ai-gateway api-key", {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    });
    return new VercelAiGatewayAdapter(aiGatewayApiKey);
  }

  if (vercelOidcToken) {
    console.info("[ai-config] provider=vercel-ai-gateway oidc", {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    });
    return new VercelAiGatewayAdapter(vercelOidcToken);
  }

  console.error("[ai-config] provider=local-fallback; no AI credentials available", {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    hasAnthropicApiKey: false,
    hasAiGatewayApiKey: false,
    hasVercelOidcToken: false,
  });
  return null;
}
