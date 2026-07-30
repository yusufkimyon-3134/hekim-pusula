-- Sprint 3: hastane/klinik keşfi için arama desteği.
--
-- Neden bir VIEW ve bir RPC fonksiyonu gerekiyor (düz PostgREST sorguları
-- yeterli değil):
-- 1) "Öne çıkan şehirler" (şehir başına hastane sayısı), bir GROUP BY
--    agregasyonu gerektirir. PostgREST'in standart REST arayüzü keyfi
--    GROUP BY desteklemez; bu yüzden bir VIEW üzerinden sunuluyor.
-- 2) Klinik araması, clinics ile hospitals'ı join'leyip her ikisinin
--    sütunlarında OR, birden fazla kelime (token) için AND araması
--    gerektiriyor. Bu, PostgREST'in embedded-resource `or()` filtrelemesinin
--    (join'lenmiş tablo sütunlarını `or()` içinde referans alma) kırılgan
--    olduğu bilinen bir alan; bunun yerine test edilebilir, tek bir SQL
--    fonksiyonu (RPC) olarak yazıldı.

create or replace view hospital_city_counts
with (security_invoker = true) as
select
  city,
  count(*)::int as hospital_count
from hospitals
group by city;

comment on view hospital_city_counts is
  'Şehir başına hastane sayısı. Ana sayfadaki "öne çıkan şehirler" ve arama sayfasındaki şehir filtresi için kullanılır. security_invoker=true: RLS, view''i çağıran rolün izinlerine göre değerlendirilir (view sahibinin değil).';

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
  where
    (filter_city is null or h.city = filter_city)
    and (filter_hospital_type is null or h.hospital_type = filter_hospital_type)
    and (
      -- Sorgu boşsa (veya yalnızca boşluk karakteriyse) tüm satırlar geçer.
      trim(coalesce(search_query, '')) = ''
      -- Aksi halde: kelimelere (token) ayrılır, HER token en az bir
      -- alanda (branch, hastane adı/il/ilçe) eşleşmelidir (AND kelimeler,
      -- OR alanlar). "Eşleşmeyen bir token YOK" ifadesiyle kuruldu
      -- (evrensel niceleyici = çifte olumsuzlama).
      or not exists (
        select 1
        from unnest(string_to_array(trim(search_query), ' ')) as tok
        where tok <> ''
          and not (
            c.branch ilike '%' || tok || '%'
            or h.name ilike '%' || tok || '%'
            or h.city ilike '%' || tok || '%'
            or h.district ilike '%' || tok || '%'
          )
      )
    )
  order by h.name, c.branch;
$$;

comment on function search_clinics is
  'Klinik + hastane bilgisini birlikte döner. search_query kelimelere ayrılıp her kelime branch/hastane adı/il/ilçe alanlarından en az birinde aranır (tüm kelimeler eşleşmeli). city/hospital_type ile ek filtre uygulanabilir.';

grant execute on function search_clinics to anon, authenticated;
