-- Sprint 7 — Trust, Moderation & Reputation System
--
-- ÖNEMLİ TASARIM KARARLARI (yaptığım seçimleri açıklıyorum):
--
-- 1) "verified_doctor" yine eklenmedi — `doctors.is_verified` (Sprint 2)
--    aynı amaca hizmet ediyor. `review_count`/`reputation_score`/
--    `helpful_votes`/`member_since` de `doctors` tablosuna STOKLANMIŞ
--    sütunlar olarak eklenmedi — bunlar türetilmiş (derived) verilerdir,
--    Sprint 6'daki `clinic_review_stats` deseniyle tutarlı olarak bir
--    VIEW/fonksiyon üzerinden hesaplanır. Stoklanmış sayaçlar senkron
--    dışı kalma riski taşır (Sprint 2'de `is_current`/`work_end_date`
--    için bilinçli olarak kaçınılan tam o hata).
--
-- 2) ANONİMLİK ile "itibar" arasındaki gerilim: "reputation'ı review
--    kartlarında göster" isteği, ürünün temel ilkesiyle (hiçbir yerde
--    hekim kimliği/nickname'i başkalarına gösterilmez, "hekim dizini"
--    yok) gerilim içinde. Çözüm: review kartında SAYISAL itibar
--    (kaç katkı, kaç faydalı oy) gösterilir ama bu sayı ASLA bir
--    doctor_id/nickname ile birlikte sunulmaz — yalnızca "bu review'ı
--    yazan hekimin profili" anlık görüntüsü olarak, başka review'larla
--    çapraz eşleştirmeyi (aynı kişi olduğunu tespit etmeyi) mümkün
--    kılacak sabit bir kimlik olmadan. Bunu SQL seviyesinde zorlamak
--    için `review_author_stats` view'ı YALNIZCA review_id + sayılar
--    döndürür, asla doctor_id döndürmez (aşağıda).
--
-- 3) "Only approved reviews visible" ile "henüz moderatör paneli yok"
--    arasındaki gerilim: Eğer yeni review'lar varsayılan 'pending' olsa
--    ve onaylayacak kimse olmasa, Sprint 5-6'da inşa edilen TÜM herkese
--    açık review/istatistik/sıralama/karşılaştırma özellikleri fiilen
--    boşalırdı. Bunun yerine: review'lar varsayılan 'approved' ile
--    gönderilir (kimlik doğrulama + profil tamamlama zaten bir temel
--    güven eşiği), ama bir review yeterince (>=3) FARKLI hekimden rapor
--    alırsa bir trigger otomatik olarak 'pending'e çeker (insan
--    moderatörü beklemeden geçici olarak gizler). Böylece "moderasyon
--    altyapısı" gerçekten bir şey yapıyor, moderatör panosu gelene kadar
--    da ürün işlevsiz kalmıyor.

create type report_reason as enum (
  'spam',
  'offensive_language',
  'false_information',
  'duplicate',
  'other'
);

create type review_status as enum ('pending', 'approved', 'rejected');

-- ---------------------------------------------------------------------
-- reviews: moderasyon durumu
-- ---------------------------------------------------------------------
alter table reviews
  add column status review_status not null default 'approved';

create index reviews_status_idx on reviews (status);

comment on column reviews.status is
  'Varsayılan approved (moderatör paneli henüz yok). >=3 farklı hekimden rapor alan bir review otomatik olarak pending''e döner (bkz. flag_heavily_reported_reviews trigger''ı).';

-- ---------------------------------------------------------------------
-- reports: reason artık serbest metin değil, sabit bir enum
-- (tablo hiçbir zaman yazılabilir olmadığı için — RLS placeholder her
-- şeyi reddediyordu — bu dönüşüm güvenli, mevcut veri yok).
-- ---------------------------------------------------------------------
alter table reports
  alter column reason type report_reason using reason::report_reason;

-- Aynı hekim aynı review'ı birden fazla kez raporlayamaz (temizlik +
-- "sessizce yut" server action deseniyle tutarlı).
alter table reports
  add constraint reports_review_id_doctor_id_key unique (review_id, doctor_id);

-- ---------------------------------------------------------------------
-- review_helpful_votes: "faydalı" oyu. Bileşik PK (favorites ile aynı
-- desen) aynı hekimin aynı review'a iki kez oy vermesini veritabanı
-- seviyesinde imkansız kılar.
-- ---------------------------------------------------------------------
create table review_helpful_votes (
  review_id uuid not null references reviews (id) on delete cascade,
  doctor_id uuid not null references doctors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (review_id, doctor_id)
);

create index review_helpful_votes_review_id_idx on review_helpful_votes (review_id);

comment on table review_helpful_votes is
  'Bir hekimin bir review''ı "faydalı" olarak işaretlemesi. SELECT/INSERT/DELETE RLS ile yalnızca kendi oyuna kısıtlı — kimin kime oy verdiği herkese açık değil (anonimlik). Toplam sayı, aşağıdaki review_helpful_counts view''ı ile herkese açık şekilde ayrıca sunulur.';

alter table review_helpful_votes enable row level security;

create policy review_helpful_votes_select_own on review_helpful_votes
  for select using (auth.uid() = doctor_id);
create policy review_helpful_votes_insert_own on review_helpful_votes
  for insert with check (auth.uid() = doctor_id);
create policy review_helpful_votes_delete_own on review_helpful_votes
  for delete using (auth.uid() = doctor_id);

-- ---------------------------------------------------------------------
-- review_helpful_counts: herkese açık toplam sayı. Bilinçli olarak
-- security_invoker AYARLANMADI (view sahibi ayrıcalığıyla çalışır) —
-- böylece herkes doğru toplamı görür, ama yalnızca toplamı; tek tek oy
-- satırlarına (kim oy verdi) hâlâ RLS ile erişilemiyor.
-- ---------------------------------------------------------------------
create view review_helpful_counts as
select review_id, count(*) as helpful_count
from review_helpful_votes
group by review_id;

comment on view review_helpful_counts is
  'Bilinçli olarak security_invoker=true DEĞİL: alttaki review_helpful_votes RLS ile kilitli olsa da, bu view herkese doğru toplam sayıyı verir (view sahibi ayrıcalığıyla). Kim oy verdiği hâlâ gizli kalır.';

grant select on review_helpful_counts to anon, authenticated;

-- ---------------------------------------------------------------------
-- doctor_reputation: dahili view (anon/authenticated''a GRANT edilmiyor).
-- Yalnızca aşağıdaki get_my_reputation() ve review_author_stats
-- tarafından kullanılır — hiçbir zaman doğrudan doctor_id ile
-- sorgulanabilir şekilde herkese açılmıyor.
-- ---------------------------------------------------------------------
create view doctor_reputation as
select
  d.id as doctor_id,
  d.is_verified,
  d.created_at as member_since,
  count(distinct r.id) filter (where r.status = 'approved') as review_count,
  coalesce(sum(rhc.helpful_count) filter (where r.status = 'approved'), 0) as helpful_votes,
  (
    count(distinct r.id) filter (where r.status = 'approved') * 10
    + coalesce(sum(rhc.helpful_count) filter (where r.status = 'approved'), 0) * 3
  ) as reputation_score
from doctors d
left join doctor_workplaces dw on dw.doctor_id = d.id
left join reviews r on r.doctor_workplace_id = dw.id
left join review_helpful_counts rhc on rhc.review_id = r.id
group by d.id;

comment on view doctor_reputation is
  'reputation_score = onaylı yorum sayısı*10 + alınan faydalı oy*3 (basit, belgelenmiş bir formül). Bu view''a doğrudan erişim GRANT edilmedi — yalnızca get_my_reputation() (kendi profilin) ve review_author_stats (bir review''ın yazarının anlık görüntüsü, doctor_id olmadan) üzerinden dolaylı kullanılır.';

-- ---------------------------------------------------------------------
-- get_my_reputation: profil sayfası için. SECURITY DEFINER ile
-- doctor_reputation''ın altındaki RLS''i güvenle atlar, ama fonksiyon
-- gövdesi auth.uid()''e sabitlenmiştir — başka bir hekimin verisini
-- sorgulama imkanı YOK.
-- ---------------------------------------------------------------------
create or replace function get_my_reputation()
returns table (
  review_count bigint,
  helpful_votes bigint,
  reputation_score bigint,
  is_verified boolean,
  member_since timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select review_count, helpful_votes, reputation_score, is_verified, member_since
  from doctor_reputation
  where doctor_id = auth.uid();
$$;

grant execute on function get_my_reputation to authenticated;

-- ---------------------------------------------------------------------
-- review_author_stats: bir review''ın yazarının itibar anlık görüntüsü —
-- yalnızca review_id + sayılar, ASLA doctor_id. Herkese açık.
-- ---------------------------------------------------------------------
create view review_author_stats as
select
  r.id as review_id,
  dr.review_count as author_review_count,
  dr.helpful_votes as author_helpful_votes,
  dr.reputation_score as author_reputation_score,
  dr.is_verified as author_is_verified
from reviews r
join doctor_workplaces dw on dw.id = r.doctor_workplace_id
join doctor_reputation dr on dr.doctor_id = dw.doctor_id;

comment on view review_author_stats is
  'Bir review''ın yazarının itibarı — ASLA doctor_id döndürmez, yalnızca sayılar. Bu, "review kartında itibar göster" isteği ile "hekim dizini olmasın" ilkesini uzlaştırıyor.';

grant select on review_author_stats to anon, authenticated;

-- ---------------------------------------------------------------------
-- clinic_review_stats güncellemesi: yalnızca onaylı review''ları say,
-- ve toplam faydalı oy sayısını ekle.
-- ---------------------------------------------------------------------
drop view if exists clinic_review_stats;

create view clinic_review_stats
with (security_invoker = true) as
select
  c.id as clinic_id,
  count(r.id) as review_count,
  avg(rs.incentive_score) as avg_incentive_score,
  avg(rs.colleague_score) as avg_colleague_score,
  avg(rs.management_score) as avg_management_score,
  avg(rs.city_score) as avg_city_score,
  avg(rs.education_score) as avg_education_score,
  avg(rs.academic_score) as avg_academic_score,
  avg(
    (rs.incentive_score + rs.colleague_score + rs.management_score
     + rs.city_score + rs.education_score + rs.academic_score) / 6.0
  ) as avg_overall_score,
  avg(r.monthly_shifts) as avg_monthly_shifts,
  avg(r.daily_patients) as avg_daily_patients,
  avg(r.service_patients) as avg_service_patients,
  (count(*) filter (where r.would_choose_again))::numeric
    / nullif(count(r.id), 0) * 100 as recommend_percentage,
  coalesce(sum(rhc.helpful_count), 0) as total_helpful_votes
from clinics c
left join reviews r on r.clinic_id = c.id and r.status = 'approved'
left join review_scores rs on rs.review_id = r.id
left join review_helpful_counts rhc on rhc.review_id = r.id
group by c.id;

comment on view clinic_review_stats is
  'Sprint 7: yalnızca status=approved review''lar sayılıyor (moderasyonla gizlenmiş bir yorum istatistikleri şişirmemeli). total_helpful_votes eklendi.';

grant select on clinic_review_stats to anon, authenticated;

-- rank_clinics_by_branch bu view''ı kullandığı için otomatik olarak
-- yalnızca onaylı review'ları yansıtacak (fonksiyon değişmedi, view
-- tanımı değişti).

-- ---------------------------------------------------------------------
-- RLS: reviews — herkese açık okuma artık "approved" ile sınırlı, ama
-- yazar kendi review''unu (durumu ne olursa olsun) görebilmeli. DELETE
-- politikası da eklendi (Sprint 5''te yalnızca select/insert/update vardı).
-- ---------------------------------------------------------------------
drop policy if exists reviews_public_read on reviews;

create policy reviews_public_read on reviews
  for select using (
    status = 'approved'
    or exists (
      select 1 from doctor_workplaces dw
      where dw.id = doctor_workplace_id and dw.doctor_id = auth.uid()
    )
  );

create policy reviews_delete_own on reviews
  for delete using (
    exists (
      select 1 from doctor_workplaces dw
      where dw.id = doctor_workplace_id and dw.doctor_id = auth.uid()
    )
  );

-- review_scores: aynı mantık, silme eklendi.
create policy review_scores_delete_own on review_scores
  for delete using (
    exists (
      select 1 from reviews r
      join doctor_workplaces dw on dw.id = r.doctor_workplace_id
      where r.id = review_id and dw.doctor_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- reports: Sprint 2''den beri "her şeyi reddet" placeholder''dı, bu
-- sprint gerçekten aktif hale getiriyor. Herkes (kimliği doğrulanmış)
-- rapor gönderebilir; raporları yalnızca gönderen kendi raporunu
-- görebilir (moderatör paneli gelene kadar başka görünürlük yok).
-- ---------------------------------------------------------------------
drop policy if exists reports_no_access_placeholder on reports;

create policy reports_insert_authenticated on reports
  for insert with check (auth.uid() = doctor_id);
create policy reports_select_own on reports
  for select using (auth.uid() = doctor_id);

-- ---------------------------------------------------------------------
-- Otomatik gizleme: bir review, FARKLI hekimlerden en az 3 (henüz
-- sonuçlandırılmamış) rapor aldıysa, insan moderatörü beklemeden
-- 'pending'e çekilir. Bu, "moderasyon altyapısının" moderatör paneli
-- olmadan da bir şey ifade etmesini sağlıyor.
-- ---------------------------------------------------------------------
create or replace function flag_heavily_reported_reviews()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_distinct_reporters integer;
begin
  select count(distinct doctor_id)
    into v_distinct_reporters
    from reports
    where review_id = new.review_id
      and status = 'pending';

  if v_distinct_reporters >= 3 then
    update reviews set status = 'pending' where id = new.review_id and status = 'approved';
  end if;

  return new;
end;
$$;

comment on function flag_heavily_reported_reviews is
  'Bir review 3+ farklı hekimden bekleyen rapor aldığında otomatik olarak pending''e çeker (approved''dan). SECURITY DEFINER: raporlayan kullanıcı bu review''un sahibi olmadığı için, kendi RLS''i ile bu güncellemeyi yapamaz — fonksiyon bu yüzden RLS''i güvenle atlıyor (yalnızca bu dar, önceden tanımlı işlemi yapıyor). İnsan moderatörü panosu gelene kadar geçici bir koruma.';

create trigger reports_flag_reviews
  after insert on reports
  for each row
  execute function flag_heavily_reported_reviews();

-- ---------------------------------------------------------------------
-- update_review: kendi review''unu düzenleme. reviews + review_scores''u
-- tek transaction''da günceller (submit_review ile aynı atomiklik
-- gerekçesi). Sahiplik kontrolü fonksiyon içinde açıkça yapılıyor —
-- RLS zaten engelleyecek olsa da, kullanıcıya net bir hata mesajı vermek
-- için burada da kontrol ediliyor.
-- ---------------------------------------------------------------------
create or replace function update_review(
  p_review_id uuid,
  p_monthly_shifts integer,
  p_daily_patients integer,
  p_service_patients integer,
  p_would_choose_again boolean,
  p_comment text,
  p_incentive_score integer,
  p_colleague_score integer,
  p_management_score integer,
  p_city_score integer,
  p_education_score integer,
  p_academic_score integer
)
returns void
language plpgsql
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_owns boolean;
begin
  if v_doctor_id is null then
    raise exception 'Bu işlem için giriş yapmalısınız';
  end if;

  select exists (
    select 1 from reviews r
    join doctor_workplaces dw on dw.id = r.doctor_workplace_id
    where r.id = p_review_id and dw.doctor_id = v_doctor_id
  ) into v_owns;

  if not v_owns then
    raise exception 'Bu değerlendirmeyi düzenleme yetkin yok';
  end if;

  update reviews set
    monthly_shifts = p_monthly_shifts,
    daily_patients = p_daily_patients,
    service_patients = p_service_patients,
    would_choose_again = p_would_choose_again,
    comment = p_comment
  where id = p_review_id;

  update review_scores set
    incentive_score = p_incentive_score,
    colleague_score = p_colleague_score,
    management_score = p_management_score,
    city_score = p_city_score,
    education_score = p_education_score,
    academic_score = p_academic_score
  where review_id = p_review_id;
end;
$$;

comment on function update_review is
  'Kendi review''unu (ve puanlarını) tek transaction''da günceller. reviews.updated_at, var olan set_updated_at trigger''ı ile otomatik ilerler — "Düzenlendi" göstergesi bunu kullanır.';

grant execute on function update_review to authenticated;
