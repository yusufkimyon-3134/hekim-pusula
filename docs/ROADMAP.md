# Hekim Pusula — Roadmap

## Sprint 1 — Foundation ✅

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 kurulumu
- shadcn/ui temel bileşenleri (Button, Card, Input, Label, Badge)
- Supabase istemcileri (browser + server) — bağlantı katmanı
- TanStack Query provider kurulumu
- React Hook Form + Zod bağımlılıkları
- Ölçeklenebilir klasör mimarisi
- Placeholder sayfalar: Ana Sayfa, Arama, Hastane Detay, Klinik Detay
- Marka tasarım sistemi
- Production build doğrulandı

*(CTO code review sonrası: env doğrulama, CardTitle/CardDescription semantik düzeltmesi, next/link kullanımı, tip tutarlılığı, DetailPageHeader ortak bileşeni — "Sprint 1 - CTO Review Fixes" commit'i.)*

## Sprint 2 — Database Foundation ✅ (bu teslimat)

- 8 tablo için migration: `hospitals`, `clinics`, `doctors`, `doctor_workplaces`, `reviews`, `review_scores`, `favorites`, `reports`
- UUID PK, doğru FK'ler (cascade/restrict/set null — gerekçesi `ARCHITECTURE.md`'de), useful indeksler (b-tree + trigram)
- Her tabloda RLS etkin; `hospitals`/`clinics` herkese açık okunur, diğerleri kimlik doğrulama gelene kadar kilitli placeholder politika
- `reviews` için tutarlılık + tekillik trigger'ı (`enforce_review_consistency`)
- Migration'lar ve iş kuralları **gerçek bir PostgreSQL 16 örneğine karşı test edildi** (bu sandbox'ta geçici olarak kuruldu)
- Seed data: 20 kamu hastanesi, 15 farklı şehir, 160 klinik
- `HospitalRepository`, `ClinicRepository` — arama sayfası artık hardcode veri değil, gerçek repository kullanıyor
- `docs/DATABASE.md` (güncellendi, İngilizce şemaya geçildi), `docs/ARCHITECTURE.md` (yeni)
- Build/lint/typecheck doğrulandı

*(CTO code review sonrası: `doctors` tablosunun hiç kişisel veri içermediği teyit edildi; `doctor_workplaces` alan adları `work_start_date`/`work_end_date` olarak netleştirildi ve `is_verified_workplace` eklendi; `reports.resolved_at` eklendi (status ile tutarlılığı CHECK ile zorlanıyor) — "Sprint 2 - CTO Review Fixes" commit'i.)*

## Sprint 3 — Hospital & Clinic Discovery ✅ (bu teslimat)

- Ana sayfa: hero, büyük arama kutusu, gerçek veriden "öne çıkan şehirler"
- Global arama: çok kelimeli, akıllı (hastane adı + il + ilçe + branş, kelimeler arası AND / alanlar arası OR)
- Filtreler: şehir, hastane türü
- Hastane detay: gerçek veri + klinik listesi; klinik detay: gerçek veri + "Henüz değerlendirme yok."
- `HospitalRepository`/`ClinicRepository` genişletildi; yeni `search_clinics` RPC fonksiyonu + `hospital_city_counts` view
- Server Component + `loading.tsx`/`error.tsx` her rotada; ISR (`revalidate`) ile gereksiz DB sorgusu azaltıldı
- Detaylar: `docs/SPRINT3.md`

**Bilinen sınır / Sprint sonrası takip:** Arama harfi harfine çalışıyor, branş eşanlamlıları (Dahiliye ↔ İç Hastalıkları gibi) tanımıyor. İleride bir "branş eşanlamlıları" tablosu/mapping'i eklenmeli.

*(İkinci geçiş — "Smart Hospital Search": sonuçlar artık `pg_trgm` `similarity()` ile alaka düzeyine göre sıralanıyor (önceden yalnızca alfabetikti); yeni `branch_synonyms` tablosu günlük dildeki terimleri ("dahiliye" → "İç Hastalıkları") çözüyor — yukarıdaki bilinen sınır artık kısmen kapandı. Hastane araması da tutarlılık için RPC'ye taşındı. Detaylar `docs/SPRINT3.md`'de — "Sprint 3 - Smart Hospital Search" commit'i. İleride veri büyüdükçe tam bir `tsvector` full-text-search'e geçiş düşünülebilir.)*

## Sprint 4 — Premium Clinic Detail Experience ✅ (bu teslimat)

- Klinik detay sayfası tamamen yeniden tasarlandı: hero (klinik adı > hastane adı > konum hiyerarşisi), tanıtım metni, "henüz deneyim yok" boş durumu (devre dışı "Deneyimini Paylaş" CTA'sı), 6 "yakında" bilgi kartı (nöbet, hasta yoğunluğu, servis yükü, ek ödeme, yönetim, ortam), imza öğesi olarak zarif boş zaman çizelgesi
- Yeni `Badge` varyantı (`soft`) — "Yakında" etiketleri için
- Tekrarlanan bölüm başlığı stili ortak `SectionLabel` bileşenine çıkarıldı (arama, hastane, klinik sayfalarında kullanılıyor)
- Yeni özellik/veri modeli değişikliği yok — bu sprint saf sunum/tasarım katmanı
- Detaylar (tasarım/UX gerekçeleri): `docs/SPRINT4.md`

## Sprint 5 — Community & Trust Foundation ✅ (bu teslimat)

- Supabase Auth: giriş/kayıt/çıkış (Server Actions), `middleware.ts` ile oturum yenileme
- `/profile`: `doctors` tablosu genişletildi (`avatar_url`, `city`, `current_hospital`, `experience_year`, `bio`) — **ayrı bir `profiles` tablosu değil** (gerekçe: `docs/SPRINT5.md`)
- `VerifiedBadge` bileşeni — var olan `doctors.is_verified` alanını gösteriyor (yeni sütun eklenmedi)
- `/clinic/[id]/review`: atomik `submit_review` RPC'si ile değerlendirme gönderimi (workplace otomatik açılıyor, review+score tek transaction'da)
- RLS: `doctors`/`doctor_workplaces`/`reviews`/`review_scores` artık placeholder değil, gerçek kurallarla çalışıyor (`reviews` herkese açık okunur, yazma yalnızca sahibine)
- Klinik detay sayfasındaki zaman çizelgesi artık gerçek değerlendirmeleri gösteriyor
- Gerçek Postgres'e karşı çok kullanıcılı RLS senaryoları + atomik RPC test edildi
- **Önemli/dürüst not:** auth-farkında header artık tüm uygulamayı dinamik render'a zorluyor — Sprint 3'teki ISR (`revalidate`) fiilen devre dışı. Bu, SSR tabanlı auth'un doğal/kabul edilen bir sonucu, bir hata değil.
- **Talimattan bilinçli sapmalar** (gerekçeli): `full_name` eklenmedi (anonimlik ilkesi), `verified_doctor` eklenmedi (`is_verified` zaten var), review formu talimattaki isimler yerine var olan şema sütunlarına bağlandı — tüm detaylar `docs/SPRINT5.md`
- Detaylar: `docs/SPRINT5.md`

## Sprint 6 — Clinic Intelligence & Comparison ✅ (bu teslimat)

- `review_scores`'a `education_score`/`academic_score` eklendi (gerekçe: `docs/SPRINT6.md`)
- `clinic_review_stats` view + `rank_clinics_by_branch` RPC — gerçek Postgres'te test edildi
- `/compare` — iki klinik yan yana (checkbox + GET form, JS/client component yok)
- `/rankings`, `/rankings/[branch]` — branşa göre dinamik sıralama (overall/education/academic/workload/night_shifts)
- `/search` — gelişmiş filtreler (`<details>`, JS'siz): min. genel/eğitim/akademik puan, maks. aylık nöbet
- Klinik detay sayfası: istatistik özeti, puan dağılımı, artı/eksi (kategori ortalamalarından, NLP değil), öne çıkan yorumlar
- Yeni bağımlılık yok; build/lint/typecheck temiz
- Detaylar: `docs/SPRINT6.md`

## Sprint 7 — Trust, Moderation & Reputation System ✅ (bu teslimat)

- İtibar sistemi: `doctor_reputation`/`get_my_reputation()`/`review_author_stats` — reputation_score = onaylı yorum×10 + faydalı oy×3. `review_author_stats` **asla doctor_id döndürmez** (anonimlik ile itibar gösterimi arasındaki gerilimin çözümü)
- Faydalı oy (`review_helpful_votes`, bileşik PK ile tek oy), rapor sistemi (`reports` artık gerçekten aktif, 5 sabit sebep)
- Review düzenleme/silme (`update_review` RPC, "Düzenlendi" göstergesi), tekrar değerlendirme denemesi artık otomatik düzenlemeye yönlendiriyor
- Moderasyon: `reviews.status` (pending/approved/rejected), **3+ farklı hekimden rapor alan review otomatik `pending`'e çekiliyor** (moderatör paneli olmadan da moderasyonun bir anlamı olsun diye)
- `clinic_review_stats` artık yalnızca onaylı review'ları sayıyor + toplam faydalı oy eklendi
- Gerçek Postgres'te bulunan 2 hata düzeltildi: trigger'da eksik `SECURITY DEFINER`, `anon`'da eksik `doctor_workplaces` grant'i
- Detaylar: `docs/SPRINT7.md`

## Sprint 8 (öneri)

- Kurum bağlama akışının olgunlaştırılması (şu an review gönderiminde otomatik/doğrulanmamış workplace açılıyor) — SGK hizmet dökümü ile gerçek doğrulama, `is_verified_workplace` alanının gerçekten kullanılması
- Doğrulama belgesi yükleme akışı (diploma/TTB no) — `doctors.is_verified`'ı gerçekten `true` yapacak süreç
- Katkı teşviki (ver-gör kilidi + ilk görev muafiyeti)

## Sprint 9 (öneri)

- Moderatör paneli (`reports` kuyruğu + Sprint 7'de biriken `pending` review'ları inceleme) — artık gerçek bir kuyruk var, bu sprint'in önceliği arttı

## Sprint 10 (öneri)

- Aktif hekimle anonim iletişim talebi ve sohbet
- Bildirimler

## Sonraki (öneri, önceliklendirilmedi)

- YHGM kontenjan verisinin otomatik çekilmesi
- Atama türüne göre kişiselleştirilmiş bildirimler
- ISR/statik önbellekleme stratejisinin auth sonrası yeniden gözden geçirilmesi
- Gerçek "workload score"/"education/academic" boyutları büyük veri hacminde full-text-search + tsvector'a taşınması (arama tarafı için)

> Not: Sprint 8 ve sonrası için kapsam/sıralama bir öneri taslağıdır, bağlayıcı değildir.
