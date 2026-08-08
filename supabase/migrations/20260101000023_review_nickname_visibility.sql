-- Yorum Bazlı Rumuz Görünürlüğü
--
-- Her yorum varsayılan olarak anonim kalır. Hekim, yorum yazarken/
-- düzenlerken isteğe bağlı olarak "Rumuzumu bu yorumda göster"
-- seçeneğini işaretleyebilir — yalnızca O YORUMDA rumuzu (doctors.nickname,
-- zaten seçilmiş bir takma ad; gerçek ad/e-posta/kullanıcı ID'si/belge
-- bilgisi DEĞİL) görünür olur.
--
-- GÜVENLİK TASARIMI: Görünürlük kontrolü İSTEMCİ TARAFINDA değil,
-- VERİTABANI SEVİYESİNDE yapılıyor — `review_author_stats` view'ı,
-- show_nickname=false olan satırlar için `visible_nickname`'i SQL
-- içinde null'a çeviriyor. Bu, view'ı doğrudan sorgulayan biri için bile
-- rumuzun sızmamasını garanti eder (yalnızca ön yüzde gizlemekten farklı
-- ve daha güvenli). `doctor_id` bu view'dan hâlâ ASLA dönmüyor (Sprint
-- 7'deki ilke korunuyor).

-- ---------------------------------------------------------------------
-- 1) reviews.show_nickname — varsayılan false, mevcut yorumlar etkilenmez.
-- ---------------------------------------------------------------------
alter table reviews add column show_nickname boolean not null default false;

comment on column reviews.show_nickname is
  'true ise, bu yorumun yazarının rumuzu (doctors.nickname) herkese açık şekilde gösterilir. Varsayılan false — her yorum anonim başlar.';

-- ---------------------------------------------------------------------
-- 2) review_author_stats: visible_nickname eklendi (doctor_id hâlâ yok).
-- ---------------------------------------------------------------------
drop view if exists review_author_stats;

create view review_author_stats as
select
  r.id as review_id,
  dr.review_count as author_review_count,
  dr.helpful_votes as author_helpful_votes,
  dr.reputation_score as author_reputation_score,
  dr.is_verified as author_is_verified,
  case when r.show_nickname then d.nickname else null end as visible_nickname
from reviews r
join doctor_workplaces dw on dw.id = r.doctor_workplace_id
join doctor_reputation dr on dr.doctor_id = dw.doctor_id
join doctors d on d.id = dw.doctor_id;

comment on view review_author_stats is
  'Bir review''ın yazarının itibarı + (yalnızca show_nickname=true ise) rumuzu — ASLA doctor_id döndürmez. visible_nickname, show_nickname=false olan satırlar için SQL seviyesinde null''dır (yalnızca ön yüzde gizlenmiyor).';

grant select on review_author_stats to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3) submit_review: p_show_nickname parametresi eklendi (sona, varsayılanı
-- false — mevcut çağrılar/imza geriye dönük uyumlu).
--
-- ÖNEMLİ: Yeni bir parametre eklemek `create or replace function` için
-- YENİ bir aşırı yükleme (overload) sayılır (aynı isim, farklı imza) —
-- eskisinin YERİNE geçmez, YANINA eklenir. Bu da "function name is not
-- unique" hatasına yol açar. Bu yüzden eski (12 parametreli) imzayı
-- ÖNCE açıkça drop ediyoruz (Sprint 6'da education/academic_score
-- eklenirken de aynı desen kullanılmıştı).
-- ---------------------------------------------------------------------
drop function if exists submit_review(
  uuid, integer, integer, integer, boolean, text,
  integer, integer, integer, integer, integer, integer
);

create or replace function submit_review(
  p_clinic_id uuid,
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
  p_academic_score integer,
  p_show_nickname boolean default false
)
returns uuid
language plpgsql
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_is_verified boolean;
  v_workplace_id uuid;
  v_review_id uuid;
begin
  if v_doctor_id is null then
    raise exception 'Bu işlem için giriş yapmalısınız';
  end if;

  select is_verified into v_is_verified from doctors where id = v_doctor_id;

  if v_is_verified is not true then
    raise exception 'Yorum yazabilmek için hekim doğrulamasını tamamlamış olman gerekiyor. Profilinden belge yükleyerek başvurabilirsin.';
  end if;

  select id into v_workplace_id
  from doctor_workplaces
  where doctor_id = v_doctor_id and clinic_id = p_clinic_id
  order by created_at desc
  limit 1;

  if v_workplace_id is null then
    insert into doctor_workplaces (doctor_id, clinic_id, work_start_date, is_current, is_verified_workplace)
    values (v_doctor_id, p_clinic_id, current_date, true, false)
    returning id into v_workplace_id;
  end if;

  insert into reviews (
    doctor_workplace_id, clinic_id, monthly_shifts, daily_patients,
    service_patients, would_choose_again, comment, show_nickname
  ) values (
    v_workplace_id, p_clinic_id, p_monthly_shifts, p_daily_patients,
    p_service_patients, p_would_choose_again, p_comment, p_show_nickname
  ) returning id into v_review_id;

  insert into review_scores (
    review_id, incentive_score, colleague_score, management_score,
    city_score, education_score, academic_score
  ) values (
    v_review_id, p_incentive_score, p_colleague_score, p_management_score,
    p_city_score, p_education_score, p_academic_score
  );

  return v_review_id;
end;
$$;

comment on function submit_review is
  'Kimliği doğrulanmış VE hekim doğrulaması onaylanmış çağıran adına bir klinik için değerlendirme gönderir. p_show_nickname (varsayılan false): true ise bu yorumda yazarın rumuzu herkese açık gösterilir.';

grant execute on function submit_review to authenticated;

-- ---------------------------------------------------------------------
-- 4) update_review: aynı şekilde p_show_nickname eklendi (aynı
-- gerekçeyle önce eski imza drop ediliyor).
-- ---------------------------------------------------------------------
drop function if exists update_review(
  uuid, integer, integer, integer, boolean, text,
  integer, integer, integer, integer, integer, integer
);

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
  p_academic_score integer,
  p_show_nickname boolean default false
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
    comment = p_comment,
    show_nickname = p_show_nickname
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
  'Kendi review''unu (puanları + show_nickname dahil) tek transaction''da günceller.';

grant execute on function update_review to authenticated;
