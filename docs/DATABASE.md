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
| created_at, updated_at | timestamptz | |

**`clinic_id` neden denormalize edildi:** teorik olarak `doctor_workplaces.clinic_id` üzerinden türetilebilir, ama "bir klinikteki tüm yorumları getir" sorgusunu join'e zorlamak yerine doğrudan indekslenebilir bir sütun olarak tutmak, arama/listeleme performansı için tercih edildi.

**İş kuralı — bir hekim bir klinik için yalnızca bir aktif değerlendirmeye sahip olabilir:** Bu kural basit bir `UNIQUE` kısıtıyla ifade edilemez çünkü `doctor_id`, `reviews` tablosunda doğrudan bir sütun değildir (yalnızca `doctor_workplace_id` üzerinden erişilir) ve bir hekimin aynı klinik için farklı zaman dilimlerinde birden fazla `doctor_workplaces` kaydı olabilir. Bu yüzden `enforce_review_consistency()` adında bir **BEFORE INSERT/UPDATE trigger** kullanıldı; bu trigger iki şeyi kontrol eder:
1. `clinic_id`, ilişkili `doctor_workplaces.clinic_id` ile eşleşiyor mu (tutarlılık)
2. Aynı hekimin (farklı `doctor_workplace` kayıtları üzerinden bile olsa) aynı klinik için başka bir değerlendirmesi var mı (tekillik kuralı)

**Her iki senaryo da gerçek Postgres'te test edildi** — yanlış `clinic_id` ile ekleme ve aynı klinik için ikinci değerlendirme denemesi doğru şekilde reddedildi.

> **CTO incelemesi notu:** Bu tablo hiçbir zaman çalışma dönemi tarihi (`start_date`/`end_date` benzeri) içermedi — tarih bilgisi yalnızca `doctor_workplaces`'te tutulur, burada kopyalanmaz. "Bir hekim bir klinik için tek aktif değerlendirme" kuralı zaten yukarıdaki trigger ile karşılanıyordu, bu incelemede ek bir değişiklik gerekmedi.

### `review_scores`

| Alan | Tip | Not |
|---|---|---|
| review_id | uuid, **PK ve FK** → reviews | on delete cascade |
| incentive_score | smallint | 1–5 |
| colleague_score | smallint | 1–5 |
| management_score | smallint | 1–5 |
| city_score | smallint | 1–5 |
| created_at, updated_at | timestamptz | |

1-1 ilişki olduğu için ayrı bir `id` sütunu yok — `review_id` hem birincil hem yabancı anahtar. Her skor `CHECK (... between 1 and 5)` ile sınırlandırıldı; aralık dışı değer eklemeyi test ettik, doğru şekilde reddedildi.

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
| reason | text | |
| status | enum `report_status` | pending / reviewed / dismissed / action_taken |
| resolved_at | timestamptz, null olabilir | Moderatörün raporu sonuçlandırdığı an |
| created_at, updated_at | timestamptz | |

`doctor_id` kasıtlı olarak nullable ve `on delete set null`: bildiren hekimin hesabı silinse bile moderasyon kaydı (sebep, durum, tarih) korunur — yalnızca "kim bildirdi" bilgisi kaybolur.

**`resolved_at` (CTO incelemesinde eklendi):** gelecekteki moderasyon araçlarını desteklemek için. İki CHECK kısıtıyla `status` ile tutarlılığı zorlanıyor: `status = 'pending'` iken `resolved_at` **null olmalı**, `status <> 'pending'` iken (reviewed/dismissed/action_taken) `resolved_at` **dolu olmalı**. Bu, "sonuçlandırılmış ama ne zaman sonuçlandığı bilinmiyor" ya da "beklemede ama sonuç tarihi girilmiş" gibi tutarsız durumları veritabanı seviyesinde imkansız kılar — her iki senaryo da **gerçek Postgres'te test edildi**.

Ek indeks: `(created_at) WHERE resolved_at is null` — moderasyon kuyruğunun ("bekleyen raporları en eskiden yeniye listele") sık çalışacak sorgusu için.

## created_at/updated_at tutarlılığı

Görev tanımının genel gereksinimi ("Add created_at and updated_at everywhere") ile bazı tabloların alan listeleri (`review_scores`, `favorites`, `reports` için bu alanlar ayrıca sayılmamıştı) arasında küçük bir çelişki vardı. Şöyle çözüldü:
- **review_scores, reports**: zamanla değişebilir (puan düzeltilebilir, rapor durumu güncellenebilir) → `updated_at` eklendi.
- **favorites**: hiçbir zaman "güncellenmiyor" (yalnızca var/yok) → `updated_at` **bilinçli olarak eklenmedi**, genel kurala tek istisna budur.

## RLS (Row Level Security) durumu

Her tabloda RLS **etkin**. Sprint 5'ten itibaren `favorites`/`reports` dışındaki tüm tablolarda placeholder'ların yerini gerçek kurallar aldı:

- **`hospitals`, `clinics`** — herkes `SELECT` yapabilir (`using (true)`). Kamuya açık referans veri.
- **`doctors`, `doctor_workplaces`** — yalnızca kendi satırı (`auth.uid() = id` / `auth.uid() = doctor_id`). Herkese açık bir "hekim dizini" **yok** — anonimlik ilkesi gereği.
- **`reviews`, `review_scores`** — **herkes okuyabilir** (`using (true)`, ürünün temel değeri), ama yalnızca kendi `doctor_workplaces` kaydına bağlı bir satır ekleyip düzenleyebilir (alt sorgu ile `auth.uid()` kontrolü).
- **`favorites`, `reports`** — henüz implemente edilmedi, kasıtlı olarak **tamamen kilitli** placeholder politika (`using (false)`) korunuyor.

**Gerçek Postgres'te, `auth.uid()`'i taklit eden bir fonksiyon ve iki farklı kullanıcı simülasyonuyla test edildi** (Sprint 5): kullanıcılar birbirinin profilini göremiyor, biri diğerinin `doctor_workplaces`'i adına review ekleyemiyor, `anon` rolü review'ları okuyabiliyor ama `doctors`'ı okuyamıyor/yazamıyor. Detaylar: `docs/SPRINT5.md`.

## Repository katmanı ile ilişki

`HospitalRepository`, `ClinicRepository` (Sprint 2-3), `DoctorRepository`, `ReviewRepository` (Sprint 5). `favorites`/`reports` için repository henüz yok — ilgili özellik implemente edildiğinde eklenecek.
