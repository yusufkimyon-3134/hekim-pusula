-- Ana Sayfa — Gerçek Zamanlı Öneri Araması
--
-- Kullanıcı ana sayfada yazarken (debounce'lu, min 2 karakter) çağrılan
-- tek bir fonksiyon. Hastane VE klinik sonuçlarını, istenen 3 katmanlı
-- sıralamayla (önce değerlendirmesi olanlar, sonra değerlendirmesiz
-- hastaneler, sonra değerlendirmesiz klinikler) TEK bir sorguda
-- birleştirir — istemci tarafında ayrı ayrı sıralama/birleştirme mantığı
-- gerekmesin diye.

create type search_suggestion_type as enum ('hospital', 'clinic');

create or replace function search_suggestions(p_query text, p_limit integer default 8)
returns table (
  result_type search_suggestion_type,
  id uuid,
  title text,
  subtitle text,
  review_count bigint
)
language sql
stable
as $$
  with matched_hospitals as (
    select
      'hospital'::search_suggestion_type as result_type,
      h.id,
      h.name as title,
      h.district || ', ' || h.city as subtitle,
      coalesce(sum(crs.review_count), 0) as review_count
    from hospitals h
    left join clinics c on c.hospital_id = h.id
    left join clinic_review_stats crs on crs.clinic_id = c.id
    where
      length(trim(p_query)) >= 2
      and (
        h.name ilike '%' || p_query || '%'
        or h.city ilike '%' || p_query || '%'
        or h.district ilike '%' || p_query || '%'
      )
    group by h.id
  ),
  matched_clinics as (
    select
      'clinic'::search_suggestion_type as result_type,
      c.id,
      c.branch as title,
      h.name || ' · ' || h.district || ', ' || h.city as subtitle,
      coalesce(crs.review_count, 0) as review_count
    from clinics c
    join hospitals h on h.id = c.hospital_id
    left join clinic_review_stats crs on crs.clinic_id = c.id
    where
      length(trim(p_query)) >= 2
      and (
        c.branch ilike '%' || p_query || '%'
        or exists (
          select 1 from branch_synonyms bs
          where bs.synonym = lower(trim(p_query)) and bs.official_branch = c.branch
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
    (review_count > 0) desc,      -- 1. katman: değerlendirmesi olan HER ŞEY (hastane+klinik karışık) önce
    (result_type = 'clinic') asc, -- kalan (değerlendirmesiz) grup içinde: önce hastaneler, sonra klinikler
    review_count desc,
    title asc
  limit p_limit;
$$;

comment on function search_suggestions is
  'Ana sayfadaki gerçek zamanlı öneri kutusu için — hastane (isim/il/ilçe) ve klinik (branş + eşanlamlı) eşleşmelerini, review_count''a göre 3 katmanlı sıralamayla (önce değerlendirmesi olanlar, sonra hastaneler, sonra klinikler) TEK sonuç kümesinde döner. En az 2 karakter şartı burada da (istemci tarafındaki kontrole ek olarak) uygulanıyor.';

grant execute on function search_suggestions to anon, authenticated;
