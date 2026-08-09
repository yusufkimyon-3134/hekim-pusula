-- DHY/pratisyen hekimlerin kurum bazında deneyim paylaşabilmesi için
-- kamu hastanelerine ayrı bir değerlendirme birimi eklenir.
insert into public.clinics (hospital_id, branch)
select h.id, 'Pratisyen Hekim Görevi'
from public.hospitals h
where h.hospital_type in (
  'state_hospital',
  'city_hospital',
  'training_and_research_hospital'
)
and not exists (
  select 1
  from public.clinics c
  where c.hospital_id = h.id
    and c.branch = 'Pratisyen Hekim Görevi'
);
