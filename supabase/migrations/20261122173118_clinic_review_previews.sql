-- Admin selection applies only to the exact text that was reviewed.
create table public.clinic_review_preview_selections (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  selected_comment text not null
);
alter table public.clinic_review_preview_selections enable row level security;
revoke all on public.clinic_review_preview_selections from public, anon, authenticated;

create function public.clinic_review_previews(p_clinic_id uuid)
returns table(comment text, rating integer)
language sql stable security definer set search_path = ''
as $$
  select r.comment,
    round((s.incentive_score + s.colleague_score + s.management_score +
      s.city_score + s.education_score + s.academic_score) / 6.0)::integer
  from public.clinic_review_preview_selections p
  join public.reviews r on r.id = p.review_id and r.comment = p.selected_comment
  join public.review_scores s on s.review_id = r.id
  where r.clinic_id = p_clinic_id and r.status = 'approved'
    and not r.show_nickname
    and exists (
      select 1 from auth.users u
      where u.id = auth.uid() and u.email_confirmed_at is not null
        and not u.is_anonymous
    )
  order by r.created_at desc, r.id
  limit 2;
$$;

create function public.admin_clinic_review_preview_ids(p_clinic_id uuid)
returns setof uuid
language sql stable security definer set search_path = ''
as $$
  select p.review_id
  from public.clinic_review_preview_selections p
  join public.reviews r on r.id = p.review_id and r.comment = p.selected_comment
  where r.clinic_id = p_clinic_id and not r.show_nickname and r.status = 'approved'
    and exists (
      select 1 from auth.users u
      where u.id = auth.uid() and u.raw_app_meta_data ->> 'role' = 'admin'
    );
$$;

create function public.admin_set_clinic_review_preview(
  p_clinic_id uuid, p_review_id uuid, p_comment text, p_enabled boolean
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from auth.users u
    where u.id = auth.uid() and u.raw_app_meta_data ->> 'role' = 'admin'
  ) then
    raise exception 'Admin yetkisi gerekiyor' using errcode = '42501';
  end if;

  if p_enabled then
    insert into public.clinic_review_preview_selections (review_id, selected_comment)
    select r.id, r.comment
    from public.reviews r
    where r.id = p_review_id and r.clinic_id = p_clinic_id
      and r.status = 'approved' and not r.show_nickname
      and r.comment = p_comment and nullif(btrim(r.comment), '') is not null
    on conflict (review_id) do update set selected_comment = excluded.selected_comment;
  else
    delete from public.clinic_review_preview_selections p using public.reviews r
    where p.review_id = r.id and r.id = p_review_id and r.clinic_id = p_clinic_id;
  end if;

  return found;
end;
$$;

revoke all on function public.clinic_review_previews(uuid),
  public.admin_clinic_review_preview_ids(uuid),
  public.admin_set_clinic_review_preview(uuid, uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function public.clinic_review_previews(uuid),
  public.admin_clinic_review_preview_ids(uuid),
  public.admin_set_clinic_review_preview(uuid, uuid, text, boolean)
  to authenticated;
