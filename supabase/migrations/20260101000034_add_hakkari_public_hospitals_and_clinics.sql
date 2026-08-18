-- Hakkâri ili kamu hastaneleri + geniş branş/klinik şablonu.
-- Kaynak kurum adları: Sağlık Bakanlığı / Hakkâri İl Sağlık Müdürlüğü ve hastanelerin resmi siteleri.
-- İdempotenttir: aynı hastane veya klinik varsa yeniden eklemez.

with hospital_seed(name, city, district, hospital_type) as (
  values
    ('Hakkâri Devlet Hastanesi', 'Hakkâri', 'Merkez', 'state_hospital'),
    ('Yüksekova Devlet Hastanesi', 'Hakkâri', 'Yüksekova', 'state_hospital'),
    ('Çukurca Devlet Hastanesi', 'Hakkâri', 'Çukurca', 'state_hospital'),
    ('Şemdinli Devlet Hastanesi', 'Hakkâri', 'Şemdinli', 'state_hospital'),
    ('Derecik Devlet Hastanesi', 'Hakkâri', 'Derecik', 'state_hospital')
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

with branch_seed(branch) as (
  select distinct c.branch
  from public.clinics c

  union

  select * from (values
    ('Pratisyen Hekim Görevi'),
    ('Acil Tıp'),
    ('Adli Tıp'),
    ('Aile Hekimliği'),
    ('Anesteziyoloji ve Reanimasyon'),
    ('Beyin ve Sinir Cerrahisi'),
    ('Çocuk Cerrahisi'),
    ('Çocuk Sağlığı ve Hastalıkları'),
    ('Çocuk ve Ergen Ruh Sağlığı ve Hastalıkları'),
    ('Çocuk Alerji ve İmmünoloji'),
    ('Çocuk Endokrinolojisi'),
    ('Çocuk Enfeksiyon Hastalıkları'),
    ('Çocuk Gastroenterolojisi'),
    ('Çocuk Göğüs Hastalıkları'),
    ('Çocuk Hematolojisi ve Onkolojisi'),
    ('Çocuk Kardiyolojisi'),
    ('Çocuk Nefrolojisi'),
    ('Çocuk Nörolojisi'),
    ('Çocuk Romatolojisi'),
    ('Çocuk Yoğun Bakım'),
    ('Deri ve Zührevi Hastalıkları'),
    ('Endokrinoloji ve Metabolizma Hastalıkları'),
    ('Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji'),
    ('Fiziksel Tıp ve Rehabilitasyon'),
    ('Gastroenteroloji'),
    ('Genel Cerrahi'),
    ('Geriatri'),
    ('Göğüs Cerrahisi'),
    ('Göğüs Hastalıkları'),
    ('Göz Hastalıkları'),
    ('Halk Sağlığı'),
    ('Hematoloji'),
    ('İç Hastalıkları'),
    ('Jinekolojik Onkoloji Cerrahisi'),
    ('Kadın Hastalıkları ve Doğum'),
    ('Kalp ve Damar Cerrahisi'),
    ('Kardiyoloji'),
    ('Kulak Burun Boğaz Hastalıkları'),
    ('Nefroloji'),
    ('Neonatoloji'),
    ('Nöroloji'),
    ('Nükleer Tıp'),
    ('Ortopedi ve Travmatoloji'),
    ('Perinatoloji'),
    ('Plastik, Rekonstrüktif ve Estetik Cerrahi'),
    ('Psikiyatri'),
    ('Radyasyon Onkolojisi'),
    ('Radyoloji'),
    ('Romatoloji'),
    ('Tıbbi Biyokimya'),
    ('Tıbbi Genetik'),
    ('Tıbbi Mikrobiyoloji'),
    ('Tıbbi Onkoloji'),
    ('Tıbbi Patoloji'),
    ('Üroloji'),
    ('Yoğun Bakım')
  ) as standard_branches(branch)
),
target_hospitals as (
  select h.id
  from public.hospitals h
  where h.city = 'Hakkâri'
    and h.name in (
      'Hakkâri Devlet Hastanesi',
      'Yüksekova Devlet Hastanesi',
      'Çukurca Devlet Hastanesi',
      'Şemdinli Devlet Hastanesi',
      'Derecik Devlet Hastanesi'
    )
)
insert into public.clinics (hospital_id, branch)
select th.id, bs.branch
from target_hospitals th
cross join branch_seed bs
where not exists (
  select 1
  from public.clinics existing
  where existing.hospital_id = th.id
    and existing.branch = bs.branch
);
