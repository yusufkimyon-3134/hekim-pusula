import type { ReviewWithScores } from "@/types";

const SYSTEM_PROMPT = `Sen Hekim Pusula platformunda hekimlerin gerçek deneyim paylaşımlarını özetleyen bir asistansın.

KESİN KURALLAR:
- Yalnızca sana verilen yorumlarda ve sayılarda GEÇEN bilgiyi kullan.
- Hastane veya klinik hakkında dışarıdan hiçbir bilgi/varsayım ekleme (isim, ün, genel bilgi vb.).
- Sana verilmeyen hiçbir istatistik veya iddia UYDURMA.
- Yorumlar arasında çelişki varsa bunu olduğu gibi yansıt, tek taraflı genelleme yapma.
- Emin olmadığın bir şey varsa yazma.
- Yanıtını YALNIZCA şu JSON şeklinde ver, başka hiçbir metin ekleme:
{"strengths": "...", "weaknesses": "...", "recommendation": "..."}
Her alan 1-2 cümle, Türkçe, sakin ve nötr bir dille yazılmalı.`;

export function buildClinicSummaryPrompt(reviews: ReviewWithScores[]): {
  system: string;
  prompt: string;
} {
  const lines = reviews.map((r, i) => {
    const overall = (
      (r.incentiveScore +
        r.colleagueScore +
        r.managementScore +
        r.cityScore +
        r.educationScore +
        r.academicScore) /
      6
    ).toFixed(1);
    return [
      `Yorum ${i + 1}:`,
      `- Genel puan (1-5): ${overall}`,
      `- Eğitim: ${r.educationScore}, Akademik: ${r.academicScore}, Yönetim: ${r.managementScore}, Finansal: ${r.incentiveScore}, Sosyal: ${r.colleagueScore}`,
      `- Aylık nöbet: ${r.monthlyShifts}`,
      `- Tekrar tercih eder mi: ${r.wouldChooseAgain ? "Evet" : "Hayır"}`,
      r.comment ? `- Yorum metni: "${r.comment}"` : "- Yorum metni: (yazılmamış)",
    ].join("\n");
  });

  const prompt = `Aşağıda bir klinik için ${reviews.length} onaylı hekim değerlendirmesi var. Bunlara dayanarak güçlü yönler, zayıf yönler ve genel bir tavsiye özeti çıkar.\n\n${lines.join("\n\n")}`;

  return { system: SYSTEM_PROMPT, prompt };
}
