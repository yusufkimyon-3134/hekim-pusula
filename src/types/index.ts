/**
 * Sprint 1 kapsamında yalnızca placeholder sayfalarda kullanılan
 * asgari tipler. Gerçek veritabanı şeması docs/DATABASE.md içinde;
 * bu tipler ileride Supabase'den üretilen tiplerle değiştirilecek.
 */

export interface Hospital {
  id: string;
  name: string;
  il: string;
  ilce: string;
}

export interface Clinic {
  id: string;
  hospitalId: string;
  brans: string;
}
