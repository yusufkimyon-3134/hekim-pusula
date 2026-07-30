-- Sprint 6 — Clinic Intelligence & Comparison
--
-- ÖNEMLİ ŞEMA NOTU: Görev tanımı "Education quality" ve "Academic
-- opportunities" gibi boyutlar istiyor. Bu, Sprint 5'te de istenmiş
-- (o zaman var olan sütunlara en yakın anlamlı eşleme yapılmıştı) ve
-- şimdi karşılaştırma/sıralama özelliğinin doğrudan bu isimler üzerine
-- kurulu olması isteniyor. Bu kez, iki sprinttir tekrarlanan ve özelliğin
-- merkezinde olan bu iki boyut için GERÇEKTEN yeni sütun eklemek
-- (var olmayan bir şeyi başka bir adla göstermekten) daha dürüst —
-- bu yüzden `review_scores`'a `education_score` ve `academic_score`
-- eklendi. Diğer 6 karşılaştırma boyutu var olan alanlara eşleniyor:
--   Financial satisfaction -> incentive_score (zaten "döner sermaye/ek ödeme")
--   Social environment     -> colleague_score (zaten "meslektaş ilişkileri")
--   Faculty support        -> management_score (zaten "yönetim desteği")
--   Workload                -> daily_patients + service_patients (gerçek sayı, uydurma puan değil)
--   Night shifts            -> monthly_shifts (gerçek sayı)
--   Overall score           -> altı puanın ortalaması (aşağıdaki view'da hesaplanır, ayrı sütun yok)
-- `city_score` bu 8 boyutun hiçbirine tam oturmuyor; kaldırılmadı
-- (var olan veriyi bozmamak için), yalnızca bu karşılaştırma özelliğinde
-- kullanılmıyor.

alter table review_scores
  add column education_score integer not null default 3
    check (education_score between 1 and 5),
  add column academic_score integer not null default 3
    check (academic_score between 1 and 5);

comment on column review_scores.education_score is
  'Sprint 6: eğitim kalitesi (asistan/pratisyen eğitimi). Var olan satırlar için varsayılan 3 ile dolduruldu.';
comment on column review_scores.academic_score is
  'Sprint 6: akademik fırsatlar (yayın, kongre, araştırma imkanı). Var olan satırlar için varsayılan 3 ile dolduruldu.';

-- ---------------------------------------------------------------------
-- clinic_review_stats: her klinik için özet istatistikler. Karşılaştırma,
-- sıralama ve klinik detay sayfasındaki "İstatistikler" bölümü bunu kullanır.
-- LEFT JOIN: hiç yorumu olmayan bir klinik de satır olarak görünür
-- (review_count=0, ortalamalar null) — "henüz veri yok" durumunu doğal
-- şekilde ifade eder.
-- ---------------------------------------------------------------------
create or replace view clinic_review_stats
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
    / nullif(count(r.id), 0) * 100 as recommend_percentage
from clinics c
left join reviews r on r.clinic_id = c.id
left join review_scores rs on rs.review_id = r.id
group by c.id;

comment on view clinic_review_stats is
  '"Overall score" = altı alt puanın ortalaması; ayrı bir sütun olarak saklanmaz, burada hesaplanır. Yorumu olmayan klinikler de review_count=0 ile listede görünür.';

grant select on clinic_review_stats to anon, authenticated;

-- ---------------------------------------------------------------------
-- rank_clinics_by_branch: bir branş için tüm klinikleri, seçilen boyuta
-- göre sıralı döner. Skor boyutlarında yüksek=iyi (desc), "workload" ve
-- "night_shifts"te düşük=iyi (asc) — sıralama yönü ölçütün anlamına göre
-- otomatik seçiliyor, kullanıcıdan ayrıca yön istenmiyor.
-- ---------------------------------------------------------------------
create or replace function rank_clinics_by_branch(
  p_branch text,
  p_sort_by text default 'overall'
)
returns table (
  clinic_id uuid,
  branch text,
  hospital_id uuid,
  hospital_name text,
  hospital_city text,
  hospital_district text,
  hospital_type hospital_type,
  review_count bigint,
  avg_overall_score numeric,
  avg_education_score numeric,
  avg_academic_score numeric,
  avg_monthly_shifts numeric,
  avg_workload numeric,
  recommend_percentage numeric
)
language sql
stable
as $$
  select
    c.id,
    c.branch,
    h.id,
    h.name,
    h.city,
    h.district,
    h.hospital_type,
    coalesce(s.review_count, 0),
    s.avg_overall_score,
    s.avg_education_score,
    s.avg_academic_score,
    s.avg_monthly_shifts,
    (s.avg_daily_patients + s.avg_service_patients) as avg_workload,
    s.recommend_percentage
  from clinics c
  join hospitals h on h.id = c.hospital_id
  left join clinic_review_stats s on s.clinic_id = c.id
  where c.branch = p_branch
  order by
    (case when p_sort_by = 'education' then s.avg_education_score end) desc nulls last,
    (case when p_sort_by = 'academic' then s.avg_academic_score end) desc nulls last,
    (case when p_sort_by = 'workload' then (s.avg_daily_patients + s.avg_service_patients) end) asc nulls last,
    (case when p_sort_by = 'night_shifts' then s.avg_monthly_shifts end) asc nulls last,
    (case when p_sort_by not in ('education', 'academic', 'workload', 'night_shifts') then s.avg_overall_score end) desc nulls last,
    h.name asc;
$$;

comment on function rank_clinics_by_branch is
  'Bir branş için klinikleri sıralar. p_sort_by: overall (varsayılan) | education | academic | workload | night_shifts. Skor boyutları desc (yüksek=iyi), workload/night_shifts asc (düşük=iyi).';

grant execute on function rank_clinics_by_branch to anon, authenticated;

-- ---------------------------------------------------------------------
-- submit_review: education_score ve academic_score parametreleri eklendi.
-- İmza değiştiği için önce eski imzalı fonksiyon düşürülüyor (aksi halde
-- `create or replace` yeni bir overload oluşturur, eskisini silmez).
-- ---------------------------------------------------------------------
drop function if exists submit_review(
  uuid, integer, integer, integer, boolean, text, integer, integer, integer, integer
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
  p_academic_score integer
)
returns uuid
language plpgsql
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_workplace_id uuid;
  v_review_id uuid;
begin
  if v_doctor_id is null then
    raise exception 'Bu işlem için giriş yapmalısınız';
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
    service_patients, would_choose_again, comment
  ) values (
    v_workplace_id, p_clinic_id, p_monthly_shifts, p_daily_patients,
    p_service_patients, p_would_choose_again, p_comment
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
  'Kimliği doğrulanmış çağıran hekim adına (auth.uid()) bir klinik için değerlendirme gönderir. Sprint 6: education_score/academic_score eklendi.';

grant execute on function submit_review to authenticated;

-- ---------------------------------------------------------------------
-- search_clinics: gelişmiş arama filtreleri eklendi (minimum genel puan,
-- minimum eğitim puanı, minimum akademik puan, maksimum aylık nöbet).
-- "Workload score" harfiyen uygulanmadı — böyle bir puan yok; bunun
-- yerine gerçek "aylık nöbet sayısı" eşiği kullanıldı (uydurma bir puan
-- yerine somut, anlamlı bir sayı).
-- ---------------------------------------------------------------------
drop function if exists search_clinics(text, text, hospital_type);

create or replace function search_clinics(
  search_query text default null,
  filter_city text default null,
  filter_hospital_type hospital_type default null,
  filter_min_overall numeric default null,
  filter_min_education numeric default null,
  filter_min_academic numeric default null,
  filter_max_monthly_shifts numeric default null
)
returns table (
  clinic_id uuid,
  branch text,
  hospital_id uuid,
  hospital_name text,
  hospital_city text,
  hospital_district text,
  hospital_type hospital_type
)
language sql
stable
as $$
  select
    c.id as clinic_id,
    c.branch,
    h.id as hospital_id,
    h.name as hospital_name,
    h.city as hospital_city,
    h.district as hospital_district,
    h.hospital_type
  from clinics c
  join hospitals h on h.id = c.hospital_id
  left join clinic_review_stats s on s.clinic_id = c.id
  cross join lateral (
    select
      coalesce(array_agg(tok), array[]::text[]) as tokens
    from unnest(string_to_array(trim(coalesce(search_query, '')), ' ')) as tok
    where tok <> ''
  ) q
  cross join lateral (
    select coalesce(sum(greatest(
      similarity(c.branch, t.tok),
      similarity(h.name, t.tok),
      similarity(h.city, t.tok),
      similarity(h.district, t.tok),
      (
        select 1.0
        from branch_synonyms bs
        where bs.synonym = lower(t.tok) and bs.official_branch = c.branch
        limit 1
      )
    )), 0) as score
    from unnest(q.tokens) as t(tok)
  ) sc
  where
    (filter_city is null or h.city = filter_city)
    and (filter_hospital_type is null or h.hospital_type = filter_hospital_type)
    and (filter_min_overall is null or s.avg_overall_score >= filter_min_overall)
    and (filter_min_education is null or s.avg_education_score >= filter_min_education)
    and (filter_min_academic is null or s.avg_academic_score >= filter_min_academic)
    and (filter_max_monthly_shifts is null or s.avg_monthly_shifts <= filter_max_monthly_shifts)
    and (
      array_length(q.tokens, 1) is null
      or not exists (
        select 1 from unnest(q.tokens) as tok
        where not (
          c.branch ilike '%' || tok || '%'
          or h.name ilike '%' || tok || '%'
          or h.city ilike '%' || tok || '%'
          or h.district ilike '%' || tok || '%'
          or exists (
            select 1 from branch_synonyms bs
            where bs.synonym = lower(tok) and bs.official_branch = c.branch
          )
        )
      )
    )
  order by sc.score desc, h.name asc, c.branch asc;
$$;

comment on function search_clinics is
  'clinics + hospitals için çok kelimeli arama + alaka sıralaması + branş eşanlamlıları (Sprint 3), artık isteğe bağlı minimum puan / maksimum nöbet filtreleriyle (Sprint 6). Bir eşik verilip ilgili klinik için henüz hiç yorum yoksa (ortalama null), o eşik sağlanmamış sayılır ve klinik listeden çıkar — bu kasıtlı: "en az 4 puan iste" dendiğinde hiç puanlanmamış bir klinik gösterilmemeli.';

grant execute on function search_clinics to anon, authenticated;
