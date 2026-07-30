import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ReportReason } from "@/types";

/**
 * `reports`'a erişim katmanı. RLS: kimliği doğrulanmış herkes rapor
 * gönderebilir (`auth.uid() = doctor_id`); yalnızca kendi gönderdiği
 * raporları görebilir — moderatör paneli (gelecek sprint) gelene kadar
 * başka bir görünürlük yok.
 */
export class ReportRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(reviewId: string, doctorId: string, reason: ReportReason): Promise<void> {
    const { error } = await this.client
      .from("reports")
      .insert({ review_id: reviewId, doctor_id: doctorId, reason });

    if (error) {
      throw new Error(`Rapor gönderilemedi: ${error.message}`);
    }
  }
}
