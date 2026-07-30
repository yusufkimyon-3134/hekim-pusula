create table doctor_workplaces (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  -- clinic_id: "restrict" -- klinikler referans/master veridir; üzerinde
  -- çalışma geçmişi varsa yanlışlıkla silinememesi için kısıtlanır.
  clinic_id uuid not null references clinics (id) on delete restrict,
  work_start_date date not null,
  work_end_date date,
  is_current boolean not null default true,
  -- Bu çalışma iddiasının (örn. SGK hizmet dökümü ile) doğrulanıp
  -- doğrulanmadığı. is_verified_workplace, hekimin genel kimlik
  -- doğrulamasından (doctors.is_verified) ayrıdır: bir hekim genel olarak
  -- doğrulanmış olabilir ama belirli bir çalışma dönemi iddiası henüz
  -- ayrıca doğrulanmamış olabilir.
  is_verified_workplace boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (work_end_date is null or work_end_date >= work_start_date),
  -- is_current, work_end_date ile tutarsız kalamaz (klasik "iki alan
  -- birbirinden bağımsız güncellenip senkronsuz kalır" hatasını
  -- veritabanı seviyesinde engeller).
  check (is_current = (work_end_date is null))
);

comment on table doctor_workplaces is
  'Bir hekimin zaman içinde çalıştığı klinikler. is_current her zaman (work_end_date is null) ile aynı olmalıdır (CHECK ile zorlanır). is_verified_workplace, bu belirli çalışma iddiasının belge ile doğrulanıp doğrulanmadığını tutar.';

create index doctor_workplaces_doctor_id_idx on doctor_workplaces (doctor_id);
create index doctor_workplaces_clinic_id_idx on doctor_workplaces (clinic_id);

-- Bir hekimin aynı klinikte aynı anda yalnızca bir "aktif" çalışma kaydı olabilir.
create unique index doctor_workplaces_one_current_per_clinic_idx
  on doctor_workplaces (doctor_id, clinic_id)
  where is_current;

-- "Bu klinikte aktif ve doğrulanmış hekim var mı" sorgusu (kurum
-- sayfasındaki rozet için) sık çalışacağı için ayrı bir kısmi indeks.
create index doctor_workplaces_verified_current_idx
  on doctor_workplaces (clinic_id)
  where is_current and is_verified_workplace;

create trigger set_doctor_workplaces_updated_at
  before update on doctor_workplaces
  for each row
  execute function set_updated_at();
