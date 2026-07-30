-- Sprint 5 — Community & Trust Foundation
--
-- ÖNEMLİ MİMARİ NOT: Görev tanımı ayrı bir "profiles" tablosu istiyordu.
-- Bunun yerine MEVCUT `doctors` tablosu genişletildi, çünkü:
--   1) `doctors` zaten Supabase'in standart "profil tablosu" deseniyle
--      auth.users(id)'i referans alıyor (Sprint 2'den beri) — ayrı bir
--      `profiles` tablosu, aynı anahtarla (auth.users.id) başka bir tablo
--      daha demek, bu da "hangisi asıl kaynak" belirsizliği yaratır.
--   2) `doctors.specialty` zaten var — yeni bir `profiles.specialty` eklemek
--      normalizasyonu bozar (aynı bilgi iki yerde, senkronizasyon riski).
-- Bu yüzden `doctors` tablosuna eksik alanlar eklendi, ikinci bir tablo
-- oluşturulmadı. Bu, "mevcut mimariyi koru" talimatıyla tutarlıdır.
--
-- KİŞİSEL VERİ NOTU: `full_name` KASITLI OLARAK EKLENMEDİ. Sprint 2'den
-- beri bu tablonun temel ilkesi hiç gerçek ad/soyad tutmamaktır (bkz.
-- DATABASE.md, "Gerçek ad/soyad/TC hiçbir sütunda tutulmaz"). Bu, ürünün
-- anonimlik temelli güven modelinin veritabanı karşılığıdır. Bunun yerine
-- var olan `nickname` kullanılmaya devam ediyor. Gerçek ad/soyad tutmak
-- isteniyorsa bu, ayrı ve bilinçli bir ürün/KVKK kararı olmalı — sessizce
-- bu migration'a eklenmedi.
--
-- "verified_doctor boolean" da AYRICA EKLENMEDİ — `doctors.is_verified`
-- zaten Sprint 2'den beri tam olarak bu amaç için var. Aynı anlama gelen
-- ikinci bir sütun, veri tutarlılığı riski taşıyan gereksiz bir tekrar olurdu.

alter table doctors
  add column avatar_url text,
  add column city text,
  -- Kendi beyanına dayalı, DOĞRULANMAMIŞ "şu an nerede çalışıyorum" bilgisi.
  -- `doctor_workplaces` (SGK hizmet dökümü ile doğrulanan, tarihli çalışma
  -- geçmişi) ile KARIŞTIRILMAMALI — o mekanizma ayrı ve daha güvenilir,
  -- gelecekte bu alanın yerini alması beklenir. Bu, MVP için basit bir
  -- profil alanı.
  add column current_hospital text,
  add column experience_year integer,
  add column bio text,
  add constraint doctors_experience_year_check
    check (experience_year is null or experience_year between 0 and 60);

comment on column doctors.current_hospital is
  'Kendi beyanına dayalı, doğrulanmamış metin. Doğrulanmış çalışma geçmişi için doctor_workplaces tablosuna bakın.';

-- ---------------------------------------------------------------------
-- Gerçek RLS politikaları: Sprint 2'deki "her şeyi reddet" placeholder'ların
-- yerini alıyor (artık kimlik doğrulama var).
-- ---------------------------------------------------------------------

drop policy if exists doctors_no_access_placeholder on doctors;
drop policy if exists doctor_workplaces_no_access_placeholder on doctor_workplaces;
drop policy if exists reviews_no_access_placeholder on reviews;
drop policy if exists review_scores_no_access_placeholder on review_scores;

-- doctors: yalnızca kendi profiline erişim. Diğer hekimlerin profili
-- HERKESE AÇIK DEĞİL — anonimlik ilkesi gereği burada bir "hekim dizini"
-- yok, yalnızca kendi profilini görüp düzenleyebiliyorsun.
create policy doctors_select_own on doctors
  for select using (auth.uid() = id);
create policy doctors_insert_own on doctors
  for insert with check (auth.uid() = id);
create policy doctors_update_own on doctors
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- doctor_workplaces: yalnızca kendi çalışma geçmişine erişim (herkese
-- açık bir "kim nerede çalışıyor" dizini istenmiyor).
create policy doctor_workplaces_select_own on doctor_workplaces
  for select using (auth.uid() = doctor_id);
create policy doctor_workplaces_insert_own on doctor_workplaces
  for insert with check (auth.uid() = doctor_id);
create policy doctor_workplaces_update_own on doctor_workplaces
  for update using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

-- reviews: HERKES okuyabilir (ürünün temel değeri budur), ama yalnızca
-- kendi doctor_workplace kaydına bağlı bir review ekleyebilir/düzenleyebilir
-- (başka bir hekim adına yorum eklenemez).
create policy reviews_public_read on reviews
  for select using (true);
create policy reviews_insert_own on reviews
  for insert with check (
    exists (
      select 1 from doctor_workplaces dw
      where dw.id = doctor_workplace_id and dw.doctor_id = auth.uid()
    )
  );
create policy reviews_update_own on reviews
  for update using (
    exists (
      select 1 from doctor_workplaces dw
      where dw.id = doctor_workplace_id and dw.doctor_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from doctor_workplaces dw
      where dw.id = doctor_workplace_id and dw.doctor_id = auth.uid()
    )
  );

-- review_scores: reviews ile aynı mantık (herkes okur, yalnızca sahibi yazar).
create policy review_scores_public_read on review_scores
  for select using (true);
create policy review_scores_insert_own on review_scores
  for insert with check (
    exists (
      select 1 from reviews r
      join doctor_workplaces dw on dw.id = r.doctor_workplace_id
      where r.id = review_id and dw.doctor_id = auth.uid()
    )
  );
create policy review_scores_update_own on review_scores
  for update using (
    exists (
      select 1 from reviews r
      join doctor_workplaces dw on dw.id = r.doctor_workplace_id
      where r.id = review_id and dw.doctor_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from reviews r
      join doctor_workplaces dw on dw.id = r.doctor_workplace_id
      where r.id = review_id and dw.doctor_id = auth.uid()
    )
  );
