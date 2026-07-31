# Bugfix — Yerel `npm run dev` başlatma hatası

## Belirti

Temiz bir makinede (`.env.local` henüz oluşturulmadan) `npm install` ve
`npm run dev` çalıştırıldığında, `localhost:3000` üzerindeki **hiçbir sayfa
açılmıyordu** — login sayfası dahil, hepsi 500 hatası veriyordu.

## Teşhis yöntemi

Varsayımda bulunmadan, gerçek bir taze kurulumu bizzat simüle ettim:

```bash
git clone <repo> fresh-test   # node_modules/.env.local olmadan gerçek bir klon
cd fresh-test
npm install                  # ✓ sorunsuz
npm run dev                  # sunucu başlıyor ("Ready")
curl http://localhost:3000/      # -> 500
curl http://localhost:3000/login # -> 500
```

Sunucu logunda hatanın kaynağı net görüldü.

## Kök sebep (3 kademeli)

1. **`src/middleware.ts` → `updateSession()`**, HER istekte çalışıyor (matcher
   tüm sayfaları kapsıyor) ve `getEnv()`'i çağırıyordu — bu fonksiyon,
   `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` tanımlı değilse **senkron olarak
   fırlatıyordu**. Middleware'de fırlatılan bir hata, o isteğin sayfaya hiç
   ulaşmasını engelliyor — bu yüzden login sayfası bile açılamıyordu.
2. **Kök `layout.tsx`'teki `SiteHeader`**, her sayfada (giriş/kayıt linkleri
   mi yoksa profil mi gösterileceğine karar vermek için) `getAuthUserId()`
   çağırıyor, o da `createClient()` → `getEnv()` üzerinden aynı şekilde
   fırlatıyordu. Middleware düzeltilse bile, bu ikinci katman TÜM sayfaları
   (kök layout paylaşıldığı için) çökertmeye devam ederdi.
3. **`createClient()`'ın kendisi** (`lib/supabase/server.ts` ve `client.ts`),
   `getEnv()`'i doğrudan çağırıyordu — bu da onu kullanan HER sayfayı (ana
   sayfa, arama, sıralamalar, kariyer eşleştirme, profil, karşılaştırma...)
   render anında çökertiyordu.

Ayrıca kök seviyede genel bir `error.tsx`/`global-error.tsx` da yoktu —
yakalanmamış bir hata olduğunda Next.js'in kendi ham hata ekranına düşülüyordu.

## Düzeltme

1. **`lib/env.ts`**: `isEnvConfigured()` (fırlatmayan kontrol) ve
   `getEnvOrPlaceholder()` (yapılandırma eksikse zararsız bir placeholder
   döner, `getEnv()`'in aksine ASLA fırlatmaz) eklendi.
2. **`lib/supabase/server.ts` ve `client.ts`**: `getEnv()` yerine
   `getEnvOrPlaceholder()` kullanıyor — `createClient()` artık asla fırlatmaz.
   Bunun güvenli olduğu, Supabase JS SDK'sının ulaşılamaz bir URL'ye karşı
   `.auth.getUser()`/`.from().select()`/`.rpc()` çağrılarının FIRLATMADAN
   `{data: null, error}` döndürdüğü doğrudan test edilerek doğrulandı
   (küçük bir Node scripti ile, bkz. commit geçmişi).
3. **`lib/supabase/middleware.ts`**: yapılandırma eksikse isteği olduğu gibi
   geçirip sunucu konsoluna tek seferlik net bir uyarı basıyor, artık
   fırlatmıyor.
4. **`lib/auth.ts`**: `getAuthUserId`/`getCurrentDoctor`, yapılandırma
   eksikse "giriş yapılmamış" (`null`) kabul ediyor.
5. **`src/app/error.tsx`, `src/app/global-error.tsx`** (yeni): kök seviyede
   genel bir güvenlik ağı — var olan `search`/`hospital/[id]`/`clinic/[id]`
   sayfalarındaki aynı desenle tutarlı.
6. **`lib/safe-query.ts`** (yeni) + ana sayfa, `/rankings`, `/rankings/[branch]`,
   `/career-match`: Supabase sorguları artık bu yardımcıyla sarılı — erişilemezse
   sayfa çökmek yerine var olan boş durumlarını ("henüz veri yok") gösteriyor.

## Doğrulama

Gerçek bir taze klonda, **`.env.local` hiç oluşturulmadan**:

| Kontrol | Sonuç |
|---|---|
| `npm install` | ✓ |
| `npm run dev` | ✓ (sunucu başlıyor) |
| `GET /` | ✓ 200 |
| `GET /login` | ✓ 200 (gerçek form içeriği) |
| `GET /register` | ✓ 200 |
| `GET /search` | ✓ 200 |
| `GET /rankings` | ✓ 200 |
| `GET /career-match` | ✓ 200 |
| `GET /rankings/Kardiyoloji` | ✓ 404 (veri yok — çökme değil, temiz "bulunamadı") |
| `npm run build` | ✓ exit code 0 |
| `npm start` (production) | ✓ `/` ve `/login` 200 |

`hospital/[id]`, `clinic/[id]`, `/profile` (gerçek kullanıcı gerektirir),
`/compare` (gerçek klinik ID'leri gerektirir) gibi belirli bir gerçek veri
kaydına bağlı sayfalar, Supabase yapılandırılmadan doğaları gereği anlamlı
içerik gösteremez — bunlar için var olan `error.tsx` sınırları (Sprint 3'ten)
zaten devrede. Bu, bir hata değil; veri odaklı bir uygulamanın veri kaynağı
olmadan beklenen davranışı.

## Kapsam notu

Bu tur **hiçbir yeni özellik eklemedi, hiçbir sayfa yeniden tasarlanmadı** —
yalnızca var olan sayfaların Supabase yapılandırılmamışken çökmeden
render edilmesini sağlayan, saf bir dayanıklılık/bugfix turuydu.

---

## İkinci geçiş — `eslint-config-next` sürüm uyuşmazlığı

Bir sonraki teşhis turunda (aynı "neden başlamıyor" sorusuyla) ikinci,
bağımsız bir gerçek hata daha bulundu:

**Belirti:** `package.json`'da `"next": "^15.5.22"` ama
`"eslint-config-next": "16.2.12"` — bir **major sürüm uyuşmazlığı**.
`npm run lint` (`next lint`) şu hatayı veriyordu:

```
Cannot find module '.../eslint-config-next/core-web-vitals' imported from eslint.config.mjs
```

**Kök sebep:** `eslint-config-next`'in 16.x sürümü flat-config (dizi)
formatında dışa aktarım yapıyor; ama Next.js sürümüyle (15.5.22) eşleşen
gerçek `eslint-config-next@15.5.22`, hâlâ eski eslintrc (obje + `extends`)
formatını kullanıyor. `eslint.config.mjs`, 16.x'in flat-config dizisini
doğrudan spread eden bir sözdizimiyle yazılmıştı — sürüm düzeltilince bu
sözdizimi artık kurulu paketle uyuşmuyordu.

**Düzeltme:**
1. `package.json`: `eslint-config-next` → `"15.5.22"` (kurulu `next` ile birebir eşleşen sürüm)
2. `eslint.config.mjs`: Next.js 15.x projelerinin resmi/varsayılan
   `create-next-app` şablonundaki desene geçirildi — `@eslint/eslintrc`'in
   `FlatCompat` köprüsüyle `compat.extends("next/core-web-vitals", "next/typescript")`

**Doğrulama (taze bir `git clone` + `npm install`'dan):**

| Kontrol | Sonuç |
|---|---|
| `npm install` | ✓ exit 0 |
| `npm run lint` | ✓ "No ESLint warnings or errors" |
| `npm run build` | ✓ exit 0 |
| `npm run dev` + `.env.local` **hiç yokken** | ✓ `/`, `/login`, `/register`, `/search`, `/rankings`, `/career-match` hepsi 200 |
| `npm run dev` + **gerçekçi ama geçersiz** Supabase URL/anon key ile | ✓ aynı sayfalar hâlâ 200 (bağlantı hatası zarifçe ele alınıyor) |

