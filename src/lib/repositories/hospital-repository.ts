import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CityCount, Hospital, HospitalSearchParams } from "@/types";

type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type CityCountRow = Database["public"]["Views"]["hospital_city_counts"]["Row"];
type SearchHospitalsRow = Database["public"]["Functions"]["search_hospitals"]["Returns"][number];

function toHospital(row: HospitalRow | SearchHospitalsRow): Hospital {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    district: row.district,
    hospitalType: row.hospital_type,
  };
}

function toCityCount(row: CityCountRow): CityCount {
  return { city: row.city ?? "", hospitalCount: row.hospital_count ?? 0 };
}

/**
 * `hospitals` tablosuna erişim katmanı. Sayfalar/route'lar bu tablodan
 * doğrudan Supabase sorgusu yazmak yerine bu repository'yi kullanır.
 */
export class HospitalRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * İsim, il veya ilçeye göre çok kelimeli arama (her kelime en az bir
   * alanda eşleşmeli) + isteğe bağlı il/hastane türü filtresi. Sonuçlar
   * alaka düzeyine göre sıralanır (bkz. `search_hospitals` RPC — pg_trgm
   * similarity() kullanır). Alaka sıralaması, çoklu alan/tablo üzerinde
   * hesaplandığı ve düz PostgREST filtreleriyle ifade edilemediği için
   * bir Postgres fonksiyonuna delege edilir (`ClinicRepository.search`
   * ile aynı desen).
   */
  async search(params: HospitalSearchParams = {}): Promise<Hospital[]> {
    const { data, error } = await this.client.rpc("search_hospitals", {
      search_query: params.query ?? undefined,
      filter_city: params.city ?? undefined,
      filter_hospital_type: params.hospitalType ?? undefined,
    });

    if (error) {
      throw new Error(`Hastaneler getirilemedi: ${error.message}`);
    }
    return (data ?? []).map(toHospital);
  }

  async findById(id: string): Promise<Hospital | null> {
    const { data, error } = await this.client
      .from("hospitals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Hastane getirilemedi: ${error.message}`);
    }
    return data ? toHospital(data) : null;
  }

  /** Şehir başına hastane sayısı, en çoktan aza — ana sayfadaki "öne çıkan şehirler" için. */
  async listFeaturedCities(limit: number): Promise<CityCount[]> {
    const { data, error } = await this.client
      .from("hospital_city_counts")
      .select("*")
      .order("hospital_count", { ascending: false })
      .order("city", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Öne çıkan şehirler getirilemedi: ${error.message}`);
    }
    return (data ?? []).map(toCityCount);
  }

  /** Tüm şehirler, alfabetik — arama sayfasındaki şehir filtresi için. */
  async listAllCities(): Promise<CityCount[]> {
    const { data, error } = await this.client
      .from("hospital_city_counts")
      .select("*")
      .order("city", { ascending: true });

    if (error) {
      throw new Error(`Şehir listesi getirilemedi: ${error.message}`);
    }
    return (data ?? []).map(toCityCount);
  }
}
