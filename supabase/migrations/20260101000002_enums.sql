-- Sprint 2: uygulama genelinde kullanılan sabit değer kümeleri (enum).
-- Serbest metin yerine enum kullanmak, veri bütünlüğünü veritabanı
-- seviyesinde garanti eder (yanlış yazım/tutarsız değer imkansız).

create type hospital_type as enum (
  'state_hospital',
  'training_and_research_hospital',
  'city_hospital',
  'university_hospital'
);

create type doctor_role as enum (
  'general_practitioner',
  'specialist',
  'subspecialist'
);

create type report_status as enum (
  'pending',
  'reviewed',
  'dismissed',
  'action_taken'
);
