# Hekim Pusula — Veritabanı Şeması

> **Durum:** Sprint 2'de tasarlandı ve **gerçek bir PostgreSQL 16 örneğine karşı doğrulandı** (bu depoda migration olarak mevcut, `supabase/migrations/`). Henüz canlı bir Supabase projesine uygulanmadı — bu, ekibin bir sonraki adımıdır (`supabase link` + `supabase db push`).
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
| is_verified | boolean | |
| created_at, updated_at | timestamptz | |

**Kritik tasarım kararı:** `id`, Supabase'in standart "profil tablosu" deseniyle `auth.users.id`'yi referans alır. Bu, kimlik doğrulama UI'ını *implemente etmez* (Sprint 3'te gelecek) — ama şemayı şimdiden doğru kurar, böylece auth eklendiğinde birincil anahtar tipini değiştirip veri taşımak gerekmez. `auth.users` şeması her Supabase projesinde zaten var olduğu için bu referans bugün de geçerlidir.

Gerçek ad/soyad/TC hiçbir sütunda tutulmaz — bu, ürünün "anonimlik esas" ilkesinin veritabanı seviyesindeki karşılığıdır.

### `doctor_workplaces`

| Alan | Tip | Not |
|---|---|---|
| id | uuid, PK | |
| doctor_id | uuid, FK → doctors | on delete cascade |
| clinic_id | uuid, FK → clinics | **on delete restrict** |
| start_date | date | |
| end_date | date, null olabilir | null = hâlâ çalışıyor |
| is_current | boolean | |
| created_at, updated_at | timestamptz | |

**İki CHECK kısıtı:**
- `end_date is null or end_date >= start_date` — mantıksız tarih aralığını engeller
- `is_current = (end_date is null)` — bu iki alanın birbirinden bağımsız güncellenip tutarsız kalmasını (klasik bir veri bütünlüğü hatası) veritabanı seviyesinde imkansız kılar

**Kısmi UNIQUE indeks:** `(doctor_id, clinic_id) WHERE is_current` — bir hekimin aynı klinikte aynı anda yalnızca bir "aktif" çalışma kaydı olabilir. **Gerçek Postgres'te test edildi.**

**Neden `on delete restrict` (cascade değil):** klinikler referans/master veridir. Bir kliniğin silinmesi, üzerinde çalışma geçmişi olan hekimlerin verisini sessizce yok etmemeli. Bu, `hospitals → clinics` cascade'iyle birleşince şu korumayı sağlar: bir hastane silinirse klinikleri de silinir (cascade), *ama* o kliniklerden herhangi birinde çalışma geçmişi/değerlendirme varsa tüm silme işlemi bir bütün olarak başarısız olur — kazara toplu veri kaybına karşı bir güvenlik ağı.

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
| created_at, updated_at | timestamptz | |

`doctor_id` kasıtlı olarak nullable ve `on delete set null`: bildiren hekimin hesabı silinse bile moderasyon kaydı (sebep, durum, tarih) korunur — yalnızca "kim bildirdi" bilgisi kaybolur.

## created_at/updated_at tutarlılığı

Görev tanımının genel gereksinimi ("Add created_at and updated_at everywhere") ile bazı tabloların alan listeleri (`review_scores`, `favorites`, `reports` için bu alanlar ayrıca sayılmamıştı) arasında küçük bir çelişki vardı. Şöyle çözüldü:
- **review_scores, reports**: zamanla değişebilir (puan düzeltilebilir, rapor durumu güncellenebilir) → `updated_at` eklendi.
- **favorites**: hiçbir zaman "güncellenmiyor" (yalnızca var/yok) → `updated_at` **bilinçli olarak eklenmedi**, genel kurala tek istisna budur.

## RLS (Row Level Security) durumu

Her tabloda RLS **etkin**. İki farklı politika seti var:

- **`hospitals`, `clinics`** — herkes `SELECT` yapabilir (`using (true)`). Kamuya açık referans veridir, arama sayfası kimlik doğrulaması olmadan çalışmalı.
- **`doctors`, `doctor_workplaces`, `reviews`, `review_scores`, `favorites`, `reports`** — kasıtlı olarak **tamamen kilitli** placeholder politika (`using (false)`). Kimlik doğrulama henüz yok (Sprint 3), gerçek erişim kuralları o zaman yazılacak.

**Gerçek bir non-superuser rolüyle test edildi**: `hospitals`/`clinics` görünür, diğer 6 tablo tamamen görünmez — beklenen davranış doğrulandı.

> ⚠️ **Sprint 3 için not:** `reviews`/`review_scores` muhtemelen nihayetinde `hospitals`/`clinics` gibi herkese açık okunur olacak (ürünün temel değeri budur), ama *yazma* kimlik doğrulanmış ve doğrulanmış hekimlerle sınırlı kalacak. Bu placeholder'ı unutmayın.

## Repository katmanı ile ilişki

Yalnızca `hospitals` ve `clinics` için repository yazıldı (`src/lib/repositories/`), çünkü bu sprintte yalnızca arama sayfası gerçek veriye bağlandı. Diğer tablolar için repository'ler, ilgili özellik implemente edildiğinde eklenecek.
