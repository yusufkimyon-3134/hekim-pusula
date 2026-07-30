-- Sprint 3 (CTO ikinci geçiş — "Smart Hospital Search"): iki gerçek eksik
-- kapatılıyor:
-- 1) Arama sonuçları alaka düzeyine göre sıralanmıyordu (yalnızca
--    alfabetik). pg_trgm'in similarity() fonksiyonu ile bir alaka skoru
--    hesaplanıp buna göre sıralanıyor.
-- 2) "Dahiliye" gibi günlük dilde kullanılan terimler, resmi branş adıyla
--    (İç Hastalıkları) hiç örtüşmediği için hiç bulunamıyordu. Küçük bir
--    eşanlamlı sözlüğü ile bu kapatıldı.

create table branch_synonyms (
  synonym text primary key,
  official_branch text not null
);

comment on table branch_synonyms is
  'Günlük dilde kullanılan branş adlarını (örn. "dahiliye") resmi branş adına (örn. "İç Hastalıkları") eşler. clinics.branch''a katı bir FK değildir (branş serbest metindir) — en iyi çaba eşlemesidir.';

insert into branch_synonyms (synonym, official_branch) values
  ('dahiliye', 'İç Hastalıkları'),
  ('kbb', 'Kulak Burun Boğaz'),
  ('kadın doğum', 'Kadın Hastalıkları ve Doğum'),
  ('jinekoloji', 'Kadın Hastalıkları ve Doğum'),
  ('ortopedi', 'Ortopedi ve Travmatoloji'),
  ('göz', 'Göz Hastalıkları'),
  ('çocuk', 'Çocuk Sağlığı ve Hastalıkları'),
  ('pediatri', 'Çocuk Sağlığı ve Hastalıkları');

alter table branch_synonyms enable row level security;
create policy branch_synonyms_public_read
  on branch_synonyms
  for select
  using (true);

grant select on branch_synonyms to anon, authenticated;

-- ---------------------------------------------------------------------
-- search_hospitals: hospitals için alaka sıralamalı arama.
-- ---------------------------------------------------------------------
create or replace function search_hospitals(
  search_query text default null,
  filter_city text default null,
  filter_hospital_type hospital_type default null
)
returns table (
  id uuid,
  name text,
  city text,
  district text,
  hospital_type hospital_type
)
language sql
stable
as $$
  select h.id, h.name, h.city, h.district, h.hospital_type
  from hospitals h
  cross join lateral (
    select
      coalesce(array_agg(tok), array[]::text[]) as tokens
    from unnest(string_to_array(trim(coalesce(search_query, '')), ' ')) as tok
    where tok <> ''
  ) q
  cross join lateral (
    select coalesce(sum(greatest(
      similarity(h.name, t.tok),
      similarity(h.city, t.tok),
      similarity(h.district, t.tok)
    )), 0) as score
    from unnest(q.tokens) as t(tok)
  ) s
  where
    (filter_city is null or h.city = filter_city)
    and (filter_hospital_type is null or h.hospital_type = filter_hospital_type)
    and (
      array_length(q.tokens, 1) is null
      or not exists (
        select 1 from unnest(q.tokens) as tok
        where not (
          h.name ilike '%' || tok || '%'
          or h.city ilike '%' || tok || '%'
          or h.district ilike '%' || tok || '%'
        )
      )
    )
  order by s.score desc, h.name asc;
$$;

comment on function search_hospitals is
  'hospitals için çok kelimeli arama + pg_trgm similarity() ile alaka sıralaması (en iyi eşleşme önce). Kelimeler arası AND, alanlar arası OR.';

grant execute on function search_hospitals to anon, authenticated;

-- ---------------------------------------------------------------------
-- search_clinics: alaka sıralaması + branş eşanlamlıları eklendi.
-- ---------------------------------------------------------------------
create or replace function search_clinics(
  search_query text default null,
  filter_city text default null,
  filter_hospital_type hospital_type default null
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
      -- Eşanlamlı tam eşleşirse yüksek sabit bir skor (örn. "dahiliye"
      -- her ne kadar "İç Hastalıkları" ile trigram benzerliği düşük olsa da).
      (
        select 1.0
        from branch_synonyms bs
        where bs.synonym = lower(t.tok) and bs.official_branch = c.branch
        limit 1
      )
    )), 0) as score
    from unnest(q.tokens) as t(tok)
  ) s
  where
    (filter_city is null or h.city = filter_city)
    and (filter_hospital_type is null or h.hospital_type = filter_hospital_type)
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
  order by s.score desc, h.name asc, c.branch asc;
$$;

comment on function search_clinics is
  'clinics + hospitals için çok kelimeli arama + pg_trgm similarity() ile alaka sıralaması + branch_synonyms üzerinden günlük dil desteği (örn. "dahiliye" -> "İç Hastalıkları").';

grant execute on function search_clinics to anon, authenticated;
