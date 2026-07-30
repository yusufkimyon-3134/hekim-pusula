import type { HospitalType } from "./database";

export type { HospitalType, DoctorRole, ReportStatus } from "./database";

/**
 * Uygulama katmanının kullandığı domain tipleri (camelCase).
 * Veritabanı satır şekli (snake_case) için bkz. `database.ts`.
 * Repository'ler, DB satırlarını bu tiplere eşler.
 */

export interface Hospital {
  id: string;
  name: string;
  city: string;
  district: string;
  hospitalType: HospitalType;
}

export interface Clinic {
  id: string;
  hospitalId: string;
  branch: string;
}

/** Klinik detay sayfası için: klinik + ait olduğu hastanenin tamamı. */
export interface ClinicWithHospital extends Clinic {
  hospital: Hospital;
}

/** search_clinics RPC'sinin sonuç satırı — arama sayfasında gösterilir. */
export interface ClinicSearchResult {
  clinicId: string;
  branch: string;
  hospitalId: string;
  hospitalName: string;
  hospitalCity: string;
  hospitalDistrict: string;
  hospitalType: HospitalType;
}

/** Ana sayfadaki "öne çıkan şehirler" ve arama filtresindeki şehir listesi. */
export interface CityCount {
  city: string;
  hospitalCount: number;
}

export interface HospitalSearchParams {
  query?: string;
  city?: string;
  hospitalType?: HospitalType;
}
