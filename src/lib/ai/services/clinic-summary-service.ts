import { getLlmAdapter } from "@/lib/ai/adapters/get-llm-adapter";
import { buildClinicSummaryPrompt } from "@/lib/ai/prompts/clinic-summary-prompt";
import {
  AiNotConfiguredError,
  InsufficientDataError,
  type ClinicSummaryResult,
} from "@/lib/ai/types";
import type { ReviewWithScores } from "@/types";

/**
 * Anlamlı bir "hekimler tutarlı şekilde şunu söylüyor" özeti için
 * gereken asgari onaylı yorum sayısı. Bunun altında özet ÜRETİLMEZ —
 * tek bir yorumu "AI özeti" gibi sunmak yanıltıcı olurdu (AI Safety
 * ilkesi: "yetersiz veri açıkça belirtilmeli").
 */
const MIN_REVIEWS_FOR_SUMMARY = 3;

function parseJsonResponse(raw: string): ClinicSummaryResult | null {
  try {
    const cleaned = raw.trim().replace(/^```json\s*|```$/g, "");
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
 * @throws {InsufficientDataError} yeterli onaylı yorum yoksa
 * @throws {AiNotConfiguredError} ANTHROPIC_API_KEY tanımlı değilse
 */
export async function generateClinicSummary(
  reviews: ReviewWithScores[]
): Promise<ClinicSummaryResult> {
  const reviewsWithComments = reviews.filter((r) => r.comment && r.comment.trim().length > 0);

  if (reviewsWithComments.length < MIN_REVIEWS_FOR_SUMMARY) {
    throw new InsufficientDataError(
      `Bir özet oluşturmak için en az ${MIN_REVIEWS_FOR_SUMMARY} yorumlu değerlendirme gerekiyor (şu an ${reviewsWithComments.length}).`
    );
  }

  const adapter = getLlmAdapter();
  if (!adapter) {
    throw new AiNotConfiguredError();
  }

  const { system, prompt } = buildClinicSummaryPrompt(reviewsWithComments);
  const raw = await adapter.complete({ system, prompt, maxTokens: 600 });

  const parsed = parseJsonResponse(raw);
  if (!parsed) {
    throw new Error("AI yanıtı beklenen biçimde değildi.");
  }

  return { ...parsed, basedOnReviewCount: reviewsWithComments.length };
}
