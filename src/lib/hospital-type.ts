import type { HospitalType } from "@/types";

/**
 * Hastane türü enum değerlerinin Türkçe görünen adları. Filtre
 * dropdown'ı ve hastane detay sayfası aynı kaynağı kullanır — iki
 * yerde aynı eşlemeyi tekrar yazmak yerine.
 */
export const HOSPITAL_TYPE_LABELS: Record<HospitalType, string> = {
  state_hospital: "Devlet Hastanesi",
  training_and_research_hospital: "Eğitim ve Araştırma Hastanesi",
  city_hospital: "Şehir Hastanesi",
  university_hospital: "Üniversite Hastanesi",
};

export const HOSPITAL_TYPE_OPTIONS: { value: HospitalType; label: string }[] =
  (Object.entries(HOSPITAL_TYPE_LABELS) as [HospitalType, string][]).map(
    ([value, label]) => ({ value, label })
  );

export function isHospitalType(value: string): value is HospitalType {
  return value in HOSPITAL_TYPE_LABELS;
}
