# Hekim Pusula — Mimari

## Katmanlar

```
Sayfa (Server Component)
   ↓ kullanır
Repository (HospitalRepository, ClinicRepository)
   ↓ sorgu yapar
Supabase Client (createClient — server veya browser)
   ↓ üzerinden konuşur
Supabase Postgres (RLS ile korumalı)
```

Her katmanın tek bir sorumluluğu var:

- **Sayfalar** (`src/app/**/page.tsx`): veriyi nasıl çekeceğini bilmez, yalnızca repository'yi çağırıp sonucu render eder.
- **Repository'ler** (`src/lib/repositories/`): Supabase sorgusunu yazar, hata yönetimini yapar, DB satırını (`snake_case`) domain tipine (`camelCase`) çevirir. Bir sayfa asla doğrudan `supabase.from(...)` çağırmaz.
- **Supabase client'lar** (`src/lib/supabase/`): bağlantının kendisi. `server.ts` (Server Component/Route Handler için, cookie tabanlı) ve `client.ts` (Client Component için) ayrı, çünkü Next.js App Router'da ikisinin de farklı cookie/oturum erişimi var.
- **Veritabanı** (`supabase/migrations/`): tek gerçek kaynak (source of truth). Şema değişikliği önce migration olarak yazılır, sonra tipler (`src/types/database.ts`) elle (ileride `supabase gen types` ile otomatik) güncellenir.

## Neden repository katmanı?

Alternatifi, her sayfanın kendi içinde `supabase.from("hospitals").select(...)` yazması olurdu. Bunun yerine repository kullanmamızın somut sebepleri:

1. **Tek yerden değişiklik.** Sorgu mantığı (örn. arama için hangi sütunlarda `ILIKE` yapılacağı) değişirse tek dosya güncellenir, sayfalar etkilenmez.
2. **DB şekli sızmaz.** Sayfa kodu `hospital.hospitalType` görür, `hospital.hospital_type` değil — DB'nin `snake_case` kuralı uygulama koduna karışmaz.
3. **Test edilebilirlik.** İleride birim testi yazılacaksa, sahte (mock) bir `SupabaseClient` ile repository test edilebilir; sayfa bileşenini render etmeye gerek kalmaz.

## Neden `snake_case` (DB) / `camelCase` (uygulama) ayrımı?

`src/types/database.ts`, gerçek bir Supabase projesine bağlanınca `supabase gen types typescript --linked` komutunun üreteceği dosyanın elle yazılmış bir dengidir — bu komut sütun adlarını olduğu gibi (`snake_case`) verir. Bunu uygulama genelinde kullanmak yerine, repository'ler bu satırları `src/types/index.ts` içindeki temiz domain tiplerine (`camelCase`) eşler. Böylece:

- DB şeması ile üretilen tipler arasında asla sapma (drift) olmaz (tek komutla yeniden üretilebilir).
- Uygulama kodu, TypeScript/React ekosisteminin `camelCase` konvansiyonunu takip eder.

## Neden `doctors.id`, `auth.users.id`'yi referans alıyor (auth henüz yokken)?

Bu, kimlik doğrulamayı *implemente etmiyor* — yalnızca birincil anahtar tasarımını şimdiden doğru kuruyor. Supabase projelerinde `auth.users` şeması varsayılan olarak zaten mevcuttur. Sprint 3'te gerçek kayıt/giriş akışı eklendiğinde, `doctors` tablosunun birincil anahtarını değiştirip mevcut veriyi taşımak gerekmeyecek — bu, sık karşılaşılan ve maliyetli bir sonradan-düzeltme senaryosunu baştan engeller.

## Neden bazı yabancı anahtarlar `CASCADE`, bazıları `RESTRICT`?

Kural basit: **sahiplik ilişkisi → CASCADE, referans/master veri → RESTRICT.**

- `hospitals → clinics`: bir klinik, hastanesi olmadan anlamsızdır (sahiplik) → CASCADE.
- `doctors → doctor_workplaces`, `doctors → favorites`: bir hekimin kendi verisi, hesabı silinince gitmeli (sahiplik) → CASCADE.
- `clinics → doctor_workplaces`, `clinics → reviews`: klinikler referans veridir; üzerinde geçmiş veri varken sessizce silinmemeli → RESTRICT.
- `reviews → reports`: doctor_id `SET NULL` — moderasyon kaydı, bildiren kişi silinse bile korunmalı.

Pratik sonucu: bir hastaneyi silmeye çalışmak, ancak klinikleri üzerinde hiç çalışma geçmişi/değerlendirme yoksa başarılı olur — aksi halde `RESTRICT` zincire yayılıp işlemi bir bütün olarak engeller. Bu, kazara toplu veri kaybına karşı kasıtlı bir güvenlik ağıdır.

## Test yaklaşımı (bu sprint için)

Bu sandbox'ta canlı bir Supabase projesi olmadığı için doğrulama iki ayrı seviyede yapıldı:

1. **SQL/şema doğruluğu:** migration'lar, gerçek bir yerel PostgreSQL 16'ya (bu sprint için geçici olarak kurulan) sırayla uygulandı; seed data çalıştırıldı; iş kuralları (yanlış `clinic_id`, mükerrer aktif çalışma kaydı, aralık dışı puan, tutarsız `is_current`) kasıtlı olarak ihlal edilmeye çalışılıp doğru şekilde reddedildiği doğrulandı; RLS, süper kullanıcı olmayan bir rolle test edildi.
2. **Uygulama kodu doğruluğu:** `tsc --noEmit`, `next lint`, `npm run build` — hepsi hatasız.

**Yapılamayan:** gerçek bir Supabase projesine karşı uçtan uca (arama sayfası → repository → gerçek Supabase API) canlı test. Bunun için gerçek `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` değerleriyle `npm run dev` çalıştırılması ve migration'ların gerçek projeye uygulanması (`supabase link && supabase db push`) gerekiyor — bu, deploy öncesi ekip tarafından yapılmalı.
