import { getLlmAdapter } from "@/lib/ai/adapters/get-llm-adapter";
import { buildClinicSummaryPrompt } from "@/lib/ai/prompts/clinic-summary-prompt";
import { InsufficientDataError, type ClinicSummaryResult } from "@/lib/ai/types";
import type { ReviewWithScores } from "@/types";

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

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function scoreLabel(score: number): string {
  if (score >= 4) return "güçlü";
  if (score >= 3) return "orta";
  return "zayıf";
}

function buildLocalSummary(reviews: ReviewWithScores[]): ClinicSummaryResult {
  const metrics = [
    ["ekip/meslektaş ortamı", average(reviews.map((r) => r.colleagueScore))],
    ["eğitim", average(reviews.map((r) => r.educationScore))],
    ["akademik ortam", average(reviews.map((r) => r.academicScore))],
    ["yönetim", average(reviews.map((r) => r.managementScore))],
    ["teşvik", average(reviews.map((r) => r.incentiveScore))],
    ["şehir", average(reviews.map((r) => r.cityScore))],
  ] as const;

  const sorted = [...metrics].sort((a, b) => b[1] - a[1]);
  const strongest = sorted.slice(0, 2);
  const weakest = sorted.slice(-2).reverse();
  const avgShifts = average(reviews.map((r) => r.monthlyShifts));
  const avgDailyPatients = average(reviews.map((r) => r.dailyPatients));
  const recommendPct = Math.round(
    (reviews.filter((r) => r.wouldChooseAgain).length / reviews.length) * 100
  );

  const strengths = `Değerlendirmelerde en olumlu başlıklar ${strongest
    .map(([name, score]) => `${name} (${score.toFixed(1)}/5, ${scoreLabel(score)})`)
    .join(" ve ")} olarak öne çıkıyor.`;

  const weaknesses = `Görece daha düşük puanlanan alanlar ${weakest
    .map(([name, score]) => `${name} (${score.toFixed(1)}/5)`)
    .join(" ve ")}. Ortalama aylık nöbet ${avgShifts.toFixed(1)}, günlük hasta sayısı yaklaşık ${avgDailyPatients.toFixed(0)}.`;

  const recommendation = `Hekimlerin %${recommendPct}'i kliniği yeniden tercih edeceğini belirtiyor. Bu sonuç ${reviews.length} doğrulanmış değerlendirmeye dayanıyor; tercih öncesinde nöbet yükü, eğitim beklentisi ve yönetim puanlarını birlikte değerlendirmek uygun olur.`;

  return { strengths, weaknesses, recommendation, basedOnReviewCount: reviews.length };
}

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
    return buildLocalSummary(reviews);
  }

  try {
    const { system, prompt } = buildClinicSummaryPrompt(reviews);
    const raw = await adapter.complete({ system, prompt, maxTokens: 600 });
    const parsed = parseJsonResponse(raw);
    return parsed
      ? { ...parsed, basedOnReviewCount: reviews.length }
      : buildLocalSummary(reviews);
  } catch (error) {
    console.error("[clinic-ai-summary] LLM failed; using local summary", error);
    return buildLocalSummary(reviews);
  }
}
