import type { LlmAdapter, LlmCompletionRequest } from "@/lib/ai/types";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
}

/**
 * Vercel AI Gateway adapter.
 * Production deployments automatically receive VERCEL_OIDC_TOKEN, so this
 * adapter works without exposing or maintaining a provider API key.
 */
export class VercelAiGatewayAdapter implements LlmAdapter {
  constructor(private readonly token: string) {}

  async complete(request: LlmCompletionRequest): Promise<string> {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-5",
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.prompt },
        ],
        max_tokens: request.maxTokens ?? 600,
        temperature: 0.2,
      }),
      cache: "no-store",
    });

    const json = (await response.json()) as ChatCompletionResponse;
    if (!response.ok) {
      throw new Error(
        `Vercel AI Gateway isteği başarısız (${response.status}): ${json.error?.message ?? response.statusText}`
      );
    }

    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Vercel AI Gateway boş yanıt döndürdü.");
    return text;
  }
}
