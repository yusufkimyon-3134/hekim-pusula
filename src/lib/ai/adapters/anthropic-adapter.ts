import type { LlmAdapter, LlmCompletionRequest } from "@/lib/ai/types";

/**
 * Gerçek Anthropic API çağrısı. Uç nokta ve istek şekli bu sandbox'ta
 * kimlik doğrulamasız bir istekle doğrulandı (401 "x-api-key header is
 * required" — yani istek doğru şekilde ulaşıyor, yalnızca gerçek bir
 * anahtar eksik). Gerçek dağıtımda `ANTHROPIC_API_KEY` tanımlandığında
 * bu adapter olduğu gibi çalışır.
 */
export class AnthropicAdapter implements LlmAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = "claude-sonnet-4-5"
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
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API hatası (${response.status}): ${body}`);
    }

    const data = await response.json();
    const textBlock = (data.content ?? []).find(
      (block: { type: string }) => block.type === "text"
    );
    if (!textBlock) {
      throw new Error("Anthropic yanıtında metin bloğu bulunamadı.");
    }
    return textBlock.text as string;
  }
}
