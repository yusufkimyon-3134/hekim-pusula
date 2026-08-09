-- Yorum yazarıyla özel soru-cevap alanı.
-- Soru ve cevap yalnızca soruyu soran hekim ile yorumu yazan hekim tarafından görülebilir.

create table if not exists public.review_questions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  asker_doctor_id uuid not null references public.doctors(id) on delete cascade,
  author_doctor_id uuid not null references public.doctors(id) on delete cascade,
  question text not null check (char_length(btrim(question)) between 10 and 1000),
  answer text check (answer is null or char_length(btrim(answer)) between 10 and 1500),
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  check (asker_doctor_id <> author_doctor_id)
);

create index if not exists review_questions_asker_created_at_idx
  on public.review_questions (asker_doctor_id, created_at desc);

create index if not exists review_questions_author_created_at_idx
  on public.review_questions (author_doctor_id, created_at desc);

alter table public.review_questions enable row level security;

create policy "Review question participants can read"
  on public.review_questions
  for select
  to authenticated
  using (asker_doctor_id = auth.uid() or author_doctor_id = auth.uid());

-- Yeni sorular yalnızca doğrulanmış hekimlerce, var olan bir yorumun yazarına gönderilir.
create or replace function public.create_review_question(
  p_review_id uuid,
  p_question text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_asker_id uuid := auth.uid();
  v_author_id uuid;
  v_question_id uuid;
begin
  if v_asker_id is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  if not exists (
    select 1 from public.doctors d
    where d.id = v_asker_id and d.is_verified = true
  ) then
    raise exception 'Özel soru sorabilmek için doğrulanmış hekim olmalısınız.';
  end if;

  select dw.doctor_id
    into v_author_id
  from public.reviews r
  join public.doctor_workplaces dw on dw.id = r.doctor_workplace_id
  where r.id = p_review_id;

  if v_author_id is null then
    raise exception 'Yorum bulunamadı.';
  end if;

  if v_author_id = v_asker_id then
    raise exception 'Kendi yorumunuza soru gönderemezsiniz.';
  end if;

  if char_length(btrim(coalesce(p_question, ''))) < 10 then
    raise exception 'Sorunuz en az 10 karakter olmalıdır.';
  end if;

  insert into public.review_questions (
    review_id, asker_doctor_id, author_doctor_id, question
  ) values (
    p_review_id, v_asker_id, v_author_id, btrim(p_question)
  ) returning id into v_question_id;

  return v_question_id;
end;
$$;

create or replace function public.answer_review_question(
  p_question_id uuid,
  p_answer text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid := auth.uid();
begin
  if v_author_id is null then
    raise exception 'Giriş yapmalısınız.';
  end if;

  if char_length(btrim(coalesce(p_answer, ''))) < 10 then
    raise exception 'Yanıtınız en az 10 karakter olmalıdır.';
  end if;

  update public.review_questions
  set answer = btrim(p_answer), answered_at = now()
  where id = p_question_id and author_doctor_id = v_author_id;

  if not found then
    raise exception 'Bu soruyu yanıtlama yetkiniz yok.';
  end if;
end;
$$;

revoke all on function public.create_review_question(uuid, text) from public;
revoke all on function public.answer_review_question(uuid, text) from public;
grant execute on function public.create_review_question(uuid, text) to authenticated;
grant execute on function public.answer_review_question(uuid, text) to authenticated;
