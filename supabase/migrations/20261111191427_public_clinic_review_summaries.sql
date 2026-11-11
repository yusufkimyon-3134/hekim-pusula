-- Publish only aggregates of approved, scored reviews for public clinic records.
-- The view owner reads through RLS so visitors never need access to review rows.
create view public.public_clinic_review_summaries
with (security_invoker = false) as
select
  c.id as clinic_id,
  count(*)::integer as review_count,
  max(r.last_verified_at) as last_verified_at
from public.clinics c
join public.reviews r on r.clinic_id = c.id
where c.merged_into_id is null
  and r.status = 'approved'
  and exists (
    select 1 from public.review_scores s where s.review_id = r.id
  )
group by c.id;

revoke all on public.public_clinic_review_summaries from public, anon, authenticated;
grant select on public.public_clinic_review_summaries to anon, authenticated;
