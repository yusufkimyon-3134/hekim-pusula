-- Preserve old clinic IDs as aliases, and preserve every review/workplace/favorite.
-- Seeded branch records are not evidence of current hospital service availability.
alter table public.clinics
  add column merged_into_id uuid references public.clinics(id) on delete restrict,
  add column availability_verified boolean not null default false,
  add column availability_source text,
  add constraint clinics_no_self_merge check (merged_into_id is distinct from id),
  add constraint clinics_availability_requires_source check
    (not availability_verified or nullif(btrim(availability_source), '') is not null);
create index clinics_merged_into_id_idx on public.clinics(merged_into_id);
comment on column public.clinics.availability_verified is
  'Current hospital service confirmed against a documented source. Seed data and user identity verification do not confirm availability.';
comment on column public.clinics.merged_into_id is
  'Canonical clinic for a legacy synonym. Old IDs remain valid redirect targets.';

create temporary table clinic_merge_map on commit drop as
with aliases(old_branch, new_branch) as (values
  ('Anestezi', 'Anesteziyoloji ve Reanimasyon'),
  ('Biyokimya', 'Tıbbi Biyokimya'),
  ('Çocuk Hastalıkları', 'Çocuk Sağlığı ve Hastalıkları'),
  ('Çocuk Ruh Sağlığı ve Hastalıkları', 'Çocuk ve Ergen Ruh Sağlığı ve Hastalıkları'),
  ('Dahiliye', 'İç Hastalıkları'),
  ('Enfeksiyon Hastalıkları', 'Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji'),
  ('Fizik Tedavi ve Rehabilitasyon', 'Fiziksel Tıp ve Rehabilitasyon'),
  ('Göğüs Hastalıkları ve TBC', 'Göğüs Hastalıkları'),
  ('Kulak Burun Boğaz', 'Kulak Burun Boğaz Hastalıkları'),
  ('Patoloji', 'Tıbbi Patoloji')
)
select legacy.id as old_id, canonical.id as new_id
from public.clinics legacy
join aliases a on legacy.branch = a.old_branch
join public.clinics canonical on canonical.hospital_id = legacy.hospital_id and canonical.branch = a.new_branch;

-- Fail atomically instead of dropping or overwriting any conflicting user records.
do $$
begin
  if exists (
    select 1 from public.doctor_workplaces a join clinic_merge_map m on a.clinic_id=m.old_id
    join public.doctor_workplaces b on b.clinic_id=m.new_id and b.doctor_id=a.doctor_id
    where a.is_current and b.is_current
  ) or exists (
    select 1 from public.reviews a join public.doctor_workplaces wa on wa.id=a.doctor_workplace_id
    join clinic_merge_map m on a.clinic_id=m.old_id
    join public.reviews b on b.clinic_id=m.new_id
    join public.doctor_workplaces wb on wb.id=b.doctor_workplace_id and wb.doctor_id=wa.doctor_id
  ) or exists (
    select 1 from public.favorites a join clinic_merge_map m on a.clinic_id=m.old_id
    join public.favorites b on b.clinic_id=m.new_id and b.doctor_id=a.doctor_id
  ) then raise exception 'Clinic merge has conflicting user records; nothing was removed.';
  end if;
end $$;

-- The consistency trigger requires workplace to be moved before its review.
update public.doctor_workplaces w set clinic_id=m.new_id from clinic_merge_map m where w.clinic_id=m.old_id;
update public.reviews r set clinic_id=m.new_id from clinic_merge_map m where r.clinic_id=m.old_id;
update public.favorites f set clinic_id=m.new_id from clinic_merge_map m where f.clinic_id=m.old_id;
update public.clinics c set merged_into_id=m.new_id from clinic_merge_map m where c.id=m.old_id;

-- Retain search permissions, signatures, security attributes and synonym logic.
-- Exclude legacy aliases from both search results and autocomplete suggestions.
do $$
declare f record; definition text;
begin
  for f in select oid from pg_proc where pronamespace='public'::regnamespace
    and proname in ('search_clinics', 'search_suggestions')
  loop
    definition := pg_get_functiondef(f.oid);
    if position('from clinics c' in definition)=0 then raise exception 'Unexpected search definition'; end if;
    definition := replace(definition, 'from clinics c', 'from (select * from public.clinics where merged_into_id is null) c');
    execute definition;
  end loop;
end $$;

-- Guests and unverified accounts search metadata without touching private review views.
-- The verified branch retains the existing advanced filters and ranking logic.
do $migration$
declare definition text; body text; marker text := '$function$';
begin
  select pg_get_functiondef(oid) into definition from pg_proc
  where pronamespace='public'::regnamespace and proname='search_clinics';
  body := split_part(definition, marker, 2);
  definition := replace(split_part(definition, marker, 1), 'LANGUAGE sql', 'LANGUAGE plpgsql')
    || marker || $wrapper$
begin
  if auth.uid() is null or not exists (
    select 1 from public.doctors d where d.id=auth.uid() and d.is_verified
  ) then
    return query
      select c.id, c.branch, h.id, h.name, h.city, h.district, h.hospital_type
      from public.clinics c join public.hospitals h on h.id=c.hospital_id
      where c.merged_into_id is null
        and (filter_city is null or h.city=filter_city)
        and (filter_hospital_type is null or h.hospital_type=filter_hospital_type)
        and not exists (
          select 1 from unnest(string_to_array(trim(coalesce(search_query,'')), ' ')) as t(tok)
          where t.tok <> '' and not (
            c.branch ilike '%' || t.tok || '%' or h.name ilike '%' || t.tok || '%'
            or h.city ilike '%' || t.tok || '%' or h.district ilike '%' || t.tok || '%'
            or exists (select 1 from public.branch_synonyms bs
              where bs.synonym=lower(t.tok) and bs.official_branch=c.branch)
          )
        )
      order by h.name, c.branch;
    return;
  end if;
  return query
$wrapper$ || body || E'\nend;\n' || marker || ';';
  execute definition;
end $migration$;

-- Old saved links and clients must submit to the canonical clinic too.
do $migration$
declare definition text;
begin
  select pg_get_functiondef(oid) into definition from pg_proc
  where pronamespace='public'::regnamespace and proname='submit_review';
  if position(E'begin\n' in definition)=0 then raise exception 'Unexpected submit_review definition'; end if;
  definition := replace(definition, E'begin\n', E'begin\n  p_clinic_id := coalesce((select c.merged_into_id from public.clinics c where c.id=p_clinic_id), p_clinic_id);\n');
  execute definition;
end $migration$;

-- Keep common short names searchable after canonicalizing the branch records.
update public.branch_synonyms set official_branch='Kulak Burun Boğaz Hastalıkları'
where official_branch='Kulak Burun Boğaz';
insert into public.branch_synonyms(synonym, official_branch) values
  ('anestezi','Anesteziyoloji ve Reanimasyon'),
  ('biyokimya','Tıbbi Biyokimya'),
  ('patoloji','Tıbbi Patoloji'),
  ('fizik tedavi','Fiziksel Tıp ve Rehabilitasyon')
on conflict (synonym) do update set official_branch=excluded.official_branch;
