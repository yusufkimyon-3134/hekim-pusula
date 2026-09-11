-- Keep extension-owned objects outside the API-exposed public schema.
create schema if not exists extensions;

alter extension pg_trgm set schema extensions;

-- These search RPCs use pg_trgm's similarity() function with an unqualified
-- name, so retain an explicit and deterministic lookup path after the move.
alter function public.search_hospitals(text, text, public.hospital_type)
  set search_path = public, extensions, pg_temp;

alter function public.search_clinics(
  text, text, public.hospital_type, numeric, numeric, numeric, numeric
)
  set search_path = public, extensions, pg_temp;
