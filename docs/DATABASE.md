# Hekim Pusula — Veritabanı Şeması

> **Durum:** Sprint 2'de tasarlandı, CTO incelemesi sonrası güncellendi (`doctor_workplaces` alan adları + `is_verified_workplace`, `reports.resolved_at`), ve **gerçek bir PostgreSQL 16 örneğine karşı doğrulandı** (bu depoda migration olarak mevcut, `supabase/migrations/`). Henüz canlı bir Supabase projesine uygulanmadı — bu, ekibin bir sonraki adımıdır (`supabase link` + `supabase db push`).
>
> Sprint 1'in taslak `DATABASE.md`'si Türkçe tablo/alan adları kullanıyordu (`kurumlar`, `il`, `brans`...). Bu sürüm, Sprint 2'nin görev tanımında verilen **İngilizce şemayı** esas alır ve onun yerini alır.

## Genel bakış

8 tablo, üç katmana ayrılabilir:

1. **Referans veri** (herkese açık, okunabilir): `hospitals`, `clinics`
2. **Hekim & çalışma geçmişi**: `doctors`, `doctor_workplaces`
3. **Kullanıcı üretimi içerik**: `reviews`, `review_scores`, `favorites`, `reports`

## Tablolar

### `hospitals`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | `gen_random_uuid()` |
| name | text | |
| city | text | indekslendi |
| district | text | |
| hospital_type | enum `hospital_type` | state_hospital / training_and_research_hospital / city_hospital / university_hospital |
| created_at, updated_at | timestamptz | |

Yalnızca kamu hastaneleri kapsamdadır — özel hastane türü enum'da yok, bu bilinçli bir tasarım kısıtı (görev tanımı gereği).

**İndeksler:** `city`, `hospital_type`, ve `name` üzerinde `pg_trgm` GIN indeksi (arama sayfasındaki `ILIKE '%...%'` sorgularını hızlandırmak için — trigram indeksi olmadan bu tür sorgular büyük tabloda tam tarama gerektirir).

### `clinics`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | |
| hospital_id | uuid, FK → hospitals | **on delete cascade** |
| branch | text | |
| created_at, updated_at | timestamptz | |

`UNIQUE (hospital_id, branch)` — aynı hastanede aynı branş iki kez tanımlanamaz.

### `doctors`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | **`auth.users(id)`'e referans** |
| nickname | text | Gerçek ad/soyad DEĞİL |
| role | enum `doctor_role` | general_practitioner / specialist / subspecialist |
| specialty | text | |
| is_verified | boolean | Sprint 5'te `VerifiedBadge` bileşeni bu alanı okuyor; belge yükleme akışı henüz yok |
| avatar_url | text, null olabilir | Sprint 5 |
| city | text, null olabilir | Sprint 5, opsiyonel profil alanı |
| current_hospital | text, null olabilir | Sprint 5 — **kendi beyanına dayalı, doğrulanmamış**. `doctor_workplaces` ile karıştırılmamalı |
| experience_year | integer, null olabilir | Sprint 5, 0-60 arası (CHECK) |
| bio | text, null olabilir | Sprint 5 |
| created_at, updated_at | timestamptz | |

**Kritik tasarım kararı:** `id`, Supabase'in standart "profil tablosu" deseniyle `auth.users.id`'yi referans alır. `auth.users` şeması her Supabase projesinde zaten var olduğu için bu referans Sprint 2'den beri geçerlidir; Sprint 5'te gerçek kimlik doğrulama (Supabase Auth) buna bağlandı.

Gerçek ad/soyad/TC hiçbir sütunda tutulmaz — bu, ürünün "anonimlik esas" ilkesinin veritabanı seviyesindeki karşılığıdır.

> **CTO incelemesi notu (Sprint 2):** Bu tablo, tasarım aşamasından itibaren zaten yalnızca temel alanları içeriyordu — `full_name`, `national_id`, `diploma_number` gibi kişisel veri hiçbir zaman şemaya eklenmedi. Kimlik doğrulama belgesi (diploma/TTB no) *işlenip* kalıcı olarak *saklanmayacak* şekilde kurgulanmalı — bu tabloya asla bir "belge" veya "kimlik" sütunu eklenmemeli.
>
> **Sprint 5 notu:** Bu ilke Sprint 5'te de korundu — görev tanımı `full_name` ve ayrı bir `profiles` tablosu istiyordu, ikisi de bilinçli olarak uygulanmadı. Gerekçe: `docs/SPRINT5.md`.

### `doctor_workplaces`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | |
| doctor_id | uuid, FK → doctors | on delete cascade |
| clinic_id | uuid, FK → clinics | **on delete restrict** |
| work_start_date | date | |
| work_end_date | date, null olabilir | null = hâlâ çalışıyor |
| is_current | boolean | |
| is_verified_workplace | boolean | Bu çalışma iddiasının belge ile doğrulanıp doğrulanmadığı |
| created_at, updated_at | timestamptz | |

> **CTO incelemesi notu — alan adları değişti:** `start_date`/`end_date`, `work_start_date`/`work_end_date` olarak yeniden adlandırıldı (bu tablonun *iş* ile ilgili tarihleri tuttuğunu netleştirmek için — ör. `reviews` gibi başka bir tabloda ileride genel bir "date" alanı olursa karışıklık olmasın diye). `is_verified_workplace` yeni eklendi.

**`is_verified_workplace` neden `doctors.is_verified`'tan ayrı:** bir hekimin genel kimliği (gerçekten hekim olduğu) doğrulanmış olabilir, ama *belirli bir kurumda çalıştığı* iddiası ayrıca doğrulanmamış olabilir (örn. SGK hizmet dökümü henüz incelenmedi). Bu iki doğrulama farklı belgelere ve farklı zamanlamaya sahiptir, bu yüzden ayrı sütunlar olarak modellendi.

**İki CHECK kısıtı:**
- `work_end_date is null or work_end_date >= work_start_date` — mantıksız tarih aralığını engeller
- `is_current = (work_end_date is null)` — bu iki alanın birbirinden bağımsız güncellenip tutarsız kalmasını (klasik bir veri bütünlüğü hatası) veritabanı seviyesinde imkansız kılar

**Kısmi UNIQUE indeks:** `(doctor_id, clinic_id) WHERE is_current` — bir hekimin aynı klinikte aynı anda yalnızca bir "aktif" çalışma kaydı olabilir. **Gerçek Postgres'te test edildi** (alan adı değişikliğinden sonra da).

**Ek kısmi indeks:** `(clinic_id) WHERE is_current and is_verified_workplace` — kurum sayfasındaki "aktif ve doğrulanmış hekim var mı" sorgusu sık çalışacağı için.

**Neden `on delete restrict` (cascade değil):** klinikler referans/master veridir. Bir kliniğin silinmesi, üzerinde çalışma geçmişi olan hekimlerin verisini sessizce yok etmemeli. Bu, `hospitals → clinics` cascade'iyle birleşince şu korumayı sağlar: bir hastane silinirse klinikleri de silinir (cascade), *ama* o kliniklerden herhangi birinde çalışma geçmişi/değerlendirme varsa tüm silme işlemi bir bütün olarak başarısız olur — kazara toplu veri kaybına karşı bir güvenlik ağı.

**Tekrar etmeme kuralı:** çalışma dönemi bilgisi (tarihler, aktiflik) yalnızca bu tabloda tutulur; `reviews` tablosunda asla kopyalanmaz (bkz. aşağıda).

### `reviews`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | |
| doctor_workplace_id | uuid, FK → doctor_workplaces | on delete cascade |
| clinic_id | uuid, FK → clinics | on delete restrict, **denormalize** |
| monthly_shifts | integer | ≥ 0 |
| daily_patients | integer | ≥ 0 |
| service_patients | integer | ≥ 0 |
| would_choose_again | boolean | |
| comment | text, null olabilir | |
| status | enum `review_status` | Sprint 7: pending / approved / rejected, varsayılan **approved** |
| created_at, updated_at | timestamptz | |

**`clinic_id` neden denormalize edildi:** teorik olarak `doctor_workplaces.clinic_id` üzerinden türetilebilir, ama "bir klinikteki tüm yorumları getir" sorgusunu join'e zorlamak yerine doğrudan indekslenebilir bir sütun olarak tutmak, arama/listeleme performansı için tercih edildi.

**İş kuralı — bir hekim bir klinik için yalnızca bir aktif değerlendirmeye sahip olabilir:** Bu kural basit bir `UNIQUE` kısıtıyla ifade edilemez çünkü `doctor_id`, `reviews` tablosunda doğrudan bir sütun değildir (yalnızca `doctor_workplace_id` üzerinden erişilir) ve bir hekimin aynı klinik için farklı zaman dilimlerinde birden fazla `doctor_workplaces` kaydı olabilir. Bu yüzden `enforce_review_consistency()` adında bir **BEFORE INSERT/UPDATE trigger** kullanıldı; bu trigger iki şeyi kontrol eder:
1. `clinic_id`, ilişkili `doctor_workplaces.clinic_id` ile eşleşiyor mu (tutarlılık)
2. Aynı hekimin (farklı `doctor_workplace` kayıtları üzerinden bile olsa) aynı klinik için başka bir değerlendirmesi var mı (tekillik kuralı)

**Her iki senaryo da gerçek Postgres'te test edildi** — yanlış `clinic_id` ile ekleme ve aynı klinik için ikinci değerlendirme denemesi doğru şekilde reddedildi.

> **CTO incelemesi notu:** Bu tablo hiçbir zaman çalışma dönemi tarihi (`start_date`/`end_date` benzeri) içermedi — tarih bilgisi yalnızca `doctor_workplaces`'te tutulur, burada kopyalanmaz. "Bir hekim bir klinik için tek aktif değerlendirme" kuralı zaten yukarıdaki trigger ile karşılanıyordu, bu incelemede ek bir değişiklik gerekmedi.

> **Sprint 7 notu — `status`:** Yeni review'lar varsayılan `approved` ile gönderiliyor (moderatör paneli henüz yok — `pending` varsayılan olsaydı hiçbir review hiç görünmezdi). Bir review 3+ farklı hekimden bekleyen rapor alırsa `flag_heavily_reported_reviews` trigger'ı otomatik olarak `pending`'e çeker. Gerekçe: `docs/SPRINT7.md`.

### `review_helpful_votes` (Sprint 7)

| Alan | Tip | Not |
|---|---|---|
| review_id | uuid, FK → reviews | on delete cascade |
| doctor_id | uuid, FK → doctors | on delete cascade |
| created_at | timestamptz | |

`PRIMARY KEY (review_id, doctor_id)` — `favorites` ile aynı desen, aynı hekimin aynı review'a iki kez oy vermesini imkansız kılar. RLS: yalnızca kendi oyunu görebilir/ekleyebilir/silebilirsin (kimin kime oy verdiği herkese açık değil). Toplam sayı `review_helpful_counts` view'ı ile (owner-bypass, `security_invoker` **yok**) herkese açık.

### `review_author_stats`, `doctor_reputation` (view'lar, Sprint 7)

`doctor_reputation` dahili bir view'dır (anon/authenticated'a hiç GRANT edilmez) — yalnızca `get_my_reputation()` (SECURITY DEFINER, `auth.uid()`'e sabit, profil sayfası için) ve `review_author_stats` (herkese açık, review kartları için) tarafından kullanılır. **`review_author_stats` asla `doctor_id` döndürmez** — yalnızca `review_id` + sayılar. Bu, "review kartında itibar göster" isteği ile "hekim dizini olmasın" ilkesini uzlaştırıyor (bkz. `docs/SPRINT7.md`).

### `review_scores`

| Alan | Tip | Not |
|---|---|---|
| review_id | uuid, **PK ve FK** → reviews | on delete cascade |
| incentive_score | smallint | 1–5, "finansal memnuniyet" |
| colleague_score | smallint | 1–5, "sosyal ortam" |
| management_score | smallint | 1–5, "yönetim/faculty desteği" |
| city_score | smallint | 1–5, şehir/yaşam kalitesi |
| education_score | integer | 1–5, Sprint 6 — eğitim kalitesi |
| academic_score | integer | 1–5, Sprint 6 — akademik fırsatlar |
| created_at, updated_at | timestamptz | |

1-1 ilişki olduğu için ayrı bir `id` sütunu yok — `review_id` hem birincil hem yabancı anahtar. Her skor `CHECK (... between 1 and 5)` ile sınırlandırıldı; aralık dışı değer eklemeyi test ettik, doğru şekilde reddedildi.

> **Sprint 6 notu:** `education_score`/`academic_score` sonradan eklendi (var olan satırlar varsayılan `3` ile dolduruldu) — gerekçe `docs/SPRINT6.md`'de. "Overall score" ayrı bir sütun değil; `clinic_review_stats` view'ında altı puanın ortalaması olarak hesaplanır.

### `clinic_review_stats` (view, Sprint 6)

Her klinik için: `review_count`, altı puanın her biri için ortalama, `avg_overall_score` (altısının ortalaması), `avg_monthly_shifts`/`avg_daily_patients`/`avg_service_patients`, `recommend_percentage` (`would_choose_again` yüzdesi). `clinics` ile `reviews`/`review_scores` arasında **LEFT JOIN** — hiç yorumu olmayan klinikler de `review_count=0` ile satırda görünür (istatistik/karşılaştırma sayfalarının "henüz veri yok" durumunu doğal göstermesi için). `security_invoker=true`, herkese `SELECT` açık.

### `rank_clinics_by_branch(branch, sort_by)` (fonksiyon, Sprint 6)

Bir branştaki tüm klinikleri seçilen boyuta göre sıralar: `overall` (varsayılan), `education`, `academic`, `workload`, `night_shifts`. Skor boyutlarında yüksek=iyi (desc), `workload`/`night_shifts`'te düşük=iyi (asc) — yön otomatik seçilir. **Gerçek Postgres'te, 3 farklı klinikte farklı puan/nöbet profilleriyle test edildi**, her sıralama boyutu doğru yönde çalıştı.

### `search_clinics` — Sprint 6 genişletmesi

Artık isteğe bağlı `filter_min_overall`, `filter_min_education`, `filter_min_academic`, `filter_max_monthly_shifts` parametreleri alıyor (`clinic_review_stats` ile join). Bir eşik verilip ilgili klinik hiç puanlanmamışsa (ortalama `null`), o eşik sağlanmamış sayılır ve klinik sonuçlardan çıkar — bu kasıtlı, test edildi.

### `favorites`

| Alan | Tip | Not |
|---|---|---|
| doctor_id | uuid, FK → doctors | on delete cascade |
| clinic_id | uuid, FK → clinics | on delete cascade |
| created_at | timestamptz | |

`PRIMARY KEY (doctor_id, clinic_id)` — bileşik anahtar, aynı favoriyi iki kez eklemeyi doğal olarak engeller. **`updated_at` kasıtlı olarak yok**: bir favori düzenlenmez, yalnızca eklenir/silinir.

### `reports`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | |
| review_id | uuid, FK → reviews | on delete cascade |
| doctor_id | uuid, FK → doctors, **null olabilir** | on delete **set null** |
| reason | enum `report_reason` | Sprint 7: `text`'ten enum'a değiştirildi — spam / offensive_language / false_information / duplicate / other |
| status | enum `report_status` | pending / reviewed / dismissed / action_taken |
| resolved_at | timestamptz, null olabilir | Moderatörün raporu sonuçlandırdığı an |
| created_at, updated_at | timestamptz | |

`UNIQUE (review_id, doctor_id)` (Sprint 7) — aynı hekim aynı review'ı iki kez raporlayamaz.

`doctor_id` kasıtlı olarak nullable ve `on delete set null`: bildiren hekimin hesabı silinse bile moderasyon kaydı (sebep, durum, tarih) korunur — yalnızca "kim bildirdi" bilgisi kaybolur.

> **Sprint 7 notu:** Bu tablo Sprint 2'den beri "her şeyi reddet" placeholder RLS'e sahipti (kimlik doğrulama yoktu). Artık gerçekten aktif: kimliği doğrulanmış herkes rapor gönderebilir, yalnızca kendi gönderdiği raporları görebilir. `reason` alanı da bu sprintte serbest metinden sabit bir enum'a dönüştürüldü (tablo hiç yazılabilir olmadığı için veri kaybı riski yoktu).

**`resolved_at` (CTO incelemesinde eklendi):** gelecekteki moderasyon araçlarını desteklemek için. İki CHECK kısıtıyla `status` ile tutarlılığı zorlanıyor: `status = 'pending'` iken `resolved_at` **null olmalı**, `status <> 'pending'` iken (reviewed/dismissed/action_taken) `resolved_at` **dolu olmalı**. Bu, "sonuçlandırılmış ama ne zaman sonuçlandığı bilinmiyor" ya da "beklemede ama sonuç tarihi girilmiş" gibi tutarsız durumları veritabanı seviyesinde imkansız kılar — her iki senaryo da **gerçek Postgres'te test edildi**.

Ek indeks: `(created_at) WHERE resolved_at is null` — moderasyon kuyruğunun ("bekleyen raporları en eskiden yeniye listele") sık çalışacak sorgusu için.

## created_at/updated_at tutarlılığı

Görev tanımının genel gereksinimi ("Add created_at and updated_at everywhere") ile bazı tabloların alan listeleri (`review_scores`, `favorites`, `reports` için bu alanlar ayrıca sayılmamıştı) arasında küçük bir çelişki vardı. Şöyle çözüldü:
- **review_scores, reports**: zamanla değişebilir (puan düzeltilebilir, rapor durumu güncellenebilir) → `updated_at` eklendi.
- **favorites**: hiçbir zaman "güncellenmiyor" (yalnızca var/yok) → `updated_at` **bilinçli olarak eklenmedi**, genel kurala tek istisna budur.

## RLS (Row Level Security) durumu

Her tabloda RLS **etkin**. Sprint 7 itibarıyla `favorites` dışındaki tüm tablolarda placeholder'ların yerini gerçek kurallar aldı:

- **`hospitals`, `clinics`** — herkes `SELECT` yapabilir (`using (true)`). Kamuya açık referans veri.
- **`doctors`, `doctor_workplaces`** — yalnızca kendi satırı. Herkese açık bir "hekim dizini" **yok** — anonimlik ilkesi gereği.
- **`reviews`, `review_scores`** — **onaylı (`status='approved'`) olanlar herkese açık okunur** (Sprint 7'de eklenen moderasyon durumuyla birlikte), yazar kendi review'unu durumu ne olursa olsun görebilir/düzenleyebilir/silebilir.
- **`review_helpful_votes`** (Sprint 7) — yalnızca kendi oyun (select/insert/delete); toplam sayı `review_helpful_counts` view'ı ile herkese açık.
- **`reports`** (Sprint 7'de aktifleşti) — kimliği doğrulanmış herkes rapor gönderebilir, yalnızca kendi raporlarını görebilir.
- **`favorites`** — henüz implemente edilmedi, kasıtlı olarak **tamamen kilitli** placeholder politika korunuyor.

**Gerçek Postgres'te, `auth.uid()`'i taklit eden bir fonksiyon ve çok kullanıcılı simülasyonlarla test edildi** (Sprint 5 ve 7): kullanıcılar birbirinin profilini göremiyor, biri diğerinin adına review ekleyemiyor/düzenleyemiyor, `anon` rolü onaylı review'ları okuyabiliyor ama `doctors`'ı okuyamıyor/yazamıyor, faydalı oylar tekil ve gizli ama toplamı herkese açık, 3+ rapor alan bir review otomatik gizleniyor. Detaylar: `docs/SPRINT5.md`, `docs/SPRINT7.md`.

## Repository katmanı ile ilişki

`HospitalRepository`, `ClinicRepository` (Sprint 2-3, Sprint 6'da genişledi), `DoctorRepository` (Sprint 5, Sprint 7'de `getMyReputation` eklendi), `ReviewRepository` (Sprint 5, Sprint 7'de `update`/`delete`/`voteHelpful`/`findOwnReviewIdForClinic` eklendi), `ReportRepository` (Sprint 7, yeni). `favorites` için repository henüz yok.
