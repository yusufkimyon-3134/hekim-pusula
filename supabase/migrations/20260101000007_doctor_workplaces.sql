create table doctor_workplaces (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  -- clinic_id: "restrict" -- klinikler referans/master veridir; üzerinde
  -- çalışma geçmişi varsa yanlışlıkla silinememesi için kısıtlanır.
  clinic_id uuid not null references clinics (id) on delete restrict,
  start_date date not null,
  end_date date,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  -- is_current, end_date ile tutarsız kalamaz (klasik "iki alan birbirinden
  -- bağımsız güncellenip senkronsuz kalır" hatasını veritabanı seviyesinde engeller).
  check (is_current = (end_date is null))
);

comment on table doctor_workplaces is
  'Bir hekimin zaman içinde çalıştığı klinikler. is_current her zaman (end_date is null) ile aynı olmalıdır (CHECK ile zorlanır).';

create index doctor_workplaces_doctor_id_idx on doctor_workplaces (doctor_id);
create index doctor_workplaces_clinic_id_idx on doctor_workplaces (clinic_id);

-- Bir hekimin aynı klinikte aynı anda yalnızca bir "aktif" çalışma kaydı olabilir.
create unique index doctor_workplaces_one_current_per_clinic_idx
  on doctor_workplaces (doctor_id, clinic_id)
  where is_current;

create trigger set_doctor_workplaces_updated_at
  before update on doctor_workplaces
  for each row
  execute function set_updated_at();
