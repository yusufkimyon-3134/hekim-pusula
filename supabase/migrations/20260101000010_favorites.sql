-- Basit kaydet/kaldır ilişkisi: doctor_id + clinic_id bileşik birincil
-- anahtardır (aynı favoriyi iki kez eklemek imkansızdır, ayrı id gerekmez).
-- Düzenlenebilir bir kayıt olmadığı (ya vardır ya silinir) için updated_at yok.
create table favorites (
  doctor_id uuid not null references doctors (id) on delete cascade,
  clinic_id uuid not null references clinics (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (doctor_id, clinic_id)
);

comment on table favorites is
  'Hekimin kaydettiği klinikler. Düzenlenmez (yalnızca eklenir/silinir), bu yüzden kasıtlı olarak updated_at yoktur.';

create index favorites_clinic_id_idx on favorites (clinic_id);
