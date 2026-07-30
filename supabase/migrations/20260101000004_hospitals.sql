create table hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  district text not null,
  hospital_type hospital_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table hospitals is
  'Yalnızca kamu hastaneleri (devlet, eğitim-araştırma, şehir, üniversite). Özel hastane kapsam dışıdır.';

create index hospitals_city_idx on hospitals (city);
create index hospitals_hospital_type_idx on hospitals (hospital_type);
-- İsme göre "içeriyor" (ILIKE) aramasını hızlandırmak için trigram indeksi.
create index hospitals_name_trgm_idx on hospitals using gin (name gin_trgm_ops);

create trigger set_hospitals_updated_at
  before update on hospitals
  for each row
  execute function set_updated_at();
