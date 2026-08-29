-- Admin bildirim teslimat kayıtları ve günlük zamanlanmış bildirim görevi.
-- E-posta tablosunda kişisel veri veya belge yolu tutulmaz.

create table public.admin_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_key text not null unique,
  kind text not null check (kind in ('verification_request', 'signup_digest', 'verification_reminder')),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_notification_deliveries is
  'Admin e-posta bildirimlerinin tekrar gönderilmesini önleyen teknik teslimat kaydı. Kişisel veri ve belge bilgisi içermez.';

alter table public.admin_notification_deliveries enable row level security;
revoke all on table public.admin_notification_deliveries from public, anon, authenticated;
grant select, insert, update on table public.admin_notification_deliveries to service_role;

create index admin_notification_deliveries_created_at_idx
  on public.admin_notification_deliveries (created_at desc);

create or replace function public.admin_signup_count_since(p_since timestamptz)
returns bigint
language sql
security definer
stable
set search_path = ''
as $$
  select count(*) from auth.users where created_at >= p_since;
$$;

revoke all on function public.admin_signup_count_since(timestamptz) from public, anon, authenticated;
grant execute on function public.admin_signup_count_since(timestamptz) to service_role;

do $setup$
begin
  if exists (select 1 from vault.secrets where name = 'verification_cleanup_webhook_secret') then
    if exists (select 1 from cron.job where jobname = 'send-admin-notifications-daily') then
      perform cron.unschedule('send-admin-notifications-daily');
    end if;

    -- Her gün 05:00 UTC / 08:00 Türkiye saati.
    perform cron.schedule(
      'send-admin-notifications-daily',
      '0 5 * * *',
      $job$
      select net.http_post(
        url := 'https://www.hekimpusula.com.tr/api/cron/admin-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-admin-notification-secret', (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'verification_cleanup_webhook_secret'
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 15000
      );
      $job$
    );
  end if;
end
$setup$;
