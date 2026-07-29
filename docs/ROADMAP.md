# Hekim Pusula — Roadmap

## Sprint 1 — Foundation ✅ (bu teslimat)

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 kurulumu
- shadcn/ui temel bileşenleri (Button, Card, Input, Label, Badge)
- Supabase istemcileri (browser + server) — yalnızca bağlantı katmanı, henüz kullanılmıyor
- TanStack Query provider kurulumu
- React Hook Form + Zod bağımlılıkları kuruldu (henüz forma bağlanmadı)
- Ölçeklenebilir klasör mimarisi (`components`, `features`, `lib`, `types`, `hooks`)
- Placeholder sayfalar: Ana Sayfa, Arama, Hastane Detay, Klinik Detay
- Marka tasarım sistemi (renk token'ları, tipografi) `globals.css` içinde
- Production build doğrulandı

## Sprint 2 (öneri — henüz başlanmadı)

- Supabase şemasının migration olarak yazılması (bkz. `DATABASE.md`)
- Kurum arama sayfasının gerçek veriyle çalışması (statik placeholder yerine)
- Hastane/klinik detay sayfalarının Supabase'den veri çekmesi

## Sprint 3 (öneri)

- Kimlik doğrulama (hekim kaydı, diploma/TTB no belge yükleme akışı)
- Kurum bağlama (SGK hizmet dökümü ile "aktif/önceden çalıştı" rozeti)

## Sprint 4 (öneri)

- Yorum/puanlama sistemi (kategori bazlı puanlama + serbest metin)
- Katkı teşviki (ver-gör kilidi + ilk görev muafiyeti)

## Sprint 5 (öneri)

- Aktif hekimle anonim iletişim talebi ve sohbet
- Bildirimler (talep yanıtı, doğrulama sonucu)

## Sprint 6 (öneri)

- Moderatör paneli (belge onay/red, yorum şikayeti inceleme)
- Moderasyon kuyruğu ve SLA takibi

## Sonraki (öneri, önceliklendirilmedi)

- YHGM kontenjan verisinin otomatik çekilmesi (bkz. ayrı `parse_kontenjan.py` scripti)
- Atama türüne göre kişiselleştirilmiş bildirimler (kura takvimi)

> Not: Sprint 2 ve sonrası için kapsam, sıralama ve tahmini süre bu dokümanın ilk halinde netleştirilmemiştir — ekip içinde önceliklendirme yapılması gerekir. Bu roadmap bir öneri taslağıdır, bağlayıcı bir plan değildir.
