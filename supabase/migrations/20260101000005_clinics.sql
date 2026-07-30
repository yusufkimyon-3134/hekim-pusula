create table clinics (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references hospitals (id) on delete cascade,
  branch text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hospital_id, branch)
);

comment on table clinics is
  'Bir hastaneye bağlı branş/klinik. Hastane silinirse (cascade) klinikleri de silinir; ancak bir kliniğin altında değerlendirme/çalışma geçmişi varsa o klinik doğrudan silinemez (bkz. doctor_workplaces, reviews FK''leri: on delete restrict).';

create index clinics_hospital_id_idx on clinics (hospital_id);
create index clinics_branch_idx on clinics (branch);

create trigger set_clinics_updated_at
  before update on clinics
  for each row
  execute function set_updated_at();
