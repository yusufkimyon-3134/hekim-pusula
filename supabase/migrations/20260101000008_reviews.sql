create table reviews (
  id uuid primary key default gen_random_uuid(),
  doctor_workplace_id uuid not null references doctor_workplaces (id) on delete cascade,
  -- clinic_id, doctor_workplace_id üzerinden (doctor_workplaces.clinic_id)
  -- teorik olarak türetilebilir; sorgu performansı için burada da
  -- tutuluyor (kasıtlı denormalizasyon). Tutarlılık aşağıdaki trigger
  -- ile garanti altına alınıyor.
  clinic_id uuid not null references clinics (id) on delete restrict,
  monthly_shifts integer not null check (monthly_shifts >= 0),
  daily_patients integer not null check (daily_patients >= 0),
  service_patients integer not null check (service_patients >= 0),
  would_choose_again boolean not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table reviews is
  'Bir çalışma dönemine (doctor_workplace) bağlı değerlendirme. clinic_id kasıtlı olarak denormalize edilmiştir; tutarlılık ve "bir hekim bir klinik için tek aktif değerlendirme yapabilir" kuralı reviews_enforce_consistency trigger''ı ile zorlanır.';

create index reviews_doctor_workplace_id_idx on reviews (doctor_workplace_id);
create index reviews_clinic_id_idx on reviews (clinic_id);

create trigger set_reviews_updated_at
  before update on reviews
  for each row
  execute function set_updated_at();

-- İş kuralı: (1) reviews.clinic_id, ilişkili doctor_workplaces.clinic_id ile
-- eşleşmeli; (2) bir hekim aynı klinik için yalnızca bir değerlendirmeye
-- sahip olabilir (doctor_id, reviews tablosunda doğrudan bir sütun değil,
-- doctor_workplaces üzerinden erişildiği için bu kural yalnızca bir trigger
-- ile ifade edilebilir; basit bir UNIQUE constraint yeterli değildir).
create or replace function enforce_review_consistency()
returns trigger
language plpgsql
as $$
declare
  v_clinic_id uuid;
  v_doctor_id uuid;
  v_existing_count integer;
begin
  select clinic_id, doctor_id
    into v_clinic_id, v_doctor_id
    from doctor_workplaces
   where id = new.doctor_workplace_id;

  if v_clinic_id is null then
    raise exception 'doctor_workplace_id % bulunamadı', new.doctor_workplace_id;
  end if;

  if new.clinic_id <> v_clinic_id then
    raise exception 'clinic_id (%) doctor_workplace kaydındaki klinikle (%) eşleşmiyor', new.clinic_id, v_clinic_id;
  end if;

  select count(*)
    into v_existing_count
    from reviews r
    join doctor_workplaces dw on dw.id = r.doctor_workplace_id
   where dw.doctor_id = v_doctor_id
     and r.clinic_id = new.clinic_id
     and r.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if v_existing_count > 0 then
    raise exception 'Bu hekimin bu klinik için zaten bir değerlendirmesi var (bir klinik başına yalnızca bir aktif değerlendirme yapılabilir)';
  end if;

  return new;
end;
$$;

create trigger reviews_enforce_consistency
  before insert or update on reviews
  for each row
  execute function enforce_review_consistency();
