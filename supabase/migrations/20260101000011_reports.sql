create table reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews (id) on delete cascade,
  -- doctor_id nullable + "set null": bildiren hekimin hesabı silinse bile
  -- moderasyon kaydı (reason/status) korunur; yalnızca kim bildirdiği bilgisi kaybolur.
  doctor_id uuid references doctors (id) on delete set null,
  reason text not null,
  status report_status not null default 'pending',
  -- Bir moderatörün bu raporu ne zaman sonuçlandırdığı (kaldırıldı/reddedildi
  -- vb.). status 'pending' iken null olmalı; sonuçlandırılınca doldurulur.
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'pending' or resolved_at is not null),
  check (status <> 'pending' or resolved_at is null)
);

comment on table reports is
  'Bir yorum hakkındaki şikayet/moderasyon kaydı. doctor_id kasıtlı olarak nullable: hesap silinse bile moderasyon geçmişi kaybolmaz. resolved_at, status ile tutarlı tutulur (CHECK): "pending" iken null, değilken dolu olmalıdır.';

create index reports_review_id_idx on reports (review_id);
create index reports_doctor_id_idx on reports (doctor_id);
create index reports_status_idx on reports (status);
-- Moderasyon kuyruğu (bekleyen raporlar) en eskiden yeniye sık listelenecek.
create index reports_pending_queue_idx on reports (created_at) where resolved_at is null;

create trigger set_reports_updated_at
  before update on reports
  for each row
  execute function set_updated_at();
