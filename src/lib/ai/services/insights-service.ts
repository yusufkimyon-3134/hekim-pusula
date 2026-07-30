import type { ReviewTopic, ReviewWithScores } from "@/types";
import type { InsightCard } from "@/lib/ai/types";

const TOPIC_LABELS: Record<ReviewTopic, string> = {
  education: "eğitim",
  workload: "iş yükü",
  faculty: "yönetim/hoca desteği",
  research: "akademik fırsatlar",
  night_shifts: "nöbet düzeni",
  financial_satisfaction: "döner sermaye/ek ödeme",
  social_environment: "sosyal ortam",
};

function average(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Bir klinik için "içgörü kartları" üretir — tamamı gerçek, hesaplanmış
 * verilerden türetilir (LLM kullanılmaz). Her kart, altındaki sayıyı da
 * gösterir (şeffaflık — "AI Safety: asla veri uydurma" ilkesi).
 */
export function generateClinicInsights(params: {
  reviews: ReviewWithScores[];
  topicCounts: Partial<Record<ReviewTopic, number>>;
  globalAvgManagementScore: number | null;
}): InsightCard[] {
  const { reviews, topicCounts, globalAvgManagementScore } = params;
  const cards: InsightCard[] = [];

  // 1) Zaman içi eğilim: son 90 gün vs önceki dönem (her ikisinde de
  // en az 2 değerlendirme varsa — daha azında bir "eğilimden" söz etmek
  // yanıltıcı olur).
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = reviews.filter((r) => new Date(r.createdAt).getTime() >= ninetyDaysAgo);
  const older = reviews.filter((r) => new Date(r.createdAt).getTime() < ninetyDaysAgo);

  if (recent.length >= 2 && older.length >= 2) {
    const recentEdu = average(recent.map((r) => r.educationScore));
    const olderEdu = average(older.map((r) => r.educationScore));
    const delta = recentEdu - olderEdu;

    if (delta >= 0.5) {
      cards.push({
        title: "Eğitim puanı yükseliyor",
        description: `Son 3 aydaki değerlendirmelerde eğitim puanı ortalaması ${recentEdu.toFixed(1)} — önceki dönemde ${olderEdu.toFixed(1)} idi.`,
      });
    } else if (delta <= -0.5) {
      cards.push({
        title: "Eğitim puanı düşüşte",
        description: `Son 3 aydaki değerlendirmelerde eğitim puanı ortalaması ${recentEdu.toFixed(1)} — önceki dönemde ${olderEdu.toFixed(1)} idi.`,
      });
    }
  }

  // 2) Sık bahsedilen konu: yorumlu değerlendirmelerin en az yarısında
  // geçen bir konu varsa.
  const reviewsWithComments = reviews.filter((r) => r.comment);
  if (reviewsWithComments.length >= 3) {
    const mostMentioned = Object.entries(topicCounts).sort((a, b) => b[1]! - a[1]!)[0];
    if (mostMentioned && mostMentioned[1]! / reviewsWithComments.length >= 0.5) {
      const [topic, count] = mostMentioned;
      cards.push({
        title: "Sık bahsedilen konu",
        description: `Hekimler yorumlarında en çok "${TOPIC_LABELS[topic as ReviewTopic]}" konusundan bahsediyor (${count}/${reviewsWithComments.length} yorumda geçiyor).`,
      });
    }
  }

  // 3) Genel ortalamaya göre karşılaştırma (yönetim desteği örneği).
  if (globalAvgManagementScore !== null && reviews.length >= 3) {
    const clinicAvgManagement = average(reviews.map((r) => r.managementScore));
    const delta = clinicAvgManagement - globalAvgManagementScore;
    if (Math.abs(delta) >= 0.5) {
      cards.push({
        title: delta > 0 ? "Yönetim desteği ortalamanın üzerinde" : "Yönetim desteği ortalamanın altında",
        description: `Bu klinikte yönetim desteği ortalama ${clinicAvgManagement.toFixed(1)} — tüm platform ortalaması ${globalAvgManagementScore.toFixed(1)}.`,
      });
    }
  }

  return cards;
}
