import type { ClinicRanking, HospitalType } from "@/types";

/**
 * ÖNEMLİ TASARIM KARARI: "Uyum puanı" bir LLM'den İSTENMEDİ — bir LLM'in
 * bir uyum puanını "tahmin etmesi", tam da bu sprintte önlenmek istenen
 * türden bir uydurma (fabricated fact) olurdu. Bunun yerine, gerçek
 * klinik istatistiklerine (clinic_review_stats) karşı ağırlıklı,
 * tamamen açıklanabilir ve deterministik bir formülle hesaplanıyor.
 *
 * Yalnızca en az 1 onaylı yorumu olan klinikler eşleştirmeye dahil edilir
 * — hakkında hiçbir veri olmayan bir kliniği "öneri" olarak sunmak
 * yanıltıcı olurdu.
 */

export type CareerGoal = "academic" | "balanced" | "financial";

export interface CareerMatchInput {
  specialty: string;
  careerGoal: CareerGoal;
  /** 1-5: akademik/araştırma fırsatlarına ne kadar önem verdiği. */
  academicInterest: number;
  /** 1-5: yüksek iş yüküne toleransı (5 = yoğunluktan çekinmez). */
  workloadTolerance: number;
  /** 1-5: sık nöbete toleransı (5 = çok nöbeti dert etmez). */
  nightShiftTolerance: number;
  city?: string;
  hospitalType?: HospitalType;
}

export interface CareerMatchResult {
  clinic: ClinicRanking;
  compatibilityScore: number;
}

/** 1-5 arası iki değer arasındaki yakınlığı 0-1 aralığında bir uyum katsayısına çevirir. */
function closeness(a: number, b: number): number {
  return 1 - Math.abs(a - b) / 4;
}

/** Ham bir sayıyı (örn. aylık nöbet ya da hasta yükü) kabaca 1-5 "yoğunluk" ölçeğine çevirir. */
function intensityBucket(value: number, low: number, high: number): number {
  if (value <= low) return 1;
  if (value >= high) return 5;
  return 1 + ((value - low) / (high - low)) * 4;
}

function scoreClinic(input: CareerMatchInput, clinic: ClinicRanking): number {
  const academicClinicValue =
    ((clinic.avgEducationScore ?? 3) + (clinic.avgAcademicScore ?? 3)) / 2;
  const academicFit = closeness(input.academicInterest, academicClinicValue);

  const workloadIntensity = intensityBucket(clinic.avgWorkload ?? 60, 20, 200);
  const workloadFit = closeness(input.workloadTolerance, workloadIntensity);

  const nightShiftIntensity = intensityBucket(clinic.avgMonthlyShifts ?? 6, 3, 15);
  const nightShiftFit = closeness(input.nightShiftTolerance, nightShiftIntensity);

  const overallQuality = (clinic.avgOverallScore ?? 3) / 5;

  // Kariyer hedefine göre ağırlıklar — "academic" akademik uyuma,
  // "financial" genel kaliteye (döner sermaye buna dahil), "balanced"
  // hepsine eşit ağırlık verir.
  const weights =
    input.careerGoal === "academic"
      ? { academic: 0.45, workload: 0.15, nightShift: 0.15, quality: 0.25 }
      : input.careerGoal === "financial"
        ? { academic: 0.15, workload: 0.2, nightShift: 0.2, quality: 0.45 }
        : { academic: 0.25, workload: 0.25, nightShift: 0.25, quality: 0.25 };

  const raw =
    academicFit * weights.academic +
    workloadFit * weights.workload +
    nightShiftFit * weights.nightShift +
    overallQuality * weights.quality;

  return Math.round(raw * 100);
}

/**
 * Verilen tercihlere göre en uygun 5 kliniği döner (yalnızca en az 1
 * onaylı yorumu olan klinikler arasından). `candidates`,
 * `ClinicRepository.rankByBranch(specialty, "overall")` ile önceden
 * getirilmiş olmalı — bu servis yalnızca puanlama/sıralama yapar,
 * veritabanına erişmez (test edilebilirlik için ayrıştırıldı).
 */
export function matchCareerPreferences(
  input: CareerMatchInput,
  candidates: ClinicRanking[]
): CareerMatchResult[] {
  return candidates
    .filter((c) => c.reviewCount > 0)
    .filter((c) => !input.city || c.hospitalCity === input.city)
    .filter((c) => !input.hospitalType || c.hospitalType === input.hospitalType)
    .map((clinic) => ({ clinic, compatibilityScore: scoreClinic(input, clinic) }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
}
