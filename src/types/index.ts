/**
 * Sprint 1 kapsamında yalnızca placeholder sayfalarda kullanılan
 * asgari tipler. Alan adları `docs/DATABASE.md` içindeki tablo/sütun
 * adlarıyla birebir eşleşecek şekilde seçildi (kurumlar.ad, kurumlar.il,
 * kurumlar.ilce, klinikler.kurum_id, klinikler.brans) — ileride Supabase'den
 * üretilen tiplerle değiştirilecek, o zaman da bu eşleşme korunmalı.
 */

export interface Kurum {
  id: string;
  ad: string;
  il: string;
  ilce: string;
}

export interface Klinik {
  id: string;
  kurumId: string;
  brans: string;
}
