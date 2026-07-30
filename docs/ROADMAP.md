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

*(CTO code review sonrası: `doctors` tablosunun hiç kişisel veri içermediği teyit edildi; `doctor_workplaces` alan adları `work_start_date`/`work_end_date` olarak netleştirildi ve `is_verified_workplace` eklendi; `reports.resolved_at` eklendi (status ile tutarlılığı CHECK ile zorlanıyor) — "Sprint 2 - CTO Review Fixes" commit'i.)*

## Sprint 3 — Hospital & Clinic Discovery ✅ (bu teslimat)

- Ana sayfa: hero, büyük arama kutusu, gerçek veriden "öne çıkan şehirler"
- Global arama: çok kelimeli, akıllı (hastane adı + il + ilçe + branş, kelimeler arası AND / alanlar arası OR)
- Filtreler: şehir, hastane türü
- Hastane detay: gerçek veri + klinik listesi; klinik detay: gerçek veri + "Henüz değerlendirme yok."
- `HospitalRepository`/`ClinicRepository` genişletildi; yeni `search_clinics` RPC fonksiyonu + `hospital_city_counts` view
- Server Component + `loading.tsx`/`error.tsx` her rotada; ISR (`revalidate`) ile gereksiz DB sorgusu azaltıldı
- Detaylar: `docs/SPRINT3.md`

**Bilinen sınır / Sprint sonrası takip:** Arama harfi harfine çalışıyor, branş eşanlamlıları (Dahiliye ↔ İç Hastalıkları gibi) tanımıyor. İleride bir "branş eşanlamlıları" tablosu/mapping'i eklenmeli.

*(İkinci geçiş — "Smart Hospital Search": sonuçlar artık `pg_trgm` `similarity()` ile alaka düzeyine göre sıralanıyor (önceden yalnızca alfabetikti); yeni `branch_synonyms` tablosu günlük dildeki terimleri ("dahiliye" → "İç Hastalıkları") çözüyor — yukarıdaki bilinen sınır artık kısmen kapandı. Hastane araması da tutarlılık için RPC'ye taşındı. Detaylar `docs/SPRINT3.md`'de — "Sprint 3 - Smart Hospital Search" commit'i. İleride veri büyüdükçe tam bir `tsvector` full-text-search'e geçiş düşünülebilir.)*

## Sprint 4 (öneri)

- Kimlik doğrulama (Supabase Auth, hekim kaydı, diploma/TTB no belge yükleme akışı)
- `doctors`/`reviews` RLS placeholder politikalarının gerçek kurallarla değiştirilmesi
- Kurum bağlama (SGK hizmet dökümü ile "aktif/önceden çalıştı" rozeti) → `doctor_workplaces` doldurulması
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

> Not: Sprint 4 ve sonrası için kapsam/sıralama bir öneri taslağıdır, bağlayıcı değildir.
