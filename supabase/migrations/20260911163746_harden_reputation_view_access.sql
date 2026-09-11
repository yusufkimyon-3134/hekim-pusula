-- doctor_reputation doğrudan bir API yüzeyi değildir. Çağıranın RLS
-- kurallarına uymasını sağla ve son kullanıcı rollerinin doğrudan erişimini
-- kaldır. get_my_reputation() fonksiyonu yalnızca auth.uid() satırını döndürür.
alter view public.doctor_reputation set (security_invoker = true);

revoke all on table public.doctor_reputation
  from public, anon, authenticated;
grant select on table public.doctor_reputation
  to service_role;

-- Bu iki view yalnızca kimliksiz toplamlar/itibar özeti döndüren bilinçli
-- okuma yüzeyleridir. Varsayılan geniş view ayrıcalıklarını kaldırıp sadece
-- SELECT bırak; INSERT/UPDATE/DELETE gibi anlamsız yetkileri kapat.
revoke all on table public.review_helpful_counts
  from public, anon, authenticated;
grant select on table public.review_helpful_counts
  to anon, authenticated, service_role;

revoke all on table public.review_author_stats
  from public, anon, authenticated;
grant select on table public.review_author_stats
  to anon, authenticated, service_role;
