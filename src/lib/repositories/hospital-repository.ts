import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CityCount, Hospital, HospitalSearchParams } from "@/types";
import { tokenize } from "@/lib/search-tokens";

type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type CityCountRow = Database["public"]["Views"]["hospital_city_counts"]["Row"];

function toHospital(row: HospitalRow): Hospital {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    district: row.district,
    hospitalType: row.hospital_type,
  };
}

function toCityCount(row: CityCountRow): CityCount {
  return { city: row.city, hospitalCount: row.hospital_count };
}

/**
 * `hospitals` tablosuna erişim katmanı. Sayfalar/route'lar bu tablodan
 * doğrudan Supabase sorgusu yazmak yerine bu repository'yi kullanır.
 */
export class HospitalRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * İsim, il veya ilçeye göre çok kelimeli arama (her kelime en az bir
   * alanda eşleşmeli) + isteğe bağlı il/hastane türü filtresi.
   */
  async search(params: HospitalSearchParams = {}): Promise<Hospital[]> {
    let request = this.client.from("hospitals").select("*").order("name");

    if (params.city) {
      request = request.eq("city", params.city);
    }
    if (params.hospitalType) {
      request = request.eq("hospital_type", params.hospitalType);
    }

    for (const token of tokenize(params.query)) {
      const pattern = `%${token}%`;
      request = request.or(
        `name.ilike.${pattern},city.ilike.${pattern},district.ilike.${pattern}`
      );
    }

    const { data, error } = await request;
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
