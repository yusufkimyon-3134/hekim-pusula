-- Hekim doğrulama belgelerini onay/ret kararından hemen sonra sil.
-- Dosyanın kendisi Storage API üzerinden Edge Function tarafından silinir.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create or replace function public.apply_doctor_verification_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.doctors set is_verified = true where id = new.doctor_id;
    new.reviewed_at := now();
    new.document_delete_after := now();
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.reviewed_at := now();
    new.document_delete_after := now();
  end if;
  return new;
end;
$$;

revoke all on function public.apply_doctor_verification_decision() from public;
revoke all on function public.apply_doctor_verification_decision() from anon, authenticated;

comment on function public.apply_doctor_verification_decision() is
  'Onay/ret kararını uygular ve belgeyi karar anında silinmeye hazırlar. Gerçek Storage silme işlemi Edge Function tarafından yapılır.';

comment on column public.doctor_verification_requests.document_delete_after is
  'Onay/ret kararının verildiği an. Edge Function belgeyi bu andan itibaren siler; pending iken NULL kalır.';

create or replace function private.invoke_verification_document_cleanup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleanup_secret text;
  anon_key text;
begin
  if new.status not in ('approved', 'rejected')
     or old.status is not distinct from new.status
     or new.document_path is null then
    return new;
  end if;

  select decrypted_secret into cleanup_secret
  from vault.decrypted_secrets
  where name = 'verification_cleanup_webhook_secret';

  select decrypted_secret into anon_key
  from vault.decrypted_secrets
  where name = 'verification_cleanup_anon_key';

  if cleanup_secret is null or anon_key is null then
    raise warning 'Doğrulama belgesi temizleme sırları Vault içinde bulunamadı';
    return new;
  end if;

  perform net.http_post(
    url := 'https://zeqageoilytygvljrdyn.supabase.co/functions/v1/cleanup-verification-documents',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key,
      'x-cleanup-secret', cleanup_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );

  return new;
exception when others then
  raise warning 'Doğrulama belgesi temizleme çağrısı başlatılamadı: %', sqlerrm;
  return new;
end;
$$;

revoke all on function private.invoke_verification_document_cleanup() from public;
revoke all on function private.invoke_verification_document_cleanup() from anon, authenticated;

drop trigger if exists doctor_verification_requests_cleanup_document
  on public.doctor_verification_requests;

create trigger doctor_verification_requests_cleanup_document
after update of status on public.doctor_verification_requests
for each row
execute function private.invoke_verification_document_cleanup();

update public.doctor_verification_requests
set document_delete_after = now()
where status in ('approved', 'rejected')
  and document_path is not null
  and document_deleted_at is null;

do $setup$
begin
  if exists (select 1 from vault.secrets where name = 'verification_cleanup_webhook_secret')
     and exists (select 1 from vault.secrets where name = 'verification_cleanup_anon_key') then
    if exists (select 1 from cron.job where jobname = 'cleanup-verification-documents-every-minute') then
      perform cron.unschedule('cleanup-verification-documents-every-minute');
    end if;

    perform cron.schedule(
      'cleanup-verification-documents-every-minute',
      '* * * * *',
      $job$
      select net.http_post(
        url := 'https://zeqageoilytygvljrdyn.supabase.co/functions/v1/cleanup-verification-documents',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'verification_cleanup_anon_key'
          ),
          'x-cleanup-secret', (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'verification_cleanup_webhook_secret'
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      );
      $job$
    );
  end if;
end
$setup$;
