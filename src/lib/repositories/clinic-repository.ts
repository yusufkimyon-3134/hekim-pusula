import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Clinic } from "@/types";

type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];

function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    branch: row.branch,
  };
}

/**
 * `clinics` tablosuna erişim katmanı. Bkz. `HospitalRepository` — aynı
 * desen: DB satırı repository içinde domain tipine eşlenir.
 */
export class ClinicRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByHospitalId(hospitalId: string): Promise<Clinic[]> {
    const { data, error } = await this.client
      .from("clinics")
      .select("*")
      .eq("hospital_id", hospitalId)
      .order("branch");

    if (error) {
      throw new Error(`Klinikler getirilemedi: ${error.message}`);
    }
    return (data ?? []).map(toClinic);
  }

  async findById(id: string): Promise<Clinic | null> {
    const { data, error } = await this.client
      .from("clinics")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Klinik getirilemedi: ${error.message}`);
    }
    return data ? toClinic(data) : null;
  }
}
