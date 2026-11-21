create schema if not exists private;

create table private.manual_doctor_verifications (
  doctor_id uuid primary key references public.doctors(id) on delete cascade,
  approved_by uuid not null,
  approved_at timestamptz not null default now()
);

alter table private.manual_doctor_verifications enable row level security;

create function public.admin_manual_verification_candidates(p_email text default null)
returns table (id uuid, email text, nickname text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select d.id, u.email::text, d.nickname, u.created_at
  from public.doctors d
  join auth.users u on u.id = d.id
  where exists (
    select 1 from auth.users a
    where a.id = (select auth.uid()) and a.raw_app_meta_data->>'role' = 'admin'
  )
    and u.email_confirmed_at is not null
    and u.email is not null
    and d.is_verified is false
    and (p_email is null or lower(u.email) = lower(p_email))
    and not exists (
      select 1 from public.doctor_verification_requests r
      where r.doctor_id = d.id and r.status = 'pending'
    )
  order by u.created_at desc, d.id
  limit 20;
$$;

create function public.admin_manually_verify_doctor(p_doctor_id uuid, p_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := auth.uid();
begin
  if not exists (
    select 1 from auth.users a
    where a.id = v_admin_id and a.raw_app_meta_data->>'role' = 'admin'
  ) then
    raise insufficient_privilege;
  end if;

  update public.doctors d
  set is_verified = true
  from auth.users u
  where d.id = p_doctor_id
    and u.id = d.id
    and u.email = p_email
    and u.email_confirmed_at is not null
    and d.is_verified is false
    and not exists (
      select 1 from public.doctor_verification_requests r
      where r.doctor_id = d.id and r.status = 'pending'
    );

  if not found then
    return false;
  end if;

  insert into private.manual_doctor_verifications (doctor_id, approved_by)
  values (p_doctor_id, v_admin_id)
  on conflict (doctor_id) do update
    set approved_by = excluded.approved_by, approved_at = excluded.approved_at;

  return true;
end;
$$;

revoke all on function public.admin_manual_verification_candidates(text) from public, anon, authenticated;
revoke all on function public.admin_manually_verify_doctor(uuid, text) from public, anon, authenticated;
grant execute on function public.admin_manual_verification_candidates(text) to authenticated;
grant execute on function public.admin_manually_verify_doctor(uuid, text) to authenticated;
