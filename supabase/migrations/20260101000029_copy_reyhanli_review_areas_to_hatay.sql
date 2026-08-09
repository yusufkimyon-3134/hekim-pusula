-- Reyhanli Devlet Hastanesi'ndeki mevcut değerlendirme alanlarını,
-- Hatay'daki devlet ve egitim-arastirma hastanelerine kopyalar.
-- Ayni alan daha once eklenmisse yeniden eklenmez.
insert into public.clinics (hospital_id, branch)
select target.id, source_clinic.branch
from public.hospitals source_hospital
join public.clinics source_clinic
  on source_clinic.hospital_id = source_hospital.id
cross join public.hospitals target
where source_hospital.name = 'Reyhanlı Devlet Hastanesi'
  and source_hospital.city = 'Hatay'
  and source_hospital.district = 'Reyhanlı'
  and target.city = 'Hatay'
  and target.hospital_type in ('state_hospital', 'training_and_research_hospital')
  and not exists (
    select 1
    from public.clinics existing
    where existing.hospital_id = target.id
      and existing.branch = source_clinic.branch
  );
