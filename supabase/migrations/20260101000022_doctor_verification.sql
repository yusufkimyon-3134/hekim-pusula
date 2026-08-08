-- Hekim Doğrulaması v1
--
-- Bu bir e-Devlet entegrasyonu DEĞİLDİR. Hekim, e-Devlet'ten kendi
-- indirdiği barkodlu diploma/uzmanlık belgesini buraya yüklüyor; bir
-- admin bunu Supabase Dashboard'dan (Table Editor + Storage) manuel
-- inceleyip onaylıyor/reddediyor. Admin paneli bu sürümde YOK.
--
-- ÖNEMLİ TASARIM KARARI: `doctors.is_verified` (Sprint 2'den beri var
-- olan) TEK doğrulama bayrağı olmaya devam ediyor — burada YENİ bir
-- "verified_doctor" alanı EKLENMEDİ. Bu tablo yalnızca "neden/nasıl
-- doğrulandı" geçmişini/başvuru sürecini tutuyor; nihai doğrulama
-- durumu hep `doctors.is_verified`'da.

-- ---------------------------------------------------------------------
-- 1) Enum'lar
-- ---------------------------------------------------------------------
create type verification_status as enum ('pending', 'approved', 'rejected');
create type verification_document_type as enum ('diploma', 'specialty_certificate');

-- ---------------------------------------------------------------------
-- 2) doctor_verification_requests
-- ---------------------------------------------------------------------
create table doctor_verification_requests (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors (id) on delete cascade,
  full_name text not null,
  document_type verification_document_type not null,
  document_path text not null,
  status verification_status not null default 'pending',
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

comment on table doctor_verification_requests is
  'Belge ile hekim doğrulama başvuruları. Onay/red Supabase Dashboard''dan manuel yapılır (admin paneli yok). status=''approved'' olunca bir trigger doctors.is_verified''i true yapar.';

create index doctor_verification_requests_doctor_id_idx
  on doctor_verification_requests (doctor_id);

alter table doctor_verification_requests enable row level security;

-- Kullanıcı yalnızca kendi başvurusunu okuyabilir.
create policy doctor_verification_requests_select_own
  on doctor_verification_requests for select
  using (doctor_id = auth.uid());

-- Kullanıcı yalnızca kendi adına, ve yalnızca 'pending' durumunda yeni
-- bir başvuru oluşturabilir (doğrudan 'approved' ile başvuru açamaz).
create policy doctor_verification_requests_insert_own
  on doctor_verification_requests for insert
  with check (doctor_id = auth.uid() and status = 'pending');

-- BİLİNÇLİ OLARAK: update/delete politikası yok. Kullanıcı kendi
-- başvurusunun status/rejection_reason'ını değiştiremez. Reddedilirse
-- yeni bir belge yükleyip YENİ bir satır (yeni INSERT) ile tekrar
-- başvurur — var olan satırı güncellemez.

grant select, insert on doctor_verification_requests to authenticated;

-- ---------------------------------------------------------------------
-- 3) Onaylanınca doctors.is_verified'i otomatik true yapan trigger
-- ---------------------------------------------------------------------
create or replace function apply_doctor_verification_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update doctors set is_verified = true where id = new.doctor_id;
    new.reviewed_at := now();
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

comment on function apply_doctor_verification_decision is
  'BEFORE UPDATE trigger''ı. status=''approved'' olunca doctors.is_verified=true yapar (SECURITY DEFINER — admin bu güncellemeyi Supabase Dashboard/service_role ile yaptığı için normalde RLS''i zaten aşıyor, ama fonksiyon başka bir yoldan da çağrılırsa güvenli olsun diye). reviewed_at, hem onay hem redde otomatik damgalanır.';

create trigger doctor_verification_requests_apply_decision
  before update on doctor_verification_requests
  for each row
  execute function apply_doctor_verification_decision();

-- ---------------------------------------------------------------------
-- 4) Storage: private bucket + yalnızca-kendi-belgeni-gör/yükle politikaları
-- ---------------------------------------------------------------------
-- Yol kuralı: {doctor_id}/{dosya_adı} — (storage.foldername(name))[1]
-- ilk klasör segmentini (yani doctor_id'yi) verir.
insert into storage.buckets (id, name, public)
values ('doctor-verification-documents', 'doctor-verification-documents', false)
on conflict (id) do nothing;

create policy doctor_verification_documents_insert_own
  on storage.objects for insert
  with check (
    bucket_id = 'doctor-verification-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy doctor_verification_documents_select_own
  on storage.objects for select
  using (
    bucket_id = 'doctor-verification-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------
-- 5) submit_review: doğrulanmamış hekim yorum gönderemesin
-- ---------------------------------------------------------------------
-- İmza DEĞİŞMEDİ (12 parametre, Sprint 6'daki hâliyle aynı) — yalnızca
-- gövdeye, en başa, bir doğrulama kontrolü eklendi.
create or replace function submit_review(
  p_clinic_id uuid,
  p_monthly_shifts integer,
  p_daily_patients integer,
  p_service_patients integer,
  p_would_choose_again boolean,
  p_comment text,
  p_incentive_score integer,
  p_colleague_score integer,
  p_management_score integer,
  p_city_score integer,
  p_education_score integer,
  p_academic_score integer
)
returns uuid
language plpgsql
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_is_verified boolean;
  v_workplace_id uuid;
  v_review_id uuid;
begin
  if v_doctor_id is null then
    raise exception 'Bu işlem için giriş yapmalısınız';
  end if;

  select is_verified into v_is_verified from doctors where id = v_doctor_id;

  if v_is_verified is not true then
    raise exception 'Yorum yazabilmek için hekim doğrulamasını tamamlamış olman gerekiyor. Profilinden belge yükleyerek başvurabilirsin.';
  end if;

  select id into v_workplace_id
  from doctor_workplaces
  where doctor_id = v_doctor_id and clinic_id = p_clinic_id
  order by created_at desc
  limit 1;

  if v_workplace_id is null then
    insert into doctor_workplaces (doctor_id, clinic_id, work_start_date, is_current, is_verified_workplace)
    values (v_doctor_id, p_clinic_id, current_date, true, false)
    returning id into v_workplace_id;
  end if;

  insert into reviews (
    doctor_workplace_id, clinic_id, monthly_shifts, daily_patients,
    service_patients, would_choose_again, comment
  ) values (
    v_workplace_id, p_clinic_id, p_monthly_shifts, p_daily_patients,
    p_service_patients, p_would_choose_again, p_comment
  ) returning id into v_review_id;

  insert into review_scores (
    review_id, incentive_score, colleague_score, management_score,
    city_score, education_score, academic_score
  ) values (
    v_review_id, p_incentive_score, p_colleague_score, p_management_score,
    p_city_score, p_education_score, p_academic_score
  );

  return v_review_id;
end;
$$;

comment on function submit_review is
  'Kimliği doğrulanmış VE hekim doğrulaması onaylanmış (doctors.is_verified) çağıran adına bir klinik için değerlendirme gönderir. Hekim Doğrulaması v1: doğrulanmamış hekimler artık yorum gönderemiyor (hem burada hem review sayfasında kontrol ediliyor).';

grant execute on function submit_review to authenticated;
