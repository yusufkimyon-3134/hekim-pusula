# Hekim Pusula

Kura / atama öncesi hekimlerin kurum deneyimi paylaştığı platform.

## Sprint durumu

Bu depo şu an **Sprint 2 — Database Foundation** aşamasındadır: veritabanı şeması (migration + seed data) hazır, arama sayfası gerçek Supabase verisiyle çalışıyor; kimlik doğrulama, yorum yazma UI'ı, iletişim ve moderasyon gibi özellikler henüz implemente edilmemiştir.

Detaylar için:
- [`docs/PRD.md`](docs/PRD.md) — ürün gereksinimleri
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — sprint planı
- [`docs/DATABASE.md`](docs/DATABASE.md) — veritabanı şeması
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — mimari kararlar ve gerekçeleri

## Kurulum

```bash
npm install
cp .env.example .env.local   # Supabase URL/anon key gir
supabase link                # gerçek Supabase projesine bağla
supabase db push             # migration'ları uygula, sonra seed.sql'i çalıştır
npm run dev
```

## Teknoloji

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · TanStack Query · React Hook Form · Zod
