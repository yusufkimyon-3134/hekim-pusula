# Hekim Pusula

Kura / atama öncesi hekimlerin kurum deneyimi paylaştığı, gerçek verilere
dayalı bir keşif ve karar destek platformu.

## Proje durumu

**Sprint 1–10 kapsamı büyük ölçüde tamamlandı.** Uygulama; Türkiye geneli
kamu hastanesi/klinik keşfi, akıllı arama, kimlik ve hekim doğrulaması,
deneyim paylaşımı, itibar/moderasyon sistemi, klinik karşılaştırma, özel
soru-cevap ve isteğe bağlı AI destekli özetleri içeren çalışan bir MVP'dir.

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
| 9 | Belge yüklemeli hekim doğrulaması, yalnızca doğrulanmış hekim erişimi, belge saklama/silme politikası |
| 10 | Yönetim paneli, doğrulama kararları, üyelik istatistikleri ve yönetici e-posta bildirimleri |

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
- PDF/JPG/PNG belge yüklemeli hekim doğrulaması ve yönetici onay akışı
- Yönetim paneli (`/admin`) ve güvenli, süreli belge görüntüleme bağlantıları
- Deneyim sahibine özel soru sorma, yanıtlama ve mini konuşma akışı
- Şehir/branş keşif sayfaları, sitemap, canonical ve yapılandırılmış SEO verileri
- (Opsiyonel, `ANTHROPIC_API_KEY` ile) AI klinik özeti ve AI karşılaştırma özeti

### Henüz yapılmayanlar / sonraki geliştirmeler

- Kullanıcıların raporladığı yorumlar için ayrı moderasyon kuyruğu ve karar ekranı
- Özel soru-cevap bildirimlerinin genişletilmesi
- Canlı Supabase ortamında otomatik uçtan uca testler
- YHGM kontenjan verisinin otomatik alınması ve atama bildirimleri

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

Migration dosyalarının ad ve sürüm bütünlüğünü kontrol etmek için:

```bash
npm run check:migrations
```

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
