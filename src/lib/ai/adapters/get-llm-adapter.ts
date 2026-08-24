import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic-adapter";
import type { LlmAdapter } from "@/lib/ai/types";

/**
 * Yapılandırılmış LLM adapter'ını döner.
 *
 * Anahtarı dinamik olarak runtime'da okuyoruz. Bu, serverless bundle/build
 * aşamasında doğrudan process.env.ANTHROPIC_API_KEY erişiminin yanlışlıkla
 * undefined olarak sabitlenmesini önler ve Vercel Production environment
 * değişkeninin fonksiyon çalışırken okunmasını sağlar.
 */
export function getLlmAdapter(): LlmAdapter | null {
  const raw = Reflect.get(process.env, "ANTHROPIC_API_KEY");
  const apiKey = typeof raw === "string" ? raw.trim() : "";

  if (!apiKey) {
    console.error("[ai-config] ANTHROPIC_API_KEY missing at runtime", {
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
      hasKeyProperty: Object.prototype.hasOwnProperty.call(
        process.env,
        "ANTHROPIC_API_KEY"
      ),
    });
    return null;
  }

  return new AnthropicAdapter(apiKey);
}
