-- Public search suggestions, private evaluation metadata
--
-- Kurum ve klinik keşfi anonim ziyaretçiye açıktır. Değerlendirme sayısı
-- yalnızca is_verified_doctor() true olduğunda döner. Review metinleri,
-- puanlar ve topic'ler 00031 RLS politikalarıyla korunmaya devam eder.

create or replace function search_suggestions(
  p_query text,
  p_limit integer default 8
)
returns table (
  result_type search_suggestion_type,
  id uuid,
  title text,
  subtitle text,
  review_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with access as (
    select is_verified_doctor() as can_see_reviews
  ),
  matched_hospitals as (
    select
      'hospital'::search_suggestion_type as result_type,
      h.id,
      h.name as title,
      h.district || ', ' || h.city as subtitle,
      case
        when a.can_see_reviews then coalesce(sum(crs.review_count), 0)::bigint
        else null::bigint
      end as review_count
    from hospitals h
    cross join access a
    left join clinics c on c.hospital_id = h.id
    left join clinic_review_stats crs on a.can_see_reviews and crs.clinic_id = c.id
    where
      length(trim(p_query)) >= 2
      and (
        h.name ilike '%' || trim(p_query) || '%'
        or h.city ilike '%' || trim(p_query) || '%'
        or h.district ilike '%' || trim(p_query) || '%'
      )
    group by h.id, h.name, h.district, h.city, a.can_see_reviews
  ),
  matched_clinics as (
    select
      'clinic'::search_suggestion_type as result_type,
      c.id,
      c.branch as title,
      h.name || ' · ' || h.district || ', ' || h.city as subtitle,
      case
        when a.can_see_reviews then coalesce(crs.review_count, 0)::bigint
        else null::bigint
      end as review_count
    from clinics c
    join hospitals h on h.id = c.hospital_id
    cross join access a
    left join clinic_review_stats crs on a.can_see_reviews and crs.clinic_id = c.id
    where
      length(trim(p_query)) >= 2
      and (
        c.branch ilike '%' || trim(p_query) || '%'
        or exists (
          select 1
          from branch_synonyms bs
          where bs.synonym = lower(trim(p_query))
            and bs.official_branch = c.branch
        )
      )
  ),
  combined as (
    select * from matched_hospitals
    union all
    select * from matched_clinics
  )
  select result_type, id, title, subtitle, review_count
  from combined
  order by
    (coalesce(review_count, 0) > 0) desc,
    (result_type = 'clinic') asc,
    coalesce(review_count, 0) desc,
    title asc
  limit p_limit;
$$;

grant execute on function search_suggestions(text, integer) to anon, authenticated;
