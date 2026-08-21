-- Artvin ili kamu hastaneleri + standart geniş tıp branşı/klinik şablonu.
-- Kaynak: Artvin İl Sağlık Müdürlüğü güncel "Hastanelerimiz" listesi.
-- Ağız ve Diş Sağlığı Merkezi bu tıp kliniği şablonuna dahil edilmemiştir.
-- İdempotenttir.

with hospital_seed(name, city, district, hospital_type) as (
  values
    ('Artvin Devlet Hastanesi', 'Artvin', 'Merkez', 'state_hospital'),
    ('Ardanuç Entegre İlçe Devlet Hastanesi', 'Artvin', 'Ardanuç', 'state_hospital'),
    ('Arhavi Devlet Hastanesi', 'Artvin', 'Arhavi', 'state_hospital'),
    ('Borçka Devlet Hastanesi', 'Artvin', 'Borçka', 'state_hospital'),
    ('Hopa Devlet Hastanesi', 'Artvin', 'Hopa', 'state_hospital'),
    ('Murgul Devlet Hastanesi', 'Artvin', 'Murgul', 'state_hospital'),
    ('Şavşat Devlet Hastanesi', 'Artvin', 'Şavşat', 'state_hospital'),
    ('Yusufeli Devlet Hastanesi', 'Artvin', 'Yusufeli', 'state_hospital')
)
insert into public.hospitals (name, city, district, hospital_type)
select name, city, district, hospital_type::public.hospital_type
from hospital_seed s
where not exists (
  select 1 from public.hospitals h
  where h.name=s.name and h.city=s.city and h.district=s.district
);

with branch_seed(branch) as (
  select * from (values
    ('Pratisyen Hekim Görevi'),('Acil Tıp'),('Adli Tıp'),('Aile Hekimliği'),
    ('Anesteziyoloji ve Reanimasyon'),('Beyin ve Sinir Cerrahisi'),('Çocuk Cerrahisi'),
    ('Çocuk Sağlığı ve Hastalıkları'),('Çocuk ve Ergen Ruh Sağlığı ve Hastalıkları'),
    ('Çocuk Alerji ve İmmünoloji'),('Çocuk Endokrinolojisi'),('Çocuk Enfeksiyon Hastalıkları'),
    ('Çocuk Gastroenterolojisi'),('Çocuk Göğüs Hastalıkları'),('Çocuk Hematolojisi ve Onkolojisi'),
    ('Çocuk Kardiyolojisi'),('Çocuk Nefrolojisi'),('Çocuk Nörolojisi'),('Çocuk Romatolojisi'),
    ('Çocuk Yoğun Bakım'),('Deri ve Zührevi Hastalıkları'),('Endokrinoloji ve Metabolizma Hastalıkları'),
    ('Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji'),('Fiziksel Tıp ve Rehabilitasyon'),
    ('Gastroenteroloji'),('Genel Cerrahi'),('Geriatri'),('Göğüs Cerrahisi'),('Göğüs Hastalıkları'),
    ('Göz Hastalıkları'),('Halk Sağlığı'),('Hematoloji'),('İç Hastalıkları'),
    ('Jinekolojik Onkoloji Cerrahisi'),('Kadın Hastalıkları ve Doğum'),('Kalp ve Damar Cerrahisi'),
    ('Kardiyoloji'),('Kulak Burun Boğaz Hastalıkları'),('Nefroloji'),('Neonatoloji'),('Nöroloji'),
    ('Nükleer Tıp'),('Ortopedi ve Travmatoloji'),('Perinatoloji'),
    ('Plastik, Rekonstrüktif ve Estetik Cerrahi'),('Psikiyatri'),('Radyasyon Onkolojisi'),
    ('Radyoloji'),('Romatoloji'),('Tıbbi Biyokimya'),('Tıbbi Genetik'),('Tıbbi Mikrobiyoloji'),
    ('Tıbbi Onkoloji'),('Tıbbi Patoloji'),('Üroloji'),('Yoğun Bakım')
  ) as b(branch)
), target_hospitals as (
  select id from public.hospitals
  where city='Artvin' and name in (
    'Artvin Devlet Hastanesi','Ardanuç Entegre İlçe Devlet Hastanesi','Arhavi Devlet Hastanesi',
    'Borçka Devlet Hastanesi','Hopa Devlet Hastanesi','Murgul Devlet Hastanesi',
    'Şavşat Devlet Hastanesi','Yusufeli Devlet Hastanesi'
  )
)
insert into public.clinics (hospital_id, branch)
select th.id, bs.branch
from target_hospitals th cross join branch_seed bs
where not exists (
  select 1 from public.clinics c where c.hospital_id=th.id and c.branch=bs.branch
);
