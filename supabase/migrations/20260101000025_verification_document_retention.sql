-- Hekim Doğrulama Belgesi — Saklama Süresi ve Otomatik Silme Zamanlaması
--
-- Bu migration YALNIZCA zamanlamayı (ne zaman silinecek) veritabanı
-- seviyesinde hesaplıyor. Gerçek dosya silme işlemi BİLİNÇLİ OLARAK
-- burada (SQL'de) yapılmıyor — bir Postgres trigger'ının Storage API'yi
-- çağırma yetkisi/güvenli bir yolu yok. Gerçek silme,
-- `supabase/functions/cleanup-verification-documents` Edge Function'ında,
-- yalnızca service_role ile, günde bir kez (bkz.
-- docs/verification-document-retention.md) yapılır.
--
-- Kural: başvuru 'pending' iken document_delete_after hep NULL kalır
-- (yalnızca approved/rejected'e geçişte set edilir) — bu yüzden "pending
-- iken asla silinmesin" kuralı, ayrı bir kontrol gerektirmeden, bu
-- tasarımın doğal bir sonucu.

alter table doctor_verification_requests
  add column document_delete_after timestamptz,
  add column document_deleted_at timestamptz;

comment on column doctor_verification_requests.document_delete_after is
  'Kararın (approved/rejected) verildiği andan 30 gün sonrası — bu tarihten sonra Edge Function belgeyi Storage''dan silmeye uygun sayar. pending iken NULL.';
comment on column doctor_verification_requests.document_deleted_at is
  'Belge Storage''dan GERÇEKTEN silindiği an. Bu alan doluysa document_path artık null''dır (silinen bir dosyaya işaret etmez).';

-- document_path artık silme sonrası null olabilmeli.
alter table doctor_verification_requests
  alter column document_path drop not null;

comment on column doctor_verification_requests.document_path is
  'Storage''daki belge yolu. Belge silindikten sonra (document_deleted_at doldurulduğunda) null''a çekilir — yalnızca asgari denetim kaydı (başvuru sahibi, belge türü, karar, karar tarihi, silme tarihi) kalır.';

-- ---------------------------------------------------------------------
-- Var olan karar trigger'ı (apply_doctor_verification_decision,
-- migration 22'de tanımlandı) genişletiliyor: approved/rejected'e
-- geçişte document_delete_after otomatik hesaplanıyor. Trigger
-- fonksiyonunun parametresi olmadığı için (returns trigger) burada bir
-- overload/imza belirsizliği riski YOK — create or replace güvenle
-- eskisinin yerine geçer (submit_review/update_review'daki durumdan
-- farklı).
-- ---------------------------------------------------------------------
create or replace function apply_doctor_verification_decision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update doctors set is_verified = true where id = new.doctor_id;
    new.reviewed_at := now();
    new.document_delete_after := now() + interval '30 days';
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    new.reviewed_at := now();
    new.document_delete_after := now() + interval '30 days';
  end if;
  return new;
end;
$$;

comment on function apply_doctor_verification_decision is
  'BEFORE UPDATE trigger''ı. approved: doctors.is_verified=true + reviewed_at + document_delete_after (+30 gün). rejected: reviewed_at + document_delete_after (+30 gün). pending''de hiçbiri set edilmez — belge yalnızca karar verildikten sonra silinme zamanlamasına girer.';

-- ---------------------------------------------------------------------
-- GERİYE DÖNÜK DÜZELTME (backfill): Bu migration'dan ÖNCE zaten
-- approved/rejected olmuş kayıtların document_delete_after'ı, yukarıdaki
-- trigger hiç çalışmadığı için NULL kalmış olabilir — bu satırlar Edge
-- Function'ın sorgusunda ASLA seçilmez (çünkü sorgu
-- `document_delete_after is not null` şartı arıyor), yani belgeleri
-- SÜRESİZ olarak silinmeden kalabilirdi. Bunu, kararın verildiği ana en
-- yakın bilgiyi (reviewed_at; o da yoksa created_at) kullanarak
-- düzeltiyoruz.
-- ---------------------------------------------------------------------
update doctor_verification_requests
set document_delete_after = coalesce(reviewed_at, created_at) + interval '30 days'
where status in ('approved', 'rejected')
  and document_path is not null
  and document_delete_after is null;
