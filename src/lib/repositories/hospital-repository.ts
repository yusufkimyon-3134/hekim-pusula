import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Hospital } from "@/types";

type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];

function toHospital(row: HospitalRow): Hospital {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    district: row.district,
    hospitalType: row.hospital_type,
  };
}

/**
 * `hospitals` tablosuna erişim katmanı. Sayfalar/route'lar bu tablodan
 * doğrudan Supabase sorgusu yazmak yerine bu repository'yi kullanır —
 * böylece sorgu mantığı tek bir yerde toplanır ve `hospitals`in DB
 * şekli (snake_case) uygulama katmanına sızmaz.
 */
export class HospitalRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * İsim, il veya ilçeye göre arar. `query` boşsa tüm hastaneleri
   * (isme göre sıralı) döner.
   */
  async search(query?: string): Promise<Hospital[]> {
    let request = this.client.from("hospitals").select("*").order("name");

    const trimmed = query?.trim();
    if (trimmed) {
      const pattern = `%${trimmed}%`;
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
}
