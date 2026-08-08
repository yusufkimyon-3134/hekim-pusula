# Hekim Doğrulama Belgesi — Saklama ve Otomatik Silme Kurulumu

Bu belge, `cleanup-verification-documents` Edge Function'ının **günde bir
kez, gerçekten çalışacak şekilde otomatik olması** için gereken kurulumu
adım adım anlatır.

> ⚠️ **Hiçbir API anahtarı, service_role anahtarı veya sır bu dosyaya,
> herhangi bir migration dosyasına ya da Git'e YAZILMAMALIDIR.** Aşağıdaki
> her adımda gizli değerler yalnızca Supabase CLI komutlarıyla veya
> Dashboard üzerinden, doğrudan Supabase'in kendi güvenli
> depolamasına (Vault / Function Secrets) girilir.

> ⚠️ **Global ayar değişikliği yok.** Bu kurulumun hiçbir adımı
> `ALTER DATABASE ... SET ...` gibi projeni genel olarak etkileyen bir
> ayar değiştirmez — yalnızca bu tek fonksiyona özel bir secret, bu tek
> tabloya özel bir cron job ve Vault'a özel iki sır eklenir.

## Ön koşul: bu kurulum tamamlanana kadar

`docs/DATABASE.md` ve KVKK sayfasındaki metin şu an **"silinmesi
hedeflenir"** gibi temkinli bir ifade kullanıyor — çünkü bu adımlar
tamamlanıp cron gerçekten çalışmaya başlayana kadar silme işlemi
**otomatik değil**. Kurulumu tamamladıktan sonra, KVKK sayfasındaki
ilgili cümleyi *"karardan sonra en geç 30 gün içinde silinir"* şeklinde
kesinleştirebilirsin (`src/app/kvkk-aydinlatma/page.tsx`, "7. Doğrulama
Belgesinin Silinmesi" bölümü).

## Kimlik doğrulama zinciri — neden İKİ katman var?

Bu kurulumda **iki ayrı, birbirinden bağımsız** kimlik doğrulama katmanı
var, ikisi de gereklidir:

1. **Supabase platform seviyesi (JWT):** Her Edge Function, varsayılan
   olarak, isteğin `Authorization: Bearer <token>` başlığında geçerli
   bir Supabase anahtarı (anon ya da service_role) arar — bu kontrol,
   fonksiyonun **kendi kodu hiç çalışmadan önce**, Supabase'in kendi
   altyapısında yapılır. Cron job'ın bu başlığı **eksik göndermesi**,
   fonksiyonun `x-cron-secret` kontrolüne hiç ulaşmadan `401` almasına
   yol açar — aşağıdaki adım 5'te bu, `service_role` anahtarıyla
   düzeltiliyor.
2. **Uygulama seviyesi (`x-cron-secret`):** Fonksiyonun kendi kodu, JWT
   katmanı geçildikten SONRA, `x-cron-secret` başlığını kendi
   `CLEANUP_CRON_SECRET`'ıyla karşılaştırır. Bu, `service_role`
   anahtarını ele geçiren ama bu ikinci sırrı bilmeyen birine karşı
   ek bir savunma katmanıdır — fonksiyon kodu **her çağrıda** bunu
   zorunlu tutmaya devam eder, hiçbir koşulda atlanmaz.

---

## 1) Edge Function'ı deploy et

```bash
supabase functions deploy cleanup-verification-documents
```

`SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY`, Supabase tarafından HER
Edge Function'a **otomatik olarak** sağlanır — fonksiyonun KENDİ içinde
kullandığı bu değerleri elle tanımlaman gerekmez. (Adım 5'teki
`service_role` anahtarı bundan farklı bir kullanım — cron job'ın
fonksiyonu ÇAĞIRABİLMESİ için, ayrıca Vault'a kaydedilir.)

## 2) Cron doğrulama sırrını tanımla

Fonksiyonun yalnızca senin cron işin tarafından tetiklenebilmesi için
kendi belirleyeceğin, tahmin edilemez bir sır üret (örn. bir şifre
yöneticisiyle rastgele 32+ karakter) ve **yalnızca** Function Secret
olarak tanımla:

```bash
supabase secrets set CLEANUP_CRON_SECRET=<kendi-ürettiğin-uzun-rastgele-değer>
```

Bu değeri bir yere (örn. şifre yöneticine) not al, çünkü adım 4'te
tekrar gireceksin.

## 3) `pg_cron` ve `pg_net` uzantılarını etkinleştir

Supabase Dashboard → **Database** → **Extensions**'a git, şu ikisini ara
ve etkinleştir:

- `pg_cron` (zamanlanmış görevler için)
- `pg_net` (Postgres'ten HTTP isteği atabilmek için — Edge Function'ı
  çağırmak için gerekli)

(Alternatif olarak SQL Editor'dan `create extension if not exists pg_cron;`
ve `create extension if not exists pg_net;` de çalıştırabilirsin —
Supabase projelerinde bu ikisi genelde `extensions` şemasında kuruludur.)

## 4) İki sırrı da Vault'a kaydet

Cron job'ın SQL'i, sırları **düz metin olarak değil**, Supabase Vault
üzerinden okumalı — böylece SQL Editor geçmişinde asla açık görünmezler.

**a) Cron secret** (adım 2'deki aynı değer):

```sql
select vault.create_secret(
  '<adım 2''de ürettiğin aynı değer>',
  'cleanup_verification_cron_secret'
);
```

**b) `service_role` anahtarı** — platform JWT katmanını geçmek için
gerekli (bkz. "Kimlik doğrulama zinciri" bölümü). Bu değeri **Project
Settings → API → Project API keys → `service_role` `secret`**'ten
kopyala:

```sql
select vault.create_secret(
  '<Project Settings → API''den kopyaladığın service_role anahtarı>',
  'cleanup_verification_service_role_key'
);
```

> ⚠️ `service_role` anahtarı, tüm RLS kurallarını aşan, projenin en
> yetkili anahtarıdır. Yalnızca Vault'a (ya da resmi Supabase Function
> Secret deposuna) kaydet — asla düz metin olarak bir yere yapıştırma,
> commit etme, log'lama.

Bu iki komutu da **yalnızca SQL Editor'da, tek seferlik olarak** çalıştır
— bir migration dosyasına EKLEME.

## 5) Günlük cron job'ı kur

SQL Editor'dan (yine bir migration dosyasına eklemeden), projenin kendi
fonksiyon URL'ini kullanarak — hem platform JWT hem uygulama sırrı
başlığı birlikte gönderiliyor:

```sql
select cron.schedule(
  'cleanup-verification-documents-daily',
  '0 3 * * *',  -- bkz. aşağıdaki "Saat dilimi" bölümü
  $$
  select net.http_post(
    url := 'https://<PROJE-REF>.supabase.co/functions/v1/cleanup-verification-documents',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cleanup_verification_service_role_key'
      ),
      'x-cron-secret', (
        select decrypted_secret from vault.decrypted_secrets
        where name = 'cleanup_verification_cron_secret'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);
```

`<PROJE-REF>` yerine kendi Supabase proje referansını (Dashboard URL'inde
görünen kısa kod) yaz.

### ⏰ Saat dilimi — açık

`pg_cron`, Supabase projelerinde **veritabanının kendi saat dilimini**
kullanır; bu, varsayılan olarak **UTC**'dir (aksini elle
değiştirmediysen). Yukarıdaki `'0 3 * * *'` ifadesi:

| Saat dilimi | Karşılığı |
|---|---|
| UTC | **03:00** |
| Türkiye (TRT, UTC+3, sabit — yaz saati uygulaması yok) | **06:00** |

Yani bu cron job, **her gün Türkiye saatiyle sabah 06:00'da** çalışır.
Farklı bir Türkiye-saat-dilimi hedefliyorsan, cron ifadesini buna göre
(UTC'ye çevirerek) ayarla — örn. Türkiye saatiyle gece yarısı (00:00)
çalışmasını istiyorsan `'0 21 * * *'` (bir önceki gün UTC 21:00) yaz.

## 6) Kurulumu elle test et

Cron'a güvenmeden önce, fonksiyonu **elle** bir kez çağırıp doğru
çalıştığını doğrula — bu sefer İKİ başlığı da (JWT + uygulama sırrı)
gönderiyoruz:

```bash
curl -i -X POST \
  "https://<PROJE-REF>.supabase.co/functions/v1/cleanup-verification-documents" \
  -H "Authorization: Bearer <service_role anahtarın>" \
  -H "x-cron-secret: <adım 2''deki değerin>" \
  -H "Content-Type: application/json"
```

Beklenen yanıt: `{"processed":0,"deleted":0,"failed":0,"errors":[]}` gibi
bir JSON (o an silinmeyi bekleyen belge yoksa hepsi 0 olur — bu normal).

**Ayrıca şu iki başarısız senaryoyu da test et** (fonksiyonun gerçekten
korumalı olduğunu doğrulamak için):
- `Authorization` başlığını **hiç göndermeden** çağır → Supabase platform
  seviyesinde reddedilmeli (fonksiyon kodun hiç çalışmamalı).
- `Authorization` doğru ama `x-cron-secret` **yanlış/eksik** gönder →
  `401 Unauthorized` (bizim kendi kontrolümüzden) almalısın.

## 7) Cron job'ı doğrula/izle

```sql
select * from cron.job;               -- job'ın kayıtlı olduğunu gör
select * from cron.job_run_details    -- geçmiş çalıştırmaları gör
  order by start_time desc limit 10;
```

## Belgelerin asla erken silinmediğinden emin ol

- `doctor_verification_requests.document_delete_after`, yalnızca başvuru
  `approved` ya da `rejected` olduğunda set edilir (bkz. migration
  `20260101000025`'teki trigger) — `pending` iken **her zaman NULL**
  kalır.
- Edge Function'ın sorgusu yalnızca `document_delete_after is not null
  and document_delete_after < now()` olan satırları seçer — yani
  `pending` bir başvurunun belgesi bu sorguya **hiçbir zaman girmez**.
- `approved`/`rejected` olan bir başvurunun belgesi, karardan **tam 30
  gün sonrasına kadar** Storage'da kalmaya devam eder; yalnızca o
  tarihten SONRAKİ ilk cron çalıştırmasında silinir.

## Kurulumu geri almak istersen

```sql
select cron.unschedule('cleanup-verification-documents-daily');
select vault.delete_secret((select id from vault.secrets where name = 'cleanup_verification_cron_secret'));
select vault.delete_secret((select id from vault.secrets where name = 'cleanup_verification_service_role_key'));
```

```bash
supabase functions delete cleanup-verification-documents
supabase secrets unset CLEANUP_CRON_SECRET
```
