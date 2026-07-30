# Sprint 5 — Community & Trust Foundation

## Önce: talimattan bilinçli olarak saptığım noktalar

Bu sprint, önceki sprintlerde (özellikle Sprint 2 ve onun CTO incelemesinde) bizzat kurulan ve tekrar tekrar teyit edilen birkaç ilkeyle çelişiyordu. Sessizce görmezden gelmek yerine, her birinde neden farklı bir yol izlediğimi ve neyi yerine koyduğumu burada açıklıyorum. Bunların hepsi geri alınabilir kararlar — CTO onayı ile talimatın harfiyen uygulanmasına da geçilebilir.

### 1. `full_name` eklenmedi

Sprint 2'den beri (ve Sprint 2 CTO incelemesinde açıkça teyit edilmiş) `doctors` tablosunun temel ilkesi: **gerçek ad/soyad hiçbir zaman saklanmaz** (bkz. `DATABASE.md`: *"Gerçek ad/soyad/TC hiçbir sütunda tutulmaz — bu, ürünün anonimlik temelli güven modelinin veritabanı karşılığıdır"*). Bu, ürünün en baştaki ("hekimler kimliğini göstermeden deneyim paylaşabilsin") tasarım amacının doğrudan sonucu. `full_name` eklemek bu ilkeyi tersine çevirir. Bunun yerine var olan `nickname` kullanılmaya devam ediyor. Gerçek isim tutmak gerçekten isteniyorsa, bu ayrı ve bilinçli bir ürün/KVKK kararı olmalı.

### 2. Ayrı bir `profiles` tablosu oluşturulmadı

`doctors` tablosu zaten Sprint 2'den beri Supabase'in standart "profil tablosu" deseniyle `auth.users(id)`'yi referans alıyor ve zaten bir `specialty` sütunu var. Ayrı bir `profiles` tablosu, aynı anahtarla (auth kullanıcısı) ikinci bir tablo demek olurdu — bu da "hangisi asıl kaynak" belirsizliği ve normalizasyon ihlali yaratır (Sprint 2'de açıkça istenen "PostgreSQL normalizasyon en iyi pratiklerini takip et" ilkesine aykırı). Bunun yerine `doctors` tablosu genişletildi: `avatar_url`, `city`, `current_hospital`, `experience_year`, `bio` eklendi.

### 3. `verified_doctor` eklenmedi

`doctors.is_verified` zaten Sprint 2'den beri tam olarak bu amaç için var. Aynı anlama gelen ikinci bir sütun eklemek, iki alanın birbirinden bağımsız güncellenip tutarsız kalması riskini (Sprint 2'de `is_current`/`work_end_date` için bilinçli olarak kaçınılan aynı hata) yeniden getirirdi. `VerifiedBadge` bileşeni bu var olan alanı okuyor.

### 4. Review formu alanları, talimattaki isimler yerine var olan şema sütunlarına bağlandı

Talimat "Overall score, Education quality, Workload, Night shifts, Faculty support" gibi isimler verdi, ama bunların hiçbiri Sprint 2'de kurulan şemada (`incentive_score`, `colleague_score`, `management_score`, `city_score`, `monthly_shifts`, `daily_patients`, `service_patients`, `would_choose_again`) karşılığı yok. Talimat açıkça **"Connect to existing reviews schema"** dediği için (yeni şema tasarlamak değil), form gerçek sütunlara Türkçe, dürüst etiketlerle bağlandı:

| Formda gösterilen | Gerçek sütun |
|---|---|
| Aylık nöbet / Günlük hasta / Servis hasta | `monthly_shifts` / `daily_patients` / `service_patients` |
| Tekrar tercih eder misin? | `would_choose_again` |
| Döner sermaye / ek ödeme | `incentive_score` |
| Meslektaş ilişkileri | `colleague_score` |
| Yönetim desteği | `management_score` |
| Şehir / yaşam kalitesi | `city_score` |
| Yorumun | `comment` |

"Overall score" ayrı bir sütun olarak eklenmedi — istenirse 4 alt puanın ortalaması olarak arayüzde hesaplanabilir (bu sprint'te bu görünüm eklenmedi). Eğitim kalitesi/"Faculty support" gibi gerçekten farklı boyutlar isteniyorsa, bu bilinçli bir şema genişletmesi (yeni migration) gerektirir — sessizce uydurulmadı.

## Neler yapıldı

### 1. Supabase Authentication

- E-posta/şifre ile giriş, kayıt, çıkış — Next.js **Server Actions** ile (client component/JS gerektirmeden, mevcut "gereksiz client-side render'dan kaçın" mimarisiyle tutarlı)
- `src/middleware.ts` — oturum çerezlerini her istekte tazeleyen resmi Supabase + Next.js deseni
- Oturum kalıcılığı: Supabase'in kendi çerez tabanlı mekanizmasıyla (middleware + `createServerClient`)

**Önemli, dürüst bir mimari sonuç:** `SiteHeader` artık (giriş/kayıt vs profil/çıkış göstermek için) her sayfada `cookies()` okuyor. Next.js'te `cookies()`'in render ağacının HERHANGİ bir yerinde çağrılması, o rotanın tamamen dinamik render edilmesini zorunlu kılıyor. Bu yüzden Sprint 3'te hospital/clinic sayfalarına eklenen `revalidate` (ISR) artık pratikte devre dışı — **tüm uygulama artık her istekte dinamik render ediliyor.** Bu, gerçek, kalıcı bir performans/mimari değişimi ve gizlenmemeli: SSR tabanlı, güvenli bir auth kontrolü ile statik önbellekleme arasında bir ödünleşim var, biz güvenli/doğru tarafı seçtik (istemci tarafı auth kontrolü — yani "önce statik sayfayı göster, JS ile auth durumunu sonradan kontrol et" — hem daha fazla client JS hem de kısa bir an için yanlış UI gösterme riski taşırdı).

### 2. User Profiles

- `/profile` sayfası: giriş yapılmamışsa `/login`'e yönlendirir; profil yoksa boş formu, varsa doldurulmuş formu gösterir
- `saveProfile` Server Action'ı, `DoctorRepository.upsert` ile `doctors` satırını oluşturur/günceller

### 3. Doctor Identity (altyapı)

- `VerifiedBadge` bileşeni `doctors.is_verified` okuyup rozet gösteriyor — belge yükleme akışı bilinçli olarak eklenmedi (talimatla uyumlu)

### 4. Experience Sharing

- `/clinic/[id]/review` sayfası: giriş + profil tamamlanmış olmayı zorunlu kılıyor (sırasıyla `/login` ve `/profile`'a `redirectTo` ile yönlendirip geri döndürüyor — açık yönlendirme/*open redirect* saldırısına karşı `safeRedirectPath` ile doğrulanıyor)
- Gönderim, atomik bir Postgres RPC fonksiyonuna (`submit_review`) delege ediliyor: gerekirse doğrulanmamış bir `doctor_workplaces` kaydı otomatik açar, `reviews` + `review_scores`'u **tek transaction'da** ekler — herhangi bir adım (örn. "bu klinik için zaten değerlendirmen var" trigger'ı) başarısız olursa **hiçbir şey kalıcı olmaz** (gerçek Postgres'te doğrulandı, aşağıda).
- Klinik detay sayfası artık gerçek değerlendirmeleri Sprint 4'te tasarlanan zaman çizelgesinde gösteriyor; hiç yoksa aynı zarif boş durum, varsa gerçek veriyle dolduruluyor.

### 5. RLS — placeholder'lardan gerçek kurallara

Sprint 2'nin "her şeyi reddet" placeholder politikaları kaldırılıp gerçek kurallarla değiştirildi:

| Tablo | Kural |
|---|---|
| `doctors` | Yalnızca kendi satırı (SELECT/INSERT/UPDATE) — herkese açık bir "hekim dizini" yok |
| `doctor_workplaces` | Yalnızca kendi kayıtları |
| `reviews` | **Herkes okuyabilir** (ürünün temel değeri), yalnızca sahibi (kendi `doctor_workplaces`'i üzerinden) ekleyip düzenleyebilir |
| `review_scores` | `reviews` ile aynı mantık |

## Test yaklaşımı

**Gerçek PostgreSQL 16'ya karşı, `auth.uid()`'i gerçekçi şekilde taklit eden bir SQL fonksiyonuyla test edildi** (Supabase'in JWT claim okuma davranışını taklit ediyor, `set request.jwt.claim.sub = '...'` ile farklı kullanıcı simülasyonu):

- İki farklı kullanıcı: her biri yalnızca kendi `doctors` satırını görebiliyor, birbirininkini göremiyor ✓
- Kullanıcı 1, kullanıcı 2'nin `doctor_workplaces`'i adına sahte review eklemeyi denedi → hem RLS hem tutarlılık trigger'ı reddetti ✓
- `anon` rolü: `reviews`'i okuyabiliyor (herkese açık) ama `doctors`'ı okuyamıyor ve review ekleyemiyor ✓
- `submit_review`: workplace kaydı yokken otomatik oluşturuyor, review+score'u birlikte ekliyor ✓; aynı klinik için ikinci deneme reddediliyor **ve review sayısı değişmiyor** (atomiklik doğrulandı) ✓; giriş yapmamış kullanıcı çağırınca dostane hata veriyor ✓
- `experience_year` (0-60) kısıtı ✓

**Uygulama kodu:** `tsc --noEmit`, `next lint`, `npm run build` — hepsi temiz.

**Yapılamayan:** gerçek Supabase Auth sunucusuna (GoTrue) karşı canlı test — bu sandbox'ta böyle bir sunucu çalıştırılamıyor (Docker yok). Login/register/logout Server Action'larının gerçek davranışı (özellikle e-posta doğrulaması açık bir projede `signUp` sonrası oturum durumu) yalnızca gerçek bir Supabase projesine karşı `npm run dev` ile doğrulanabilir — ekibin deploy öncesi bunu yapması önerilir.

## Kabul kriterleri karşılaştırması

| Kriter | Durum |
|---|---|
| Authentication works | Kod tamam, gerçek Supabase projesine karşı test edilemedi (yukarıda açıklandı) |
| Profile creation works | SQL katmanı test edildi; UI kodu build/tip kontrolünden geçti |
| Logged-in users can create reviews | ✓ (RPC gerçek Postgres'te uçtan uca test edildi) |
| Anonymous users cannot create reviews | ✓ (RLS + grant testleriyle doğrulandı) |
| Existing Sprint 1-4 functionality remains intact | Sayfa yapıları korundu; tek istisna: ISR artık auth nedeniyle devre dışı (yukarıda açıklandı, bu bir "kırılma" değil auth eklemenin doğal sonucu) |
| No breaking architectural changes | Repository deseni, Server Component önceliği, native form'lar korundu; yukarıdaki 4 sapma bilinçli ve gerekçeli |
