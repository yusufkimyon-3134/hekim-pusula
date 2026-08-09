-- Hatay'daki devlet ve egitim-arastirma hastaneleri.
-- Aynı kayıt daha önce eklenmişse yeniden oluşturulmaz.
with hospital_seed(name, city, district, hospital_type) as (
  values
    ('Altınözü Devlet Hastanesi', 'Hatay', 'Altınözü', 'state_hospital'),
    ('Arsuz Devlet Hastanesi', 'Hatay', 'Arsuz', 'state_hospital'),
    ('Belen Devlet Hastanesi', 'Hatay', 'Belen', 'state_hospital'),
    ('Defne Devlet Hastanesi', 'Hatay', 'Defne', 'state_hospital'),
    ('Dörtyol Devlet Hastanesi', 'Hatay', 'Dörtyol', 'state_hospital'),
    ('Erzin Devlet Hastanesi', 'Hatay', 'Erzin', 'state_hospital'),
    ('Hatay Eğitim ve Araştırma Hastanesi', 'Hatay', 'Antakya', 'training_and_research_hospital'),
    ('Hassa Devlet Hastanesi', 'Hatay', 'Hassa', 'state_hospital'),
    ('İskenderun Devlet Hastanesi', 'Hatay', 'İskenderun', 'state_hospital'),
    ('Kırıkhan Devlet Hastanesi', 'Hatay', 'Kırıkhan', 'state_hospital'),
    ('Kumlu Devlet Hastanesi', 'Hatay', 'Kumlu', 'state_hospital'),
    ('Reyhanlı Devlet Hastanesi', 'Hatay', 'Reyhanlı', 'state_hospital'),
    ('Samandağ Devlet Hastanesi', 'Hatay', 'Samandağ', 'state_hospital'),
    ('Yayladağı Devlet Hastanesi', 'Hatay', 'Yayladağı', 'state_hospital')
)
insert into public.hospitals (name, city, district, hospital_type)
select name, city, district, hospital_type::public.hospital_type
from hospital_seed seed
where not exists (
  select 1
  from public.hospitals h
  where h.name = seed.name
    and h.city = seed.city
    and h.district = seed.district
);

-- Bu hastanelerde pratisyen/DHY deneyimleri için ayrı çalışma birimi.
insert into public.clinics (hospital_id, branch)
select h.id, 'Pratisyen Hekim Görevi'
from public.hospitals h
where h.city = 'Hatay'
  and h.hospital_type in ('state_hospital', 'training_and_research_hospital')
  and not exists (
    select 1
    from public.clinics c
    where c.hospital_id = h.id
      and c.branch = 'Pratisyen Hekim Görevi'
  );
