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
