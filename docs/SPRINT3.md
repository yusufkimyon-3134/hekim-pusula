# Sprint 3 — Hospital & Clinic Discovery

## Kapsam

Bu sprint yalnızca **keşif** (arama, filtreleme, listeleme) üzerineydi. Kimlik doğrulama, hekim doğrulaması, yorum/puanlama, favoriler ve admin paneli kasıtlı olarak kapsam dışı bırakıldı.

## Neler yapıldı

### 1. Ana sayfa
`src/app/page.tsx` — hero bölümü (logo amblemi, başlık, kısa açıklama, büyük arama kutusu) + gerçek veriden gelen "öne çıkan şehirler" (hastane sayısına göre en çok 6 şehir). Responsive: mobilde tek sütun, `sm:` kırılma noktasından itibaren yan yana.

### 2. Global arama
Tek bir arama kutusu, hastane adı + il + ilçe + branş üzerinde **çok kelimeli, akıllı** arama yapıyor: sorgu kelimelere ayrılır, her kelime en az bir alanda eşleşmelidir (kelimeler arası AND, alanlar arası OR). Örnekler gerçek Postgres'te test edildi:
- `"Hastane, il, ilçe veya branş ara"` → tam olarak Konya'daki Göz Hastalıkları kliniğini buluyor
- `"Hatay"` → o ildeki tüm klinikleri/hastaneleri buluyor

**Bilinen sınır:** Arama harfi harfine (`ILIKE`) çalışıyor, eşanlamlı/argo terimleri (örn. "Dahiliye" ↔ resmi ad "İç Hastalıkları") bilmiyor. Bunu çözmek bir "branş eşanlamlıları" tablosu gerektirir — kapsam dışı bırakıldı, `ROADMAP.md`'ye not düşüldü.

### 3. Filtreler
Şehir ve hastane türü filtreleri, arama kutusuyla aynı forma eklendi. Native HTML `<select>` kullanıldı (shadcn'in Radix tabanlı `Select`i değil) — JS olmadan da GET ile çalışsın diye (bkz. Performans bölümü).

### 4-5. Hastane ve klinik detay sayfaları
Artık tamamen gerçek veriyle çalışıyor. Var olmayan bir `id` için Next.js'in `notFound()` mekanizması kullanılıyor (özel bir "bulunamadı" render'ı yazmak yerine). Klinik detayında "Henüz değerlendirme yok." gösteriliyor (Sprint 4'e kadar).

### 6. Repository katmanı
- `HospitalRepository.search()` artık filtre destekli (il, hastane türü) + çok kelimeli arama
- `HospitalRepository.listFeaturedCities()` / `listAllCities()` — yeni `hospital_city_counts` view'ından
- `ClinicRepository.findByIdWithHospital()` — klinik + hastanesini **tek sorguda** getirir (PostgREST embedded resource ile), klinik detay sayfasının iki ayrı round-trip yapmasını önler
- `ClinicRepository.search()` — yeni `search_clinics` Postgres RPC fonksiyonuna delege eder (bkz. aşağıda "Neden RPC")

Hiçbir sayfa/bileşen Supabase'i doğrudan çağırmıyor; hepsi bu iki repository üzerinden.

### Neden bir RPC fonksiyonu (`search_clinics`) gerekti

Klinik araması, `clinics` ile `hospitals`'ı join'leyip her ikisinin sütunlarında OR araması gerektiriyor. PostgREST'in embedded resource'lar (join'lenmiş tablolar) üzerinde `or()` filtrelemesi, tek tablo üzerindeki `or()` kadar net/güvenilir değil. Bunun yerine, tamamen kontrol edilebilir ve **gerçek Postgres'te test edilmiş** bir SQL fonksiyonu (`search_clinics`) yazıldı, `supabase.rpc()` ile çağrılıyor. Hastane araması başlangıçta tek tablo olduğu için düz PostgREST `or()` zincirlemesiyle yapılmıştı; ikinci geçişte (alaka sıralaması gerektiği için, bkz. aşağıda) o da bir RPC fonksiyonuna (`search_hospitals`) taşındı.

### Önemli teknik not: `database.ts` tipleri yeniden yazıldı

Kurulu `@supabase/supabase-js` (2.111.0) paketinin tip sistemi, her tabloda `Insert`/`Update`/`Relationships` alanlarını da zorunlu kılıyor (yalnızca `Row` yeterli değil) — bu, paketin kaynak kodundan (`node_modules/@supabase/postgrest-js/src/types/common/common.ts`) doğrulandı. `src/types/database.ts`, bu gerçek yapısal gereksinimlere göre eksiksiz yeniden yazıldı. Gerçek `supabase gen types typescript --db-url ...` komutu bu sandbox'ta Docker gerektirdiği için (Docker yok) çalıştırılamadı; bu yüzden elle yazıldı ama kurulu paketin kaynak koduna karşı doğrulandı.

### 7. UI kalitesi
- Tüm sayfalar **Server Component** (hiçbiri `"use client"` değil, `error.tsx` dosyaları hariç — Next.js bunları client component olmaya zorluyor)
- **Loading state**: her rota segmentinde (`search`, `hospital/[id]`, `clinic/[id]`) bir `loading.tsx` — Next.js'in Suspense tabanlı otomatik mekanizması, elle `isLoading` state'i gerekmiyor
- **Error state**: her rota segmentinde bir `error.tsx` (client component, `reset()` ile "tekrar dene")
- **Empty state**: sıfır sonuç, sıfır klinik gibi durumlar için özel metinler
- Responsive: Tailwind `sm:` kırılma noktalarıyla mobil-öncelikli

### 8. Performans
- Arama sayfasında hastane + klinik sorguları `Promise.all` ile **paralel** çalıştırılıyor (art arda değil)
- Klinik detay sayfası, klinik+hastaneyi tek sorguda getiriyor (N+1 önlendi)
- Ana sayfa, hastane/klinik detay sayfaları `export const revalidate = 3600` ile ISR kullanıyor — nadiren değişen referans veri için her istekte veritabanına gitmek yerine saatte bir yenilenen önbellek
- Filtre formu native `<select>` kullanıyor, JS gerektiren bir client component (Radix Select) değil — "gereksiz client-side render'dan kaçın" gereksinimi için bilinçli tercih

## Sprint 3 ikinci geçiş — "Smart Hospital Search" (CTO isteği üzerine)

İlk teslimattan sonra iki gerçek eksik kapatıldı:

### Alaka düzeyine göre sıralama

Önceden sonuçlar yalnızca alfabetik sıralıydı. Artık `search_hospitals` ve `search_clinics` fonksiyonları, `pg_trgm`'in `similarity()` fonksiyonuyla her kelime için ilgili alanlardaki en iyi benzerlik skorunu topluyor ve sonuçları bu skora göre (büyükten küçüğe) sıralıyor. Eşit skorlarda isim alfabetik sıraya düşüyor (deterministik ikincil sıralama).

Bu bilinçli bir mimari tercih: tam bir `tsvector`/ağırlıklı full-text-search altyapısı (generated column + GIN indeks) daha "doğru" bir uzun vadeli çözüm olurdu, ama bu aşamada `pg_trgm` (zaten Sprint 2'den beri kurulu) hem yeterli hem de test edilmesi çok daha basit. İleride veri büyüdükçe full-text search'e geçiş `ROADMAP.md`'ye not düşüldü.

### Branş eşanlamlıları — "dahiliye" artık gerçekten çalışıyor

Yeni `branch_synonyms` tablosu (`synonym → official_branch`), günlük dilde kullanılan terimleri resmi branş adlarına eşliyor:

| Günlük terim | Resmi branş |
|---|---|
| dahiliye | İç Hastalıkları |
| kbb | Kulak Burun Boğaz |
| kadın doğum, jinekoloji | Kadın Hastalıkları ve Doğum |
| ortopedi | Ortopedi ve Travmatoloji |
| göz | Göz Hastalıkları |
| çocuk, pediatri | Çocuk Sağlığı ve Hastalıkları |

`search_clinics`, bir kelimeyi branşla doğrudan karşılaştırmanın yanında bu tabloya da bakıyor. `RLS` açık, herkes okuyabiliyor (fonksiyon `SECURITY INVOKER` olduğu için çağıran rolün bu tabloyu görebilmesi gerekiyor — `anon` rolüyle test edilip doğrulandı).

**Gerçek Postgres'te doğrulanan örnekler** (Sprint 3 talimatındaki tüm örnekler):
- `"Hatay dahiliye"` → Hatay Devlet Hastanesi'nin İç Hastalıkları kliniğini buluyor (eşanlamlı sayesinde)
- `"Reyhanlı"` → 0 sonuç (seed verisinde bu ilçe yok — gerçek veriyle dürüst, uydurma sonuç yok)
- `"Konya göz"` → Konya Eğitim ve Araştırma Hastanesi'nin Göz Hastalıkları kliniğini buluyor
- `"Ankara şehir kardiyoloji"` → Ankara Şehir Hastanesi'nin Kardiyoloji kliniğini buluyor

### Filtrelerin opsiyonel olduğu teyidi

Hem `search_hospitals` hem `search_clinics`, `search_query`/`filter_city`/`filter_hospital_type` parametrelerinin hepsini `default null` ile tanımlıyor — kullanıcı hiçbir filtre seçmeden yalnızca metin araması yapabiliyor (zaten ilk teslimattan beri böyleydi, bu geçişte bozulmadığı yeniden doğrulandı).

## Test yaklaşımı

1. **SQL/RPC/view:** gerçek PostgreSQL 16'ya karşı test edildi — hem ilk teslimatın senaryoları hem de bu geçişteki alaka sıralaması ve eşanlamlı sözlüğü, gerçek verilerle ve `anon` rolüyle (RLS altında) doğrulandı.
2. **Uygulama kodu:** `tsc --noEmit`, `next lint`, `npm run build` — hepsi temiz.

**Not:** Hastane araması da bu geçişte (alaka sıralaması gerektiği için) düz PostgREST `or()` zincirlemesinden `search_hospitals` RPC fonksiyonuna taşındı — artık hem hastane hem klinik araması aynı desenle (RPC) çalışıyor, tutarlılık için iyi.

**Yapılamayan:** gerçek bir Supabase projesine karşı uçtan uca canlı test (bu sandbox'ta Docker/gerçek proje yok). Deploy öncesi ekip tarafından `npm run dev` + gerçek `.env.local` ile doğrulanmalı.
