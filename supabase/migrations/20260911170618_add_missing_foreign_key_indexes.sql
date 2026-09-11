-- Cover foreign-key columns used by joins and parent-row updates/deletes.
create index if not exists review_helpful_votes_doctor_id_idx
  on public.review_helpful_votes (doctor_id);

create index if not exists review_question_messages_sender_doctor_id_idx
  on public.review_question_messages (sender_doctor_id);

create index if not exists review_questions_review_id_idx
  on public.review_questions (review_id);
