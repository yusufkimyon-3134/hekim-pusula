alter table public.reviews
  add column if not exists last_verified_at timestamptz;

update public.reviews
set last_verified_at = coalesce(updated_at, created_at)
where last_verified_at is null;

alter table public.reviews
  alter column last_verified_at set default now(),
  alter column last_verified_at set not null;

create or replace function public.refresh_review_verification_on_content_change()
returns trigger
language plpgsql
as $$
begin
  if new.monthly_shifts is distinct from old.monthly_shifts
     or new.daily_patients is distinct from old.daily_patients
     or new.service_patients is distinct from old.service_patients
     or new.would_choose_again is distinct from old.would_choose_again
     or new.comment is distinct from old.comment
     or new.show_nickname is distinct from old.show_nickname then
    new.last_verified_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists reviews_refresh_verification_on_content_change on public.reviews;
create trigger reviews_refresh_verification_on_content_change
  before update on public.reviews
  for each row
  execute function public.refresh_review_verification_on_content_change();

create or replace function public.confirm_review_current(p_review_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_verified_at timestamptz;
begin
  update public.reviews r
     set last_verified_at = now()
    from public.doctor_workplaces dw
   where r.id = p_review_id
     and r.doctor_workplace_id = dw.id
     and dw.doctor_id = auth.uid()
  returning r.last_verified_at into v_verified_at;

  if v_verified_at is null then
    raise exception 'Bu değerlendirmeyi doğrulama yetkiniz yok.';
  end if;

  return v_verified_at;
end;
$$;

revoke all on function public.confirm_review_current(uuid) from public;
grant execute on function public.confirm_review_current(uuid) to authenticated;
