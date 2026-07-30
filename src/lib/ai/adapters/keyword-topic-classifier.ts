import type { ReviewTopic } from "@/types";

/**
 * Bir review yorumunu 7 sabit konuya sınıflandırır. Bilinçli olarak bir
 * LLM ÇAĞIRMIYOR — anahtar kelime eşleştirmesi kullanıyor. Nedeni:
 * "AI asla veri uydurmasın" ilkesi gereği, bu adım (etiketleme) sıfır
 * halüsinasyon riski taşımalı ve her zaman (API anahtarı olmasa bile)
 * çalışmalı. Arayüz (`classify`), ileride bir LLM tabanlı sınıflandırıcı
 * ile değiştirilebilecek şekilde tasarlandı — bkz. `LlmAdapter` deseni.
 */
const TOPIC_KEYWORDS: Record<ReviewTopic, string[]> = {
  education: ["eğitim", "öğretim", "vaka", "asistan eğitimi", "öğreniyor"],
  workload: ["iş yükü", "yoğun", "yorucu", "hasta sayısı", "yorgun"],
  faculty: ["hoca", "yönetim", "başhekim", "amir", "idare", "destek"],
  research: ["yayın", "makale", "kongre", "araştırma", "tez", "akademik"],
  night_shifts: ["nöbet"],
  financial_satisfaction: ["döner sermaye", "maaş", "ek ödeme", "ücret", "prim"],
  social_environment: ["sosyal", "ekip", "arkadaş", "ortam", "meslektaş"],
};

export function classifyReviewTopics(comment: string | null | undefined): ReviewTopic[] {
  if (!comment) return [];
  const normalized = comment.toLocaleLowerCase("tr-TR");

  return (Object.keys(TOPIC_KEYWORDS) as ReviewTopic[]).filter((topic) =>
    TOPIC_KEYWORDS[topic].some((keyword) => normalized.includes(keyword))
  );
}
