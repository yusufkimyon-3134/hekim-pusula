-- Bu fonksiyonların gövdeleri mevcut şemada public nesnelerini şemasız
-- adlarla kullanıyor. Çalışma yolunu public + güvenli geçici şemaya sabitle;
-- oturumun search_path değerinden etkilenmelerini önle.

alter function public.set_updated_at()
  set search_path = public, pg_temp;

alter function public.enforce_review_consistency()
  set search_path = public, pg_temp;

alter function public.search_hospitals(text, text, public.hospital_type)
  set search_path = public, pg_temp;

alter function public.rank_clinics_by_branch(text, text)
  set search_path = public, pg_temp;

alter function public.search_clinics(
  text, text, public.hospital_type, numeric, numeric, numeric, numeric
)
  set search_path = public, pg_temp;

alter function public.top_clinics_this_month(integer)
  set search_path = public, pg_temp;

alter function public.most_improved_clinics(integer)
  set search_path = public, pg_temp;

alter function public.trending_specialties(integer)
  set search_path = public, pg_temp;

alter function public.most_discussed_hospitals(integer)
  set search_path = public, pg_temp;

alter function public.update_review(
  uuid, integer, integer, integer, boolean, text,
  integer, integer, integer, integer, integer, integer, boolean
)
  set search_path = public, pg_temp;

alter function public.refresh_review_verification_on_content_change()
  set search_path = public, pg_temp;
