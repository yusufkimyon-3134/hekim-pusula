-- Data API yalnızca service_role ile erişebilir. Açık politika, linter'a da
-- bu tablonun bilinçli biçimde yalnız sunucu rolüne ayrıldığını gösterir.
create policy admin_notification_deliveries_service_role_all
  on public.admin_notification_deliveries
  for all
  to service_role
  using (true)
  with check (true);

-- Teslimatlar delivery_key üzerinden okunur; oluşturulma tarihi indeksi
-- kullanılmadığı için gereksiz yazma maliyeti oluşturmamalı.
drop index if exists public.admin_notification_deliveries_created_at_idx;
