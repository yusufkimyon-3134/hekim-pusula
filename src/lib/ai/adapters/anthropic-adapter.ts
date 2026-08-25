import type { LlmAdapter, LlmCompletionRequest } from "@/lib/ai/types";

/**
 * Direct Anthropic Messages API adapter.
 * The API key is read server-side by getLlmAdapter and is never exposed to the client.
 */
export class AnthropicAdapter implements LlmAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "claude-sonnet-5"
  ) {}

  async complete({ system, prompt, maxTokens = 1024 }: LlmCompletionRequest): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[anthropic] request failed", {
        status: response.status,
        model: this.model,
        body: body.slice(0, 1000),
      });
      throw new Error(`Anthropic API hatası (${response.status}).`);
    }

    const data = await response.json();
    const textBlock = (data.content ?? []).find(
      (block: { type: string; text?: string }) => block.type === "text"
    );

    if (!textBlock?.text) {
      console.error("[anthropic] response did not contain a text block", {
        model: this.model,
      });
      throw new Error("Anthropic yanıtında metin bloğu bulunamadı.");
    }

    return textBlock.text;
  }
}
