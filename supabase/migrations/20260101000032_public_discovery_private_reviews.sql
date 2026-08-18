-- Public discovery, private evaluations
--
-- Kurum ve klinik adları arama/keşif için herkese açık kalır.
-- Değerlendirme metinleri, puanları ve review_topics ise 00031'deki
-- doğrulanmış-hekim RLS politikalarıyla korunmaya devam eder.
--
-- Bu ayrım ana sayfadaki "Rey" -> "Reyhanlı Devlet Hastanesi" gibi
-- önerilerin giriş yapmadan da çalışmasını sağlar; ziyaretçi kurumu
-- bulabilir ama değerlendirme içeriğine erişemez.

drop policy if exists hospitals_verified_read on hospitals;
drop policy if exists hospitals_public_read on hospitals;
create policy hospitals_public_read
  on hospitals
  for select
  using (true);

drop policy if exists clinics_verified_read on clinics;
drop policy if exists clinics_public_read on clinics;
create policy clinics_public_read
  on clinics
  for select
  using (true);

comment on policy hospitals_public_read on hospitals is
  'Kurum adı/il/ilçe/tür keşif amacıyla herkese açıktır; değerlendirme içerikleri ayrı RLS politikalarıyla korunur.';

comment on policy clinics_public_read on clinics is
  'Klinik adı ve kurum ilişkisi keşif amacıyla herkese açıktır; değerlendirme içerikleri ayrı RLS politikalarıyla korunur.';
