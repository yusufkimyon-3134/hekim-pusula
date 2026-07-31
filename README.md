# Hekim Pusula

Kura / atama öncesi hekimlerin kurum deneyimi paylaştığı, gerçek verilere
dayalı bir keşif ve karar destek platformu.

## Proje durumu

**Sprint 1–8 tamamlandı.** Uygulama; hastane/klinik keşfi, akıllı arama,
kimlik doğrulama, deneyim paylaşımı, itibar/moderasyon sistemi, klinik
karşılaştırma ve isteğe bağlı AI destekli özetleri içeren, uçtan uca
çalışan bir MVP durumundadır.

| Sprint | Kapsam |
|---|---|
| 1 | Temel proje kurulumu, marka/tasarım sistemi, veritabanı şeması taslağı |
| 2 | Veritabanı temeli (migration'lar, seed data, RLS placeholder'ları) |
| 3 | Hastane/klinik keşfi + akıllı arama (alaka sıralaması, branş eşanlamlıları) |
| 4 | Premium klinik detay deneyimi (tasarım/UX) |
| 5 | Kimlik doğrulama (Supabase Auth), profil, deneyim paylaşımı yazma akışı |
| 6 | Klinik karşılaştırma, sıralama sayfaları, gelişmiş arama filtreleri, istatistikler |
| 7 | İtibar sistemi, faydalı oy, raporlama, moderasyon, review düzenleme/silme |
| 8 | AI Kariyer Danışmanı — klinik özeti, karşılaştırma özeti, kariyer eşleştirme, konu tespiti, AI dashboard |

Ayrıca projenin yerel makinelerde güvenilir şekilde çalışmasını sağlayan
bir dizi altyapı/bugfix turu yapıldı (bkz. `docs/BUGFIX_LOCAL_STARTUP.md`).

### Şu an çalışan başlıca özellikler

- Hastane/klinik arama (metin + gelişmiş filtreler: şehir, tür, minimum puan)
- Hastane ve klinik detay sayfaları (istatistikler, puan dağılımı, artı/eksi, öne çıkan yorumlar)
- E-posta/şifre ile kayıt, giriş, profil yönetimi
- Kimliği gizli (anonim) deneyim/yorum paylaşımı, düzenleme, silme
- Faydalı oy, yorum raporlama, otomatik moderasyon (çok raporlanan içerik gizlenir)
- Klinik karşılaştırma (`/compare`) ve branşa göre sıralama (`/rankings`)
- Kariyer eşleştirme anketi (`/career-match`) — deterministik uyum puanı
- (Opsiyonel, `ANTHROPIC_API_KEY` ile) AI klinik özeti ve AI karşılaştırma özeti

### Henüz yapılmayanlar (bilinçli olarak kapsam dışı, yol haritasında)

- Hekim kimlik doğrulama belgesi yükleme akışı (diploma/TTB no)
- Moderatör paneli (raporlar şu an yalnızca otomatik eşiklerle işleniyor)
- Aktif hekimle anonim iletişim/sohbet, bildirimler

Detaylı yol haritası: [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Hızlı başlangıç

```bash
npm install
cp .env.example .env.local   # Supabase URL/anon key gir
npx supabase link            # gerçek Supabase projesine bağla
npx supabase db push         # migration'ları uygula
npm run dev
```

**Adım adım, sorun giderme dahil tam kurulum kılavuzu için → [`RUN.md`](RUN.md)**

> **Not:** `.env.local` henüz oluşturulmamış olsa bile `npm run dev` çalışır ve
> `/`, `/login`, `/register`, `/search` gibi sayfalar açılır — yalnızca gerçek
> Supabase verisi gösteren bölümler boş/"veri yok" durumunda görünür. Gerçek
> işlevsellik için `.env.local` adımı gereklidir.

## Dokümantasyon

- [`RUN.md`](RUN.md) — sıfırdan kurulum, ortam değişkenleri, komutlar, sorun giderme
- [`docs/PRD.md`](docs/PRD.md) — ürün gereksinimleri
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — sprint planı ve öneriler
- [`docs/DATABASE.md`](docs/DATABASE.md) — veritabanı şeması, RLS politikaları
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — mimari kararlar ve gerekçeleri
- [`docs/SPRINT3.md`](docs/SPRINT3.md) … [`docs/SPRINT8.md`](docs/SPRINT8.md) — sprint bazlı tasarım/teknik kararlar
- [`docs/BUGFIX_LOCAL_STARTUP.md`](docs/BUGFIX_LOCAL_STARTUP.md) — yerel başlatma sorunlarının teşhis/düzeltme kaydı

## Teknoloji

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Auth + Postgres + RLS) · Zod · Anthropic API (opsiyonel, AI özetleri için)
