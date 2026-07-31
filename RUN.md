# RUN.md — Hekim Pusula'yı Çalıştırma Kılavuzu

Bu belge, projeyi sıfırdan (temiz bir makinede) kurup çalıştırmak için
gereken tüm adımları içerir.

## Desteklenen sürümler

| Araç | Sürüm | Not |
|---|---|---|
| Node.js | `18.18.0+`, `19.8.0+` veya `20.0.0+` | Next.js 15'in kendi minimum gereksinimi (`package.json` → `engines`). En kolayı: **Node 20 LTS** kullanmak. |
| npm | `9+` (proje `10.9.7` ile test edildi) | Node ile birlikte gelir. |
| Supabase CLI | `2.x` | Yalnızca migration'ları gerçek bir projeye uygulamak için gerekli — `npx supabase` ile global kurulum olmadan da kullanılabilir. |

> Node sürümünü kontrol et: `node --version`. Doğru aralıkta değilse
> [nodejs.org](https://nodejs.org)'dan LTS sürümünü kur (Windows'ta
> `nvm-windows` ile birden fazla sürüm arasında geçiş yapabilirsin).

## 1) Bağımlılıkları kur

```bash
npm install
```

Kilit dosyasıyla birebir, daha kontrollü bir kurulum istiyorsan (CI'da
kullanılan yöntem):

```bash
npm ci
```

Kurulum sırasında bazı `npm warn` (peer dependency) satırları görebilirsin
— bunlar zararsızdır, ESLint araç zincirinin transitive bağımlılıklarından
kaynaklanır ve uygulamanın çalışmasını etkilemez.

## 2) `.env.local` oluştur

```bash
cp .env.example .env.local
```

Sonra `.env.local`'ı aç ve şu değişkenleri doldur:

| Değişken | Zorunlu mu? | Nereden alınır |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Gerçek işlevsellik için evet | Supabase projesi → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Gerçek işlevsellik için evet | Supabase projesi → Settings → API → `anon` `public` anahtarı |
| `ANTHROPIC_API_KEY` | Hayır (opsiyonel) | Yalnızca AI klinik özeti / karşılaştırma özeti için. Tanımlı değilse bu iki kart "AI şu an kullanılamıyor" gösterir, uygulamanın geri kalanı normal çalışır. |

> **Önemli:** `.env.local` dosyası **oluşturulmasa bile** `npm run dev`
> çalışır ve `/`, `/login`, `/register`, `/search` gibi sayfalar açılır —
> yalnızca gerçek Supabase verisi gösteren bölümler boş görünür. Ama
> gerçek giriş, arama sonucu, yorum yazma gibi işlevsellik için yukarıdaki
> iki Supabase değişkeni **gerekli**. Detaylar: `docs/BUGFIX_LOCAL_STARTUP.md`.

## 3) Supabase projesini bağla ve migration'ları uygula

Henüz bir Supabase projen yoksa [supabase.com](https://supabase.com)'da
ücretsiz bir proje oluştur, sonra:

```bash
npx supabase login
npx supabase link --project-ref <proje-ref-kodun>
npx supabase db push
```

`supabase db push`, `supabase/migrations/` klasöründeki **tüm dosyaları
dosya adındaki zaman damgası sırasına göre otomatik olarak** uygular —
tek tek elle çalıştırman gerekmez. Sıra (referans için, hepsi zaten
tarih önekiyle sıralı):

```
20260101000001_extensions.sql                    — pgcrypto, pg_trgm
20260101000002_enums.sql                         — hospital_type, doctor_role, report_status
20260101000003_set_updated_at_function.sql       — paylaşılan trigger fonksiyonu
20260101000004_hospitals.sql
20260101000005_clinics.sql
20260101000006_doctors.sql                       — auth.users(id)'e referans, kişisel veri yok
20260101000007_doctor_workplaces.sql
20260101000008_reviews.sql
20260101000009_review_scores.sql
20260101000010_favorites.sql
20260101000011_reports.sql
20260101000012_rls_policies.sql                  — ilk RLS (placeholder'lar)
20260101000013_search_support.sql                — arama view/fonksiyonları
20260101000014_search_ranking_and_synonyms.sql    — alaka sıralaması, branş eşanlamlıları
20260101000015_profiles_and_real_rls.sql          — profil alanları, gerçek RLS (auth sonrası)
20260101000016_submit_review_rpc.sql              — atomik review gönderimi
20260101000017_comparison_and_ranking.sql          — karşılaştırma/sıralama fonksiyonları
20260101000018_reputation_moderation_trust.sql     — itibar, moderasyon, faydalı oy, rapor
20260101000019_ai_topics_and_dashboard.sql         — konu tespiti, AI dashboard
```

Migration'lardan sonra örnek veriyi yükle:

```bash
npx supabase db execute -f supabase/seed.sql
```

(Ya da Supabase Dashboard → SQL Editor'a `supabase/seed.sql`'in içeriğini
yapıştırıp çalıştırabilirsin.)

**Yerel Supabase (Docker ile) kullanmak istersen** — gerçek bir Supabase
projesi yerine tamamen yerel bir kopya:

```bash
npx supabase start     # yerel Postgres + Auth + API'yi Docker'da başlatır
npx supabase db reset  # migration'ları + seed.sql'i sıfırdan uygular
```

Bu durumda `.env.local`'daki değerleri `npx supabase status` komutunun
verdiği yerel `API URL` ve `anon key` ile doldur.

## 4) Geliştirme sunucusunu başlat

```bash
npm run dev
```

Tarayıcıda **http://localhost:3000** adresini aç.

## Diğer komutlar

| Komut | Ne yapar |
|---|---|
| `npm run build` | Production build (deploy öncesi doğrulama için) |
| `npm start` | Production sunucusunu başlatır (önce `npm run build` gerekir) |
| `npm run lint` | ESLint kontrolü |
| `npx tsc --noEmit` | TypeScript tip kontrolü (ayrı bir script olarak tanımlı değil, doğrudan çalıştırılır) |

## Sorun Giderme (Troubleshooting)

### `localhost:3000` açılmıyor / sayfa 500 veriyor
- `.env.local` dosyasının var olduğundan ve içindeki `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`'in doğru (boşluksuz, tırnaksız) olduğundan emin ol.
- `.env.local` değiştiyse dev sunucusunu **yeniden başlat** (Next.js ortam değişkeni değişikliklerini otomatik almaz).
- `.next` klasörünü silip tekrar dene: `rm -rf .next && npm run dev` (Windows: `rmdir /s /q .next`).

### `npm install` sırasında `peer dependency` uyarıları
Zararsızdır (ESLint araç zincirinden), yok sayabilirsin. `npm audit` "high severity" gösterebilir — bunlar da yalnızca lint/build araçlarının (devDependency) transitive bağımlılıklarında, üretim koduna dahil olmaz.

### `npm run lint` "Cannot find module .../eslint-config-next/..." hatası veriyor
`package.json`'daki `eslint-config-next` sürümünün, kurulu `next` sürümüyle **birebir aynı major.minor.patch** olduğundan emin ol (`npm ls next eslint-config-next`). Uyuşmuyorsa `npm install` yeniden çalıştır.

### Port 3000 zaten kullanımda
Next.js otomatik olarak 3001'e geçer ("Port 3000 is in use... using available port 3001"). Ya o portu kullan ya da `netstat -ano | findstr :3000` (Windows) ile süreci bulup kapat.

### Giriş yapamıyorum / "Auth session missing" gibi bir hata görüyorum
`.env.local`'daki Supabase bilgilerinin **gerçek ve doğru** olduğundan emin ol; ayrıca migration'ların (`supabase db push`) gerçekten o projeye uygulanmış olması gerekir (`doctors` tablosu Supabase Dashboard → Table Editor'da görünmeli).

### Windows'a özgü notlar
- Komutları PowerShell veya Git Bash'te çalıştır (cmd.exe'de bazı `rm -rf` gibi Unix komutları çalışmaz — Windows karşılığı `rmdir /s /q` ve `del`'dir).
- Uzun dosya yolu hataları alırsan, projeyi `C:\` köküne yakın kısa bir yola klonla (örn. `C:\dev\hekim-pusula`).
- `supabase` CLI'yi global kurmak yerine `npx supabase ...` kullanmak Windows'ta genelde daha az sorun çıkarır.

## Daha fazla bilgi

- `README.md` — proje genel bakışı ve tamamlanan sprintler
- `docs/ARCHITECTURE.md` — mimari kararlar
- `docs/DATABASE.md` — tam veritabanı şeması
- `docs/BUGFIX_LOCAL_STARTUP.md` — bu depronun geçmişte yaşadığı başlatma sorunlarının teşhis/düzeltme kaydı
