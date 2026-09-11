-- SECURITY DEFINER fonksiyonları Postgres tarafından varsayılan olarak
-- PUBLIC rolüne açılabilir. Kullanıcıya özel RPC'leri yalnızca oturum açmış
-- hekimlere, tetikleyici fonksiyonunu ise yalnızca sunucu rolüne sınırla.
-- Herkese açık search_suggestions RPC'sinin mevcut izinleri korunur.

revoke execute on function public.answer_review_question(uuid, text)
  from public, anon;
revoke execute on function public.confirm_review_current(uuid)
  from public, anon;
revoke execute on function public.create_review_question(uuid, text)
  from public, anon;
revoke execute on function public.get_my_reputation()
  from public, anon;
revoke execute on function public.is_verified_doctor()
  from public, anon;
revoke execute on function public.send_review_question_message(uuid, text)
  from public, anon;
revoke execute on function public.set_review_question_contact_consent(uuid, boolean)
  from public, anon;

grant execute on function public.answer_review_question(uuid, text)
  to authenticated, service_role;
grant execute on function public.confirm_review_current(uuid)
  to authenticated, service_role;
grant execute on function public.create_review_question(uuid, text)
  to authenticated, service_role;
grant execute on function public.get_my_reputation()
  to authenticated, service_role;
grant execute on function public.is_verified_doctor()
  to authenticated, service_role;
grant execute on function public.send_review_question_message(uuid, text)
  to authenticated, service_role;
grant execute on function public.set_review_question_contact_consent(uuid, boolean)
  to authenticated, service_role;

revoke execute on function public.flag_heavily_reported_reviews()
  from public, anon, authenticated;
grant execute on function public.flag_heavily_reported_reviews()
  to service_role;
