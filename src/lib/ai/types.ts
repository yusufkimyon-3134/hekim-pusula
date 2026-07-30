/**
 * AI servis katmanının paylaşılan tipleri. Bkz. `src/lib/ai/README.md`
 * mimari genel bakış için.
 */

export interface LlmCompletionRequest {
  /** Modelin rolünü/kısıtlarını tanımlayan sistem talimatı. */
  system: string;
  /** Kullanıcı/veri içeriği. */
  prompt: string;
  maxTokens?: number;
}

/**
 * Tüm LLM sağlayıcılarının uyması gereken arayüz. Yeni bir sağlayıcı
 * (OpenAI, Gemini, vb.) eklemek yalnızca bu arayüzü uygulayan yeni bir
 * adapter yazmak demektir — servis katmanı hiç değişmez.
 */
export interface LlmAdapter {
  complete(request: LlmCompletionRequest): Promise<string>;
}

/** AI servisi yapılandırılmamış (API anahtarı yok) olduğunda fırlatılır. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI servisi yapılandırılmamış (ANTHROPIC_API_KEY tanımlı değil).");
    this.name = "AiNotConfiguredError";
  }
}

/** Anlamlı bir özet üretmek için yeterli veri olmadığında fırlatılır. */
export class InsufficientDataError extends Error {
  constructor(message = "Bu analiz için yeterli veri yok.") {
    super(message);
    this.name = "InsufficientDataError";
  }
}

export interface ClinicSummaryResult {
  strengths: string;
  weaknesses: string;
  recommendation: string;
  /** Özetin kaç onaylı yoruma dayandığı — şeffaflık için UI'da gösterilir. */
  basedOnReviewCount: number;
}

export interface ComparisonSummaryResult {
  narrative: string;
}

export interface InsightCard {
  title: string;
  description: string;
}
