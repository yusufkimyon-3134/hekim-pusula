-- Kapalı Beta — Hukuki Kabul Kaydı
--
-- Kullanıcı kayıt formunda KVKK Aydınlatma Metni ve Kullanım Koşulları
-- için ayrı ayrı zorunlu onay verir (bkz. register/page.tsx). Bu kabul,
-- HENÜZ e-posta doğrulanmadan önce verilmiş sayılmaz — gerçek kayıt,
-- yalnızca e-posta aktivasyonu tamamlandığında (`/auth/callback`)
-- burada iki ayrı satır olarak (kvkk_aydinlatma + kullanim_kosullari)
-- damgalanır. Kullanıcı bu satırları ne değiştirebilir ne silebilir —
-- bu bir denetim/kanıt kaydıdır.

create type legal_document_type as enum ('kvkk_aydinlatma', 'kullanim_kosullari');

create table legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type legal_document_type not null,
  version text not null,
  accepted_at timestamptz not null default now()
);

comment on table legal_acceptances is
  'KVKK Aydınlatma Metni / Kullanım Koşulları kabul kaydı — e-posta aktivasyonu tamamlanınca (/auth/callback) yazılır. Kullanıcı yalnızca kendi kayıtlarını okuyabilir; değiştiremez/silemez (denetim kaydı).';

create index legal_acceptances_user_id_idx on legal_acceptances (user_id);

alter table legal_acceptances enable row level security;

create policy legal_acceptances_select_own
  on legal_acceptances for select
  using (user_id = auth.uid());

create policy legal_acceptances_insert_own
  on legal_acceptances for insert
  with check (user_id = auth.uid());

-- BİLİNÇLİ OLARAK: update/delete politikası yok — kullanıcı (ve normal
-- uygulama akışı) bu kayıtları asla değiştiremez/silemez.

grant select, insert on legal_acceptances to authenticated;
