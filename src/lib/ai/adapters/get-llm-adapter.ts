import { AnthropicAdapter } from "@/lib/ai/adapters/anthropic-adapter";
import type { LlmAdapter } from "@/lib/ai/types";

/**
 * Yapılandırılmış LLM adapter'ını döner, `ANTHROPIC_API_KEY` tanımlı
 * değilse `null` döner (throw etmez) — çağıran servisler bunu "AI şu an
 * kullanılamıyor" gibi zarif bir duruma çevirir (bkz. AI Safety ilkesi:
 * "yetersiz veri/durum açıkça belirtilmeli").
 *
 * Başka bir sağlayıcıya geçmek (örn. OpenAI) yalnızca burada yeni bir
 * `if` dalı eklemek ve o sağlayıcı için `LlmAdapter`'ı uygulayan yeni
 * bir adapter yazmak demektir — servis katmanı hiç değişmez.
 */
export function getLlmAdapter(): LlmAdapter | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new AnthropicAdapter(apiKey);
}
