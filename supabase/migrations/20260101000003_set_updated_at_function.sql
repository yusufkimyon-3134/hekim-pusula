-- Sprint 2: created_at/updated_at olan her tabloda tekrar eden trigger
-- mantığını tek bir fonksiyonda topluyoruz.

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'created_at/updated_at kolonu olan tablolarda UPDATE öncesi updated_at alanını otomatik günceller.';
