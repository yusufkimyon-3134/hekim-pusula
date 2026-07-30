import { getLlmAdapter } from "@/lib/ai/adapters/get-llm-adapter";
import { buildComparisonPrompt } from "@/lib/ai/prompts/comparison-prompt";
import {
  AiNotConfiguredError,
  InsufficientDataError,
  type ComparisonSummaryResult,
} from "@/lib/ai/types";
import type { ClinicStats } from "@/types";

const MIN_REVIEWS_FOR_COMPARISON = 3;

function parseJsonResponse(raw: string): ComparisonSummaryResult | null {
  try {
    const cleaned = raw.trim().replace(/^```json\s*|```$/g, "");
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.narrative === "string") {
      return { narrative: parsed.narrative };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * @throws {InsufficientDataError} kliniklerden biri (ya da ikisi) yeterli veriye sahip değilse
 * @throws {AiNotConfiguredError} ANTHROPIC_API_KEY tanımlı değilse
 */
export async function generateComparisonSummary(
  clinicALabel: string,
  statsA: ClinicStats,
  clinicBLabel: string,
  statsB: ClinicStats
): Promise<ComparisonSummaryResult> {
  if (
    statsA.reviewCount < MIN_REVIEWS_FOR_COMPARISON ||
    statsB.reviewCount < MIN_REVIEWS_FOR_COMPARISON
  ) {
    throw new InsufficientDataError(
      `Karşılaştırma özeti için her iki klinikte de en az ${MIN_REVIEWS_FOR_COMPARISON} değerlendirme gerekiyor.`
    );
  }

  const adapter = getLlmAdapter();
  if (!adapter) {
    throw new AiNotConfiguredError();
  }

  const { system, prompt } = buildComparisonPrompt(clinicALabel, statsA, clinicBLabel, statsB);
  const raw = await adapter.complete({ system, prompt, maxTokens: 400 });

  const parsed = parseJsonResponse(raw);
  if (!parsed) {
    throw new Error("AI yanıtı beklenen biçimde değildi.");
  }
  return parsed;
}
