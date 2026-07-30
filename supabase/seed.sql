-- Sprint 2 seed verisi.
-- 20 kamu hastanesi, 10 farklı şehirde, 4 hastane türünün tamamını kapsayacak
-- şekilde. Her hastane için aynı 8 temel branş cross-join ile üretiliyor
-- (20 x 8 = 160 klinik, >=150 şartını rahatça karşılıyor ve gerçekçi:
-- bu 8 branş neredeyse her genel hastanede bulunur).

insert into hospitals (id, name, city, district, hospital_type) values
  ('10000000-0000-0000-0000-000000000001', 'İstanbul Şehir Hastanesi', 'İstanbul', 'Başakşehir', 'city_hospital'),
  ('10000000-0000-0000-0000-000000000002', 'İstanbul Eğitim ve Araştırma Hastanesi', 'İstanbul', 'Fatih', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000003', 'İstanbul Üniversitesi Tıp Fakültesi Hastanesi', 'İstanbul', 'Fatih', 'university_hospital'),
  ('10000000-0000-0000-0000-000000000004', 'Ankara Şehir Hastanesi', 'Ankara', 'Çankaya', 'city_hospital'),
  ('10000000-0000-0000-0000-000000000005', 'Ankara Eğitim ve Araştırma Hastanesi', 'Ankara', 'Altındağ', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000006', 'İzmir Şehir Hastanesi', 'İzmir', 'Bayraklı', 'city_hospital'),
  ('10000000-0000-0000-0000-000000000007', 'İzmir Devlet Hastanesi', 'İzmir', 'Konak', 'state_hospital'),
  ('10000000-0000-0000-0000-000000000008', 'Bursa Devlet Hastanesi', 'Bursa', 'Osmangazi', 'state_hospital'),
  ('10000000-0000-0000-0000-000000000009', 'Bursa Eğitim ve Araştırma Hastanesi', 'Bursa', 'Yıldırım', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000010', 'Antalya Eğitim ve Araştırma Hastanesi', 'Antalya', 'Kepez', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000011', 'Adana Şehir Hastanesi', 'Adana', 'Çukurova', 'city_hospital'),
  ('10000000-0000-0000-0000-000000000012', 'Konya Eğitim ve Araştırma Hastanesi', 'Konya', 'Meram', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000013', 'Gaziantep Üniversitesi Şahinbey Hastanesi', 'Gaziantep', 'Şahinbey', 'university_hospital'),
  ('10000000-0000-0000-0000-000000000014', 'Şanlıurfa Eğitim ve Araştırma Hastanesi', 'Şanlıurfa', 'Haliliye', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000015', 'Kayseri Şehir Hastanesi', 'Kayseri', 'Kocasinan', 'city_hospital'),
  ('10000000-0000-0000-0000-000000000016', 'Mersin Şehir Hastanesi', 'Mersin', 'Toroslar', 'city_hospital'),
  ('10000000-0000-0000-0000-000000000017', 'Hatay Devlet Hastanesi', 'Hatay', 'Antakya', 'state_hospital'),
  ('10000000-0000-0000-0000-000000000018', 'Van Eğitim ve Araştırma Hastanesi', 'Van', 'İpekyolu', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000019', 'Trabzon Kanuni Eğitim ve Araştırma Hastanesi', 'Trabzon', 'Ortahisar', 'training_and_research_hospital'),
  ('10000000-0000-0000-0000-000000000020', 'Kocaeli Devlet Hastanesi', 'Kocaeli', 'İzmit', 'state_hospital');

insert into clinics (hospital_id, branch)
select h.id, b.branch
from hospitals h
cross join (
  values
    ('İç Hastalıkları'),
    ('Genel Cerrahi'),
    ('Kadın Hastalıkları ve Doğum'),
    ('Çocuk Sağlığı ve Hastalıkları'),
    ('Ortopedi ve Travmatoloji'),
    ('Kardiyoloji'),
    ('Kulak Burun Boğaz'),
    ('Göz Hastalıkları')
) as b(branch);
