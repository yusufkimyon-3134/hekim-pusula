import type { ClinicStats } from "@/types";

const SYSTEM_PROMPT = `Sen Hekim Pusula platformunda iki kliniğin istatistiklerini karşılaştıran bir asistansın.

KESİN KURALLAR:
- Yalnızca sana verilen sayısal istatistikleri kullan.
- Kliniklerin isimleri/hastaneleri hakkında dışarıdan hiçbir bilgi ekleme.
- Verilmeyen hiçbir sayı veya iddia UYDURMA.
- "Eğer önceliğin X ise, Y daha uygun olabilir" tarzında, kullanıcının kendi karar vermesine yardımcı olan bir dil kullan — kesin bir "şurası daha iyi" hükmü verme.
- Yanıtını YALNIZCA şu JSON şeklinde ver: {"narrative": "..."}
2-4 cümle, Türkçe, nötr bir dille.`;

function formatClinicStats(label: string, stats: ClinicStats): string {
  return [
    `${label}:`,
    `- Değerlendirme sayısı: ${stats.reviewCount}`,
    `- Genel puan: ${stats.avgOverallScore?.toFixed(1) ?? "veri yok"}`,
    `- Eğitim: ${stats.avgEducationScore?.toFixed(1) ?? "veri yok"}`,
    `- Akademik fırsatlar: ${stats.avgAcademicScore?.toFixed(1) ?? "veri yok"}`,
    `- Finansal memnuniyet: ${stats.avgIncentiveScore?.toFixed(1) ?? "veri yok"}`,
    `- Sosyal ortam: ${stats.avgColleagueScore?.toFixed(1) ?? "veri yok"}`,
    `- Yönetim desteği: ${stats.avgManagementScore?.toFixed(1) ?? "veri yok"}`,
    `- Ortalama aylık nöbet: ${stats.avgMonthlyShifts?.toFixed(1) ?? "veri yok"}`,
    `- Öneri oranı: ${stats.recommendPercentage?.toFixed(0) ?? "veri yok"}%`,
  ].join("\n");
}

export function buildComparisonPrompt(
  clinicALabel: string,
  statsA: ClinicStats,
  clinicBLabel: string,
  statsB: ClinicStats
): { system: string; prompt: string } {
  const prompt = `İki kliniğin istatistiklerini karşılaştır:\n\n${formatClinicStats(
    clinicALabel,
    statsA
  )}\n\n${formatClinicStats(clinicBLabel, statsB)}`;

  return { system: SYSTEM_PROMPT, prompt };
}
