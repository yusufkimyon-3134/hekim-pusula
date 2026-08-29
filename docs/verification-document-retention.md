# Hekim doğrulama belgesi — otomatik silme

Diploma veya uzmanlık belgesi yalnızca başvuru `pending` durumundayken
inceleme amacıyla özel Storage bucket'ında tutulur.

## Canlı akış

1. Yönetici Supabase Dashboard'da başvuruyu `approved` veya `rejected`
   yapar.
2. `apply_doctor_verification_decision` belgeyi aynı anda silinmeye hazır
   olarak işaretler.
3. Veritabanı trigger'ı `cleanup-verification-documents` Edge Function'ını
   asenkron çağırır.
4. Edge Function dosyayı Storage API ile siler; başarılı olunca
   `document_path = NULL` ve `document_deleted_at = now()` yazar.
5. Geçici webhook/ağ hatalarına karşı aynı fonksiyon her dakika cron ile
   tekrar çağrılır.

Karar satırı silinmez. Yalnızca başvuru sahibi, belge türü, karar ve işlem
tarihleri gibi asgari denetim kaydı kalır.

## Güvenlik

- Bucket private'dır ve kullanıcı yalnızca kendi klasörüne erişebilir.
- Edge Function Supabase JWT kontrolünü zorunlu tutar.
- İkinci katman olarak `x-cleanup-secret` başlığının SHA-256 özeti
  doğrulanır.
- Webhook sırrı ve çağrı anahtarı yalnızca Supabase Vault'ta tutulur;
  migration veya Git geçmişine yazılmaz.
- Fonksiyon yalnızca kararı verilmiş ve silme zamanı gelmiş belgeleri seçer;
  çağıran kişi dosya yolu veya başvuru kimliği belirleyemez.

## Yeni bir Supabase projesine kurulum

Yeni ortamda rastgele en az 32 baytlık bir webhook sırrı üret. Sırrı
`verification_cleanup_webhook_secret`, etkin legacy anon JWT'yi ise
`verification_cleanup_anon_key` adıyla Vault'a kaydet. Edge Function
dosyasındaki `EXPECTED_SECRET_SHA256` değerini üretilen sırrın SHA-256
özetiyle değiştirip fonksiyonu `verify_jwt=true` olarak deploy et. Ardından
`20260829170000_delete_verification_documents_on_decision.sql` migration'ını
uygula.

Sırlar eksikse karar işlemi engellenmez fakat Postgres uyarı logu üretir;
kurulum bu durumda tamamlanmış kabul edilmemelidir.

## Kontrol sorguları

```sql
select status, document_path, document_deleted_at
from public.doctor_verification_requests
order by created_at desc;

select jobname, schedule, active
from cron.job
where jobname = 'cleanup-verification-documents-every-minute';
```

Canlı doğrulamada karar verilmiş bir kaydın `document_path` alanı en geç bir
dakika içinde `NULL`, `document_deleted_at` alanı dolu olmalıdır.
