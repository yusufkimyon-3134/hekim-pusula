-- Şırnak ili kamu hastaneleri + geniş branş/klinik şablonu.
-- Kaynak kurum adları: Şırnak İl Sağlık Müdürlüğü güncel Kamu Hastaneleri listesi.
-- İdempotenttir: aynı hastane veya klinik varsa yeniden eklemez.

with hospital_seed(name, city, district, hospital_type) as (
  values
    ('Şırnak Devlet Hastanesi', 'Şırnak', 'Merkez', 'state_hospital'),
    ('Şırnak Şehit Aydoğan Aydın Devlet Hastanesi', 'Şırnak', 'Merkez', 'state_hospital'),
    ('Cizre Dr. Selahattin Cizrelioğlu Devlet Hastanesi', 'Şırnak', 'Cizre', 'state_hospital'),
    ('Silopi Devlet Hastanesi', 'Şırnak', 'Silopi', 'state_hospital'),
    ('İdil Devlet Hastanesi', 'Şırnak', 'İdil', 'state_hospital'),
    ('Uludere Devlet Hastanesi', 'Şırnak', 'Uludere', 'state_hospital'),
    ('Beytüşşebap Devlet Hastanesi', 'Şırnak', 'Beytüşşebap', 'state_hospital'),
    ('Güçlükonak Entegre İlçe Devlet Hastanesi', 'Şırnak', 'Güçlükonak', 'state_hospital')
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

-- Şırnak'taki her hastaneye, uygulamada zaten bulunan tüm branşların yanı sıra
-- geniş standart tıp branşı setini ekler. Böylece diğer hastanelerde kullanılan
-- bölümler korunur ve Şırnak hastanelerinde eksik branş kalmaz.
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
  where h.city = 'Şırnak'
    and h.name in (
      'Şırnak Devlet Hastanesi',
      'Şırnak Şehit Aydoğan Aydın Devlet Hastanesi',
      'Cizre Dr. Selahattin Cizrelioğlu Devlet Hastanesi',
      'Silopi Devlet Hastanesi',
      'İdil Devlet Hastanesi',
      'Uludere Devlet Hastanesi',
      'Beytüşşebap Devlet Hastanesi',
      'Güçlükonak Entegre İlçe Devlet Hastanesi'
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
