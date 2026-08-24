import { getLlmAdapter } from "@/lib/ai/adapters/get-llm-adapter";
import { buildClinicSummaryPrompt } from "@/lib/ai/prompts/clinic-summary-prompt";
import {
  AiNotConfiguredError,
  InsufficientDataError,
  type ClinicSummaryResult,
} from "@/lib/ai/types";
import type { ReviewWithScores } from "@/types";

/**
 * Anlamlı bir klinik özeti için gereken asgari onaylı değerlendirme sayısı.
 * Özet yalnızca serbest metin yorumlarına değil; puanlar, nöbet sayısı ve
 * tekrar tercih etme yanıtı gibi yapılandırılmış değerlendirme alanlarına da
 * dayanır. Bu nedenle yorum metni boş olan onaylı değerlendirmeler de hesaba
 * katılır.
 */
const MIN_REVIEWS_FOR_SUMMARY = 3;

function parseJsonResponse(raw: string): ClinicSummaryResult | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.strengths === "string" &&
      typeof parsed.weaknesses === "string" &&
      typeof parsed.recommendation === "string"
    ) {
      return { ...parsed, basedOnReviewCount: 0 };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * @throws {InsufficientDataError} yeterli onaylı değerlendirme yoksa
 * @throws {AiNotConfiguredError} ANTHROPIC_API_KEY tanımlı değilse
 */
export async function generateClinicSummary(
  reviews: ReviewWithScores[]
): Promise<ClinicSummaryResult> {
  if (reviews.length < MIN_REVIEWS_FOR_SUMMARY) {
    throw new InsufficientDataError(
      `AI özeti için en az ${MIN_REVIEWS_FOR_SUMMARY} onaylı değerlendirme gerekiyor (şu an ${reviews.length}).`
    );
  }

  const adapter = getLlmAdapter();
  if (!adapter) {
    throw new AiNotConfiguredError();
  }

  const { system, prompt } = buildClinicSummaryPrompt(reviews);
  const raw = await adapter.complete({ system, prompt, maxTokens: 600 });

  const parsed = parseJsonResponse(raw);
  if (!parsed) {
    throw new Error("AI yanıtı beklenen biçimde değildi.");
  }

  return { ...parsed, basedOnReviewCount: reviews.length };
}
