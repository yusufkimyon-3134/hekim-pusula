-- Sprint 2: gerekli Postgres uzantıları
create extension if not exists pgcrypto;
-- Hastane adı/il/ilçe için ILIKE aramasını hızlandıran trigram indeksleri
create extension if not exists pg_trgm;
