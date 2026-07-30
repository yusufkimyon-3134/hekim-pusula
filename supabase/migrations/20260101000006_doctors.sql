-- doctors.id kasıtlı olarak auth.users.id'yi referans alır (Supabase'in
-- standart "profil tablosu" deseni). Bu, kimlik doğrulama UI'ını
-- IMPLEMENTE ETMEZ (Sprint 3'te gelecek) — yalnızca ileride auth
-- eklendiğinde şema değişikliği/veri taşıma gerektirmeyecek şekilde
-- şimdiden doğru kurulmasını sağlar. Supabase projelerinde auth.users
-- şeması varsayılan olarak zaten mevcuttur.
create table doctors (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  role doctor_role not null,
  specialty text not null,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table doctors is
  'Uygulamaya özel hekim profili. Gerçek ad/soyad/TC ASLA burada tutulmaz; kimlik bilgisi yalnızca auth.users üzerinden yönetilir.';

create index doctors_specialty_idx on doctors (specialty);
create index doctors_role_idx on doctors (role);
create index doctors_is_verified_idx on doctors (is_verified) where is_verified = true;

create trigger set_doctors_updated_at
  before update on doctors
  for each row
  execute function set_updated_at();
