# Hekim Pusula

Kura / atama öncesi hekimlerin kurum deneyimi paylaştığı platform.

## Sprint durumu

Bu depo şu an **Sprint 1 — Foundation** aşamasındadır: proje iskeleti, tasarım sistemi ve placeholder sayfalar hazır; kimlik doğrulama, yorum/puanlama, iletişim ve moderasyon gibi özellikler henüz implemente edilmemiştir.

Detaylar için:
- [`docs/PRD.md`](docs/PRD.md) — ürün gereksinimleri
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — sprint planı
- [`docs/DATABASE.md`](docs/DATABASE.md) — veritabanı şeması taslağı

## Kurulum

```bash
npm install
cp .env.example .env.local   # Supabase URL/anon key gir
npm run dev
```

## Teknoloji

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase · TanStack Query · React Hook Form · Zod
