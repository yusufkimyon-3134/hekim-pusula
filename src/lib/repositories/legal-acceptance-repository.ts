import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Kapalı beta yasal metinlerinin sürümü — kayıt formunda gösterilen ve kabul kaydına damgalanan sürüm. */
export const LEGAL_DOCUMENT_VERSION = "2026-08-09";

/**
 * `legal_acceptances` — yalnızca INSERT/SELECT (kendi kaydın). Bkz.
 * migration: kullanıcı bu kayıtları asla güncelleyemez/silemez.
 */
export class LegalAcceptanceRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * E-posta aktivasyonu tamamlanınca (`/auth/callback`) çağrılır — kayıt
   * formunda ikisi de zorunlu olduğu için, buraya ulaşan her kullanıcının
   * ikisini de kabul etmiş olması gerekir; bu yüzden iki satır birden
   * (tek sorguda) yazılıyor. İdempotent: kullanıcı aktivasyon linkine
   * tekrar tıklarsa (örn. e-posta istemcisi linki iki kez açarsa) mükerrer
   * kayıt oluşmasın diye önce var olan kayıt kontrol ediliyor.
   */
  async recordAcceptance(userId: string): Promise<void> {
    const { data: existing } = await this.client
      .from("legal_acceptances")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (existing && existing.length > 0) return;

    const { error } = await this.client.from("legal_acceptances").insert([
      { user_id: userId, document_type: "kvkk_aydinlatma", version: LEGAL_DOCUMENT_VERSION },
      { user_id: userId, document_type: "kullanim_kosullari", version: LEGAL_DOCUMENT_VERSION },
    ]);

    if (error) {
      throw new Error(`Kabul kaydı oluşturulamadı: ${error.message}`);
    }
  }
}
