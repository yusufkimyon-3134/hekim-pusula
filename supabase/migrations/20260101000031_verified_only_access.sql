-- Yalnızca Doğrulanmış Hekim — Sunucu Taraflı Erişim Kontrolü (RLS)
--
-- Bu migration, "yorumlar ve kurum detayları herkese açık olmamalı"
-- ilkesini VERİTABANI SEVİYESİNDE uyguluyor — yalnızca middleware'de
-- değil. Sebep: `NEXT_PUBLIC_SUPABASE_ANON_KEY` tarayıcıda görünür
-- (Supabase'in kendi tasarımı gereği bu normal ve beklenen — asıl
-- güvenlik sınırı RLS'dir, anahtarın gizliliği değil). Bu yüzden biri
-- middleware'i atlayıp doğrudan Supabase REST API'ye anon anahtarıyla
-- istek atsa bile, RLS aynı kısıtlamayı uygulamalı.
--
-- TASARIM: Var olan fonksiyonların/view'ların NEREDEYSE HİÇBİRİNE
-- dokunulmuyor. `search_hospitals`, `search_clinics`, `search_suggestions`,
-- `rank_clinics_by_branch`, `top_clinics_this_month`,
-- `most_improved_clinics`, `trending_specialties`,
-- `most_discussed_hospitals`, `clinic_review_stats`,
-- `review_author_stats`, `hospital_city_counts` — hepsi
-- `security invoker` (varsayılan, doğrudan doğruladım: bu projede yalnızca
-- `get_my_reputation`, `flag_heavily_reported_reviews`,
-- `apply_doctor_verification_decision` SECURITY DEFINER). Yani hepsi
-- ÇAĞIRANIN RLS'ine tabi — yalnızca `hospitals`/`clinics`/`reviews`/
-- `review_scores`/`review_topics` tablolarının POLİTİKALARINI
-- sıkılaştırmak, bu fonksiyon/view'ların TAMAMINI otomatik olarak
-- doğrulanmamış kullanıcılar için boş sonuç döndürecek hale getiriyor.

-- ---------------------------------------------------------------------
-- 1) Yardımcı fonksiyon: çağıran, doğrulanmış (approved) bir hekim mi?
-- ---------------------------------------------------------------------
create or replace function is_verified_doctor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_verified from doctors where id = auth.uid()),
    false
  );
$$;

comment on function is_verified_doctor is
  'auth.uid() bir doctors satırına karşılık geliyor VE is_verified=true ise true. Giriş yapmamış (auth.uid() null) kullanıcı için her zaman false. RLS politikalarında tekrar tekrar aynı alt sorguyu yazmamak için — SECURITY DEFINER, çünkü bazı çağıran rollerin doctors tablosunda bare select grant''ı olmayabilir (yalnızca kendi satırını okuyabilir, o da zaten burada sağlanıyor).';

grant execute on function is_verified_doctor to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) hospitals / clinics — artık herkese açık DEĞİL, yalnızca
-- doğrulanmış hekimler okuyabilir. Bunların hiçbir "sahibi" yok (bir
-- doktora ait değiller), bu yüzden istisna/kendi-satırı mantığı yok.
-- ---------------------------------------------------------------------
drop policy if exists hospitals_public_read on hospitals;
create policy hospitals_verified_read
  on hospitals
  for select
  using (is_verified_doctor());

drop policy if exists clinics_public_read on clinics;
create policy clinics_verified_read
  on clinics
  for select
  using (is_verified_doctor());

-- ---------------------------------------------------------------------
-- 3) reviews — onaylı review'lar artık yalnızca DOĞRULANMIŞ hekimlere
-- açık. Kendi review'unu görme hakkı (doğrulama durumu ne olursa olsun)
-- KORUNUYOR — bir hekim, herhangi bir sebeple (teoride) doğrulaması
-- geçersiz kalsa bile kendi yazdığı içeriği görebilmeli.
-- ---------------------------------------------------------------------
drop policy if exists reviews_public_read on reviews;
create policy reviews_verified_read on reviews
  for select using (
    (status = 'approved' and is_verified_doctor())
    or exists (
      select 1 from doctor_workplaces dw
      where dw.id = doctor_workplace_id and dw.doctor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 4) review_scores — eskiden TAMAMEN açıktı (`using (true)`) — en
-- gevşek politika buydu, şimdi reviews ile aynı kurala bağlandı.
-- ---------------------------------------------------------------------
drop policy if exists review_scores_public_read on review_scores;
create policy review_scores_verified_read on review_scores
  for select using (
    exists (
      select 1 from reviews r
      where r.id = review_id
        and (
          (r.status = 'approved' and is_verified_doctor())
          or exists (
            select 1 from doctor_workplaces dw
            where dw.id = r.doctor_workplace_id and dw.doctor_id = auth.uid()
          )
        )
    )
  );

-- ---------------------------------------------------------------------
-- 5) review_topics — aynı kural.
-- ---------------------------------------------------------------------
drop policy if exists review_topics_public_read on review_topics;
create policy review_topics_verified_read on review_topics
  for select using (
    exists (
      select 1 from reviews r
      where r.id = review_id
        and (
          (r.status = 'approved' and is_verified_doctor())
          or exists (
            select 1 from doctor_workplaces dw
            where dw.id = r.doctor_workplace_id and dw.doctor_id = auth.uid()
          )
        )
    )
  );

-- ---------------------------------------------------------------------
-- Bilinçli olarak DOKUNULMAYANLAR (ve neden):
-- - clinic_review_stats / review_author_stats / review_helpful_counts /
--   hospital_city_counts (view'lar): security_invoker=true, altlarındaki
--   tablolar (hospitals/clinics/reviews) artık kısıtlı olduğu için
--   otomatik olarak aynı kısıtlamayı miras alıyorlar — view''ların
--   kendisini değiştirmeye gerek yok.
-- - search_hospitals / search_clinics / search_suggestions /
--   rank_clinics_by_branch / top_clinics_this_month /
--   most_improved_clinics / trending_specialties /
--   most_discussed_hospitals (fonksiyonlar): hepsi security invoker,
--   aynı sebeple otomatik kısıtlanıyor.
-- - branch_synonyms: hastane/klinik/review içeriği DEĞİL, yalnızca
--   branş adı eşanlamlıları (örn. "kbb" -> "Kulak Burun Boğaz") — "kurum
--   detayı" ya da "yorum" sayılmaz, herkese açık kalması zararsız.
-- - doctor_workplaces: zaten yalnızca "kendi satırın" okunabiliyor
--   (Sprint 5''ten beri), bu migration''dan etkilenmiyor.
-- ---------------------------------------------------------------------
