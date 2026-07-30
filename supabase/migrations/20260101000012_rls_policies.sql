-- Sprint 2: her tabloda RLS etkinleştirilir.
--
-- hospitals ve clinics: kamuya açık referans veridir (arama sayfasının
-- kimlik doğrulaması olmadan çalışması gerekiyor, bkz. HospitalRepository).
-- Bu yüzden herkes SELECT yapabilir; INSERT/UPDATE/DELETE için henüz
-- politika yok (varsayılan olarak engellenir, yönetim ileride admin/service
-- role ile yapılacak).
--
-- doctors, doctor_workplaces, reviews, review_scores, favorites, reports:
-- kimlik doğrulama henüz implemente edilmedi (Sprint 3). Bu tablolar için
-- kasıtlı olarak "boş" (her şeyi reddeden) placeholder politika kondu.
-- Gerçek politikalar (örn. "herkes review okuyabilir ama yalnızca sahibi
-- güncelleyebilir") kimlik doğrulama eklendiğinde yazılacak.

alter table hospitals enable row level security;
create policy hospitals_public_read
  on hospitals
  for select
  using (true);

alter table clinics enable row level security;
create policy clinics_public_read
  on clinics
  for select
  using (true);

alter table doctors enable row level security;
create policy doctors_no_access_placeholder
  on doctors
  for all
  using (false)
  with check (false);

alter table doctor_workplaces enable row level security;
create policy doctor_workplaces_no_access_placeholder
  on doctor_workplaces
  for all
  using (false)
  with check (false);

alter table reviews enable row level security;
create policy reviews_no_access_placeholder
  on reviews
  for all
  using (false)
  with check (false);

alter table review_scores enable row level security;
create policy review_scores_no_access_placeholder
  on review_scores
  for all
  using (false)
  with check (false);

alter table favorites enable row level security;
create policy favorites_no_access_placeholder
  on favorites
  for all
  using (false)
  with check (false);

alter table reports enable row level security;
create policy reports_no_access_placeholder
  on reports
  for all
  using (false)
  with check (false);
