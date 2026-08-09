import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SearchSuggestion } from "@/types";

/**
 * Ana sayfadaki gerçek zamanlı öneri kutusu için — hem `hospitals` hem
 * `clinics` üzerinde arama yapıp TEK, önceden sıralanmış bir sonuç
 * kümesi döner (bkz. `search_suggestions` RPC — sıralama mantığı
 * SQL'de, çünkü hastane+klinik sonuçlarını birleştirip 3 katmanlı
 * sıralamak (değerlendirmesi olanlar → hastaneler → klinikler)
 * istemci tarafında ayrı ayrı yapılırsa hem daha karmaşık hem daha
 * kırılgan olur).
 */
export class SearchSuggestionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async search(query: string, limit = 8): Promise<SearchSuggestion[]> {
    const { data, error } = await this.client.rpc("search_suggestions", {
      p_query: query,
      p_limit: limit,
    });

    if (error) {
      throw new Error(`Öneriler getirilemedi: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      type: row.result_type,
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      reviewCount: row.review_count,
    }));
  }
}
