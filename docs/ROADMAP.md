# Hekim Pusula — Roadmap

## Sprint 1 — Foundation ✅

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 kurulumu
- shadcn/ui temel bileşenleri (Button, Card, Input, Label, Badge)
- Supabase istemcileri (browser + server) — bağlantı katmanı
- TanStack Query provider kurulumu
- React Hook Form + Zod bağımlılıkları
- Ölçeklenebilir klasör mimarisi
- Placeholder sayfalar: Ana Sayfa, Arama, Hastane Detay, Klinik Detay
- Marka tasarım sistemi
- Production build doğrulandı

*(CTO code review sonrası: env doğrulama, CardTitle/CardDescription semantik düzeltmesi, next/link kullanımı, tip tutarlılığı, DetailPageHeader ortak bileşeni — "Sprint 1 - CTO Review Fixes" commit'i.)*

## Sprint 2 — Database Foundation ✅ (bu teslimat)

- 8 tablo için migration: `hospitals`, `clinics`, `doctors`, `doctor_workplaces`, `reviews`, `review_scores`, `favorites`, `reports`
- UUID PK, doğru FK'ler (cascade/restrict/set null — gerekçesi `ARCHITECTURE.md`'de), useful indeksler (b-tree + trigram)
- Her tabloda RLS etkin; `hospitals`/`clinics` herkese açık okunur, diğerleri kimlik doğrulama gelene kadar kilitli placeholder politika
- `reviews` için tutarlılık + tekillik trigger'ı (`enforce_review_consistency`)
- Migration'lar ve iş kuralları **gerçek bir PostgreSQL 16 örneğine karşı test edildi** (bu sandbox'ta geçici olarak kuruldu)
- Seed data: 20 kamu hastanesi, 15 farklı şehir, 160 klinik
- `HospitalRepository`, `ClinicRepository` — arama sayfası artık hardcode veri değil, gerçek repository kullanıyor
- `docs/DATABASE.md` (güncellendi, İngilizce şemaya geçildi), `docs/ARCHITECTURE.md` (yeni)
- Build/lint/typecheck doğrulandı

## Sprint 3 (öneri — henüz başlanmadı)

- Kimlik doğrulama (Supabase Auth, hekim kaydı, diploma/TTB no belge yükleme akışı)
- `doctors`/`reviews` RLS placeholder politikalarının gerçek kurallarla değiştirilmesi
- Kurum bağlama (SGK hizmet dökümü ile "aktif/önceden çalıştı" rozeti) → `doctor_workplaces` doldurulması

## Sprint 4 (öneri)

- Yorum/puanlama yazma akışı (`reviews`, `review_scores` repository'leri ve UI)
- Katkı teşviki (ver-gör kilidi + ilk görev muafiyeti)

## Sprint 5 (öneri)

- Aktif hekimle anonim iletişim talebi ve sohbet
- Bildirimler

## Sprint 6 (öneri)

- Moderatör paneli (`reports` kuyruğu)

## Sonraki (öneri, önceliklendirilmedi)

- YHGM kontenjan verisinin otomatik çekilmesi
- Atama türüne göre kişiselleştirilmiş bildirimler

> Not: Sprint 3 ve sonrası için kapsam/sıralama bir öneri taslağıdır, bağlayıcı değildir.
