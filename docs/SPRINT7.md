# Sprint 7 — Trust, Moderation & Reputation System

## İki gerilim, netçe çözüldü

### 1. "İtibarı review kartlarında göster" vs. anonimlik ilkesi

Ürünün en başından beri temel ilke: hiçbir yerde hekim kimliği/nickname'i başkalarına gösterilmez, herkese açık bir "hekim dizini" yok. "Reputation'ı review kartlarında göster" isteği bununla gerilim halinde — bir reputation sistemi genelde kalıcı bir kimlikle (nickname, profil linki) birlikte gelir.

**Çözüm:** Review kartında SAYISAL itibar (kaç katkı, kaç faydalı oy, "Aktif katkıcı" gibi bir seviye) gösteriliyor, ama bu **asla bir doctor_id veya nickname ile birlikte değil**. Bunu SQL seviyesinde zorladım: `review_author_stats` view'ı yalnızca `review_id` + sayılar döndürür, `doctor_id` sütunu hiçbir zaman çıktıda yok — gerçek Postgres'te bunu doğrudan doğruladım (`select * from review_author_stats` çıktısında doctor_id kolonu yok). Bu, bir okuyucunun "bu iki review'ı aynı kişi yazmış" diye kesin olarak tespit etmesini imkansız kılıyor.

**Kabul edilen küçük bir ödünleşim:** Aynı review'ın tam olarak aynı sayıları (örn. "12 yorum, 8 faydalı oy") tekrar göstermesi, teorik olarak zayıf bir olasılıksal ipucu olabilir. Bu, herhangi bir itibar gösterim sisteminin doğasında olan kabul edilebilir bir ödünleşim — asıl önemli olan (nickname/doctor_id gibi kesin, kalıcı bir kimlik asla sızdırılmıyor) korundu.

### 2. "Yalnızca onaylı review'lar görünsün" vs. moderatör paneli yok

Eğer yeni review'lar varsayılan `pending` olsaydı ve onaylayacak bir moderatör aracı olmasaydı, Sprint 5-6'da inşa edilen TÜM herkese açık özellikler (arama, istatistik, sıralama, karşılaştırma) fiilen işlevsiz kalırdı.

**Çözüm:** Review'lar varsayılan `approved` ile gönderiliyor (kimlik doğrulama + profil tamamlama zaten bir güven eşiği). Ama bir review **3 farklı hekimden bekleyen rapor** aldığında, bir trigger onu otomatik olarak `pending`'e çekiyor (insan moderatörünü beklemeden). Böylece "moderasyon altyapısı" gerçekten bir şey yapıyor — ileride bir moderatör paneli geldiğinde, o panel `pending` durumundaki review'ları inceleyip `approved`/`rejected` olarak sonuçlandıracak.

## Diğer tasarım kararları

- **`verified_doctor`, `review_count`, `reputation_score` yine `doctors` tablosuna sütun olarak eklenmedi** — bunlar türetilmiş veridir, Sprint 6'daki `clinic_review_stats` deseniyle tutarlı olarak view'larda hesaplanıyor (`doctor_reputation`, `get_my_reputation()`). Stoklanmış sayaçlar senkron dışı kalma riski taşır.
- **`reputation_score` formülü:** `onaylı yorum sayısı × 10 + alınan faydalı oy × 3` — basit, belgelenmiş, gerekirse kolayca ayarlanabilir.

## Gerçek Postgres'te bulunan ve düzeltilen 2 gerçek hata

1. **Otomatik gizleme trigger'ı RLS'e takılıyordu:** Raporlayan kullanıcı, raporladığı review'ın sahibi olmadığı için kendi RLS'i altında o review'ı güncelleyemiyordu — trigger `SECURITY DEFINER` olmadan sessizce başarısız oluyordu. Bunu 3 farklı hekimle gerçek bir senaryo test ederken yakaladım (durum `approved` kalmaya devam ediyordu). `security definer` eklenerek düzeltildi ve yeniden test edildi.
2. **`anon`'un `doctor_workplaces` üzerinde tablo düzeyinde grant'i yoktu:** `reviews_public_read` RLS politikası, "kendi review'un mu" kontrolü için `doctor_workplaces`'e bir alt sorgu yapıyor — bu, sorgulayan rolün o tabloda en azından bare bir `SELECT` grant'ine ihtiyaç duyar (RLS ayrıca satırları filtreler). `anon`'a bu grant hiç verilmemişti, bu yüzden `anon` normal bir review listesi sorgusu yaparken "permission denied" hatası alıyordu. Grant eklenerek düzeltildi — RLS zaten `auth.uid() = doctor_id` olduğundan `anon` (auth.uid() null) hiçbir satır göremiyor, yalnızca izin hatası ortadan kalktı.

## Yapılanlar

1. **İtibar sistemi:** `doctor_reputation` (dahili view), `get_my_reputation()` (SECURITY DEFINER, `auth.uid()`'e sabit), `review_author_stats` (herkese açık, doctor_id yok). `<ReputationBadge />` yeniden kullanılabilir bileşeni — profil sayfası ve review kartlarında.
2. **Faydalı oy:** `review_helpful_votes` (bileşik PK, tek oy zorunluluğu), RLS ile "kimin oy verdiği" gizli ama `review_helpful_counts` view'ı (owner-bypass) ile toplam herkese açık.
3. **Raporlama:** `reports` artık gerçekten aktif (Sprint 2'den beri placeholder'dı). 5 sabit sebep (`report_reason` enum). `<ReportForm />` — `<details>` ile JS'siz.
4. **Düzenleme/silme:** `update_review` RPC (atomik, sahiplik kontrolü), `reviews.updated_at` üzerinden "Düzenlendi" göstergesi (yeni sütun gerekmedi). `ReviewFormFields` ortak bileşeni yeni+düzenleme sayfaları arasında paylaşılıyor (kod tekrarı önlendi).
5. **Tekillik koruması:** Zaten var olan `enforce_review_consistency` trigger'ı (Sprint 2) korunuyor; kullanıcı deneyimi olarak, ikinci kez değerlendirme denemesi artık hata göstermek yerine **doğrudan düzenleme sayfasına yönlendiriyor**.
6. **Moderasyon:** `reviews.status` (pending/approved/rejected), `reviews_public_read` RLS güncellendi (approved OR kendi review'un).
7. **İstatistikler:** `clinic_review_stats` artık yalnızca `approved` review'ları sayıyor + `total_helpful_votes` eklendi.

## Test yaklaşımı

Gerçek PostgreSQL 16'ya karşı, 4 farklı hekim simülasyonuyla uçtan uca test edildi: itibar hesaplama, faydalı oy (tekillik + gizlilik + herkese açık toplam), review düzenleme (sahiplik kontrolü), rapor + otomatik gizleme (2 raporda değişmiyor, 3'te `pending`'e dönüyor, yazarı hâlâ görüyor, başkaları göremiyor). 18 migration dosyasının tamamı sıfır veritabanında baştan sona doğrulandı. `tsc`/`lint`/`build` temiz.

**Yapılamayan:** gerçek Supabase Auth/PostgREST'e karşı canlı test (bu sandbox'ta yok).
