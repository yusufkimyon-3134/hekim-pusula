-- Sprint 5: review gönderimi tek bir atomik işlemde yapılmalı — workplace
-- kaydı (yoksa oluşturulur), review ve review_scores hepsi ya birlikte
-- başarılı olmalı ya da hiçbiri kalıcı olmamalı (örn. tekillik trigger'ı
-- devreye girip reddederse, yarım kalan bir doctor_workplaces kaydı
-- ortada kalmamalı). Supabase JS istemcisi ayrı .from() çağrıları arasında
-- transaction açamadığı için bu, bir Postgres fonksiyonuna alındı.

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
  p_city_score integer
)
returns uuid
language plpgsql
as $$
declare
  v_doctor_id uuid := auth.uid();
  v_workplace_id uuid;
  v_review_id uuid;
begin
  if v_doctor_id is null then
    raise exception 'Bu işlem için giriş yapmalısınız';
  end if;

  -- Bu klinik için var olan bir çalışma kaydı ara (aktif olması şart
  -- değil); yoksa kendi beyanına dayalı, doğrulanmamış yeni bir kayıt aç.
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
    review_id, incentive_score, colleague_score, management_score, city_score
  ) values (
    v_review_id, p_incentive_score, p_colleague_score, p_management_score, p_city_score
  );

  return v_review_id;
end;
$$;

comment on function submit_review is
  'Kimliği doğrulanmış çağıran hekim adına (auth.uid()) bir klinik için değerlendirme gönderir. Gerekirse önce doğrulanmamış bir doctor_workplaces kaydı açar. Tamamı tek transaction''da; RLS politikaları fonksiyon içinde de (SECURITY INVOKER, varsayılan) geçerli kalır.';

grant execute on function submit_review to authenticated;
