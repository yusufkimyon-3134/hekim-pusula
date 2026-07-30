import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  Clinic,
  ClinicSearchResult,
  ClinicWithHospital,
  HospitalSearchParams,
} from "@/types";

type ClinicRow = Database["public"]["Tables"]["clinics"]["Row"];
type HospitalRow = Database["public"]["Tables"]["hospitals"]["Row"];
type SearchClinicsRow = Database["public"]["Functions"]["search_clinics"]["Returns"][number];

function toClinic(row: ClinicRow): Clinic {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    branch: row.branch,
  };
}

function toSearchResult(row: SearchClinicsRow): ClinicSearchResult {
  return {
    clinicId: row.clinic_id,
    branch: row.branch,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    hospitalCity: row.hospital_city,
    hospitalDistrict: row.hospital_district,
    hospitalType: row.hospital_type,
  };
}

/**
 * `clinics` tablosuna erişim katmanı. Aynı desen: DB satırı repository
 * içinde domain tipine eşlenir, UI hiçbir zaman ham satırı görmez.
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

  /**
   * Klinik detay sayfası için: klinik + hastanesini TEK sorguda getirir
   * (PostgREST embedded resource ile) — sayfa başına iki ayrı round-trip
   * yerine (klinik + sonra hastane) tek istek.
   */
  async findByIdWithHospital(id: string): Promise<ClinicWithHospital | null> {
    const { data, error } = await this.client
      .from("clinics")
      .select("*, hospitals(*)")
      .eq("id", id)
      .maybeSingle<ClinicRow & { hospitals: HospitalRow }>();

    if (error) {
      throw new Error(`Klinik getirilemedi: ${error.message}`);
    }
    if (!data) return null;

    return {
      ...toClinic(data),
      hospital: {
        id: data.hospitals.id,
        name: data.hospitals.name,
        city: data.hospitals.city,
        district: data.hospitals.district,
        hospitalType: data.hospitals.hospital_type,
      },
    };
  }

  /**
   * Branş + hastane adı/il/ilçe üzerinden çok kelimeli arama. Klinikler
   * hastanelerle join'lenmesi gerektiği için (ve PostgREST'in embedded
   * resource'larda `or()` filtrelemesi kırılgan olduğundan) bu, bir
   * Postgres RPC fonksiyonuna (`search_clinics`) delege edilir — bkz.
   * `supabase/migrations/20260101000013_search_support.sql`.
   */
  async search(params: HospitalSearchParams = {}): Promise<ClinicSearchResult[]> {
    const { data, error } = await this.client.rpc("search_clinics", {
      search_query: params.query ?? null,
      filter_city: params.city ?? null,
      filter_hospital_type: params.hospitalType ?? null,
    });

    if (error) {
      throw new Error(`Klinik araması yapılamadı: ${error.message}`);
    }
    return (data ?? []).map(toSearchResult);
  }
}
