-- Sprint 8 — AI Career Advisor
--
-- ÖNEMLİ MİMARİ KARAR: "AI asla veri uydurmasın" ilkesi gereği, bu
-- sprintteki özelliklerin YALNIZCA BİR KISMI gerçekten bir LLM çağrısı
-- kullanıyor (klinik özeti, karşılaştırma özeti — doğal dil üretimi
-- gerektiren, tekil metinler). Geri kalan her şey KASITLI OLARAK
-- deterministik SQL/hesaplama:
--   - "Compatibility score" (kariyer eşleştirme) — bir LLM'in bir uyum
--     puanı "tahmin etmesi" tam da önlenmek istenen türden bir uydurma
--     olurdu. Bu yüzden ağırlıklı, açıklanabilir bir formülle
--     (uygulama katmanında) hesaplanıyor, DB yalnızca ham istatistikleri
--     sağlıyor.
--   - "En iyi klinikler / en çok gelişenler / trend branşlar / en çok
--     konuşulan hastaneler" (AI Dashboard) — bunlar gerçek, zaman
--     aralıklı SQL agregasyonları (aşağıda), bir LLM'e hiç ihtiyaç yok.
--   - Konu tespiti (review_topics) — anahtar kelime tabanlı, deterministik
--     bir sınıflandırıcı (uygulama katmanında, `src/lib/ai/adapters/`).
--     Gelecekte bir LLM sınıflandırıcıyla değiştirilebilir şekilde
--     tasarlandı, ama şu an sıfır halüsinasyon riski taşıyan bu yöntem
--     tercih edildi.

create type review_topic as enum (
  'education',
  'workload',
  'faculty',
  'research',
  'night_shifts',
  'financial_satisfaction',
  'social_environment'
);

-- ---------------------------------------------------------------------
-- review_topics: bir review'ın yorumunda tespit edilen konular.
-- Bileşik PK: aynı konu aynı review için iki kez eklenemez.
-- ---------------------------------------------------------------------
create table review_topics (
  review_id uuid not null references reviews (id) on delete cascade,
  topic review_topic not null,
  created_at timestamptz not null default now(),
  primary key (review_id, topic)
);

comment on table review_topics is
  'Bir review yorumunda anahtar kelime tabanlı sınıflandırıcı (bkz. src/lib/ai/adapters/keyword-topic-classifier.ts) tarafından tespit edilen konular. Review gönderildiğinde/düzenlendiğinde uygulama katmanı tarafından doldurulur — bir DB trigger''ı değil, çünkü sınıflandırma mantığı TypeScript''te yaşıyor (SQL''e taşımak gereksiz karmaşıklık olurdu).';

create index review_topics_topic_idx on review_topics (topic);

alter table review_topics enable row level security;

-- Herkese açık okuma, ama yalnızca ilgili review onaylıysa YA DA
-- yazarıysan (reviews_public_read ile aynı mantık).
create policy review_topics_public_read on review_topics
  for select using (
    exists (
      select 1 from reviews r
      where r.id = review_id
        and (
          r.status = 'approved'
          or exists (
            select 1 from doctor_workplaces dw
            where dw.id = r.doctor_workplace_id and dw.doctor_id = auth.uid()
          )
        )
    )
  );

-- INSERT/DELETE: yalnızca kendi review'un için (uygulama, review
-- gönderildikten/düzenlendikten hemen sonra aynı oturumda bu tabloyu dolduruyor).
create policy review_topics_insert_own on review_topics
  for insert with check (
    exists (
      select 1 from reviews r
      join doctor_workplaces dw on dw.id = r.doctor_workplace_id
      where r.id = review_id and dw.doctor_id = auth.uid()
    )
  );
create policy review_topics_delete_own on review_topics
  for delete using (
    exists (
      select 1 from reviews r
      join doctor_workplaces dw on dw.id = r.doctor_workplace_id
      where r.id = review_id and dw.doctor_id = auth.uid()
    )
  );

grant select on review_topics to anon, authenticated;
grant insert, delete on review_topics to authenticated;

-- ---------------------------------------------------------------------
-- top_clinics_this_month: son 30 gün içinde en az 1 onaylı yorum almış
-- klinikler arasında en yüksek genel puanlılar.
-- ---------------------------------------------------------------------
create or replace function top_clinics_this_month(p_limit integer default 5)
returns table (
  clinic_id uuid,
  branch text,
  hospital_id uuid,
  hospital_name text,
  hospital_city text,
  avg_overall_score numeric,
  review_count bigint
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
    avg(
      (rs.incentive_score + rs.colleague_score + rs.management_score
       + rs.city_score + rs.education_score + rs.academic_score) / 6.0
    ) as avg_overall_score,
    count(r.id) as review_count
  from reviews r
  join clinics c on c.id = r.clinic_id
  join hospitals h on h.id = c.hospital_id
  join review_scores rs on rs.review_id = r.id
  where r.status = 'approved'
    and r.created_at >= now() - interval '30 days'
  group by c.id, h.id
  order by avg_overall_score desc, review_count desc
  limit p_limit;
$$;

comment on function top_clinics_this_month is
  'Son 30 günde en az bir onaylı yorum almış klinikler arasında ortalama genel puana göre en iyiler. Tamamen deterministik SQL — LLM kullanılmıyor.';

grant execute on function top_clinics_this_month to anon, authenticated;

-- ---------------------------------------------------------------------
-- most_improved_clinics: son 30 gün ortalaması, önceki 30 güne göre en
-- çok artan klinikler (her iki dönemde de en az 1 onaylı yorum şart).
-- ---------------------------------------------------------------------
create or replace function most_improved_clinics(p_limit integer default 5)
returns table (
  clinic_id uuid,
  branch text,
  hospital_id uuid,
  hospital_name text,
  hospital_city text,
  recent_avg numeric,
  previous_avg numeric,
  improvement numeric
)
language sql
stable
as $$
  with recent as (
    select
      r.clinic_id,
      avg(
        (rs.incentive_score + rs.colleague_score + rs.management_score
         + rs.city_score + rs.education_score + rs.academic_score) / 6.0
      ) as avg_score
    from reviews r
    join review_scores rs on rs.review_id = r.id
    where r.status = 'approved' and r.created_at >= now() - interval '30 days'
    group by r.clinic_id
  ),
  previous as (
    select
      r.clinic_id,
      avg(
        (rs.incentive_score + rs.colleague_score + rs.management_score
         + rs.city_score + rs.education_score + rs.academic_score) / 6.0
      ) as avg_score
    from reviews r
    join review_scores rs on rs.review_id = r.id
    where r.status = 'approved'
      and r.created_at >= now() - interval '60 days'
      and r.created_at < now() - interval '30 days'
    group by r.clinic_id
  )
  select
    c.id,
    c.branch,
    h.id,
    h.name,
    h.city,
    recent.avg_score,
    previous.avg_score,
    (recent.avg_score - previous.avg_score) as improvement
  from recent
  join previous on previous.clinic_id = recent.clinic_id
  join clinics c on c.id = recent.clinic_id
  join hospitals h on h.id = c.hospital_id
  where recent.avg_score > previous.avg_score
  order by improvement desc
  limit p_limit;
$$;

comment on function most_improved_clinics is
  'Son 30 gün vs önceki 30 gün ortalama puan karşılaştırması — yalnızca HER İKİ dönemde de veri olan klinikler için (aksi halde "gelişme" anlamsız olurdu). Tamamen deterministik.';

grant execute on function most_improved_clinics to anon, authenticated;

-- ---------------------------------------------------------------------
-- trending_specialties: son 30 günde en çok yeni yorum alan branşlar.
-- ---------------------------------------------------------------------
create or replace function trending_specialties(p_limit integer default 5)
returns table (
  branch text,
  recent_review_count bigint
)
language sql
stable
as $$
  select c.branch, count(r.id) as recent_review_count
  from reviews r
  join clinics c on c.id = r.clinic_id
  where r.status = 'approved' and r.created_at >= now() - interval '30 days'
  group by c.branch
  order by recent_review_count desc
  limit p_limit;
$$;

grant execute on function trending_specialties to anon, authenticated;

-- ---------------------------------------------------------------------
-- most_discussed_hospitals: son 30 günde en çok (onaylı) yorum toplayan
-- hastaneler (tüm klinikleri toplu).
-- ---------------------------------------------------------------------
create or replace function most_discussed_hospitals(p_limit integer default 5)
returns table (
  hospital_id uuid,
  hospital_name text,
  hospital_city text,
  recent_review_count bigint
)
language sql
stable
as $$
  select h.id, h.name, h.city, count(r.id) as recent_review_count
  from reviews r
  join clinics c on c.id = r.clinic_id
  join hospitals h on h.id = c.hospital_id
  where r.status = 'approved' and r.created_at >= now() - interval '30 days'
  group by h.id
  order by recent_review_count desc
  limit p_limit;
$$;

grant execute on function most_discussed_hospitals to anon, authenticated;
