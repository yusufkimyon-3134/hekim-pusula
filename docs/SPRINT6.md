# Sprint 6 — Clinic Intelligence & Comparison

## Önce: bir şema kararı

Bu sprint de (Sprint 5 gibi) şemada karşılığı olmayan boyutlar istedi: "Education quality", "Academic opportunities". Bu, ikinci sprinttir aynı iki boyutun istenmesi ve karşılaştırma/sıralama özelliğinin doğrudan bunlar üzerine kurulu olması nedeniyle, bu kez **gerçekten yeni iki sütun eklendi**: `review_scores.education_score`, `review_scores.academic_score` (1-5, var olan 4 puanla aynı desende). Var olan satırlar geriye dönük olarak nötr bir varsayılan (3) ile dolduruldu.

Karşılaştırmadaki diğer 6 boyut, var olan alanlara eşlendi (Sprint 5'teki mantığın devamı):

| İstenen boyut | Karşılık |
|---|---|
| Financial satisfaction | `incentive_score` |
| Social environment | `colleague_score` |
| Faculty support | `management_score` |
| Workload | `daily_patients + service_patients` (gerçek sayı, uydurma puan değil) |
| Night shifts | `monthly_shifts` (gerçek sayı) |
| Overall score | altı puanın ortalaması — ayrı bir sütun **değil**, `clinic_review_stats` view'ında hesaplanır |

`city_score` bu 8 boyutun hiçbirine tam oturmuyor; kaldırılmadı, yalnızca bu karşılaştırma özelliğinde ayrı bir "Şehir / yaşam kalitesi" satırı olarak gösteriliyor.

## Neler yapıldı

### Veritabanı (gerçek Postgres 16'ya karşı test edildi)

- `review_scores.education_score`, `academic_score` eklendi
- `clinic_review_stats` (view): her klinik için değerlendirme sayısı, 6 alt puan ortalaması, genel puan ortalaması, ortalama nöbet/hasta sayıları, öneri yüzdesi. Yorumu olmayan klinikler de `review_count=0` ile listede kalıyor (LEFT JOIN)
- `rank_clinics_by_branch(branch, sort_by)` (RPC): bir branştaki tüm klinikleri overall/education/academic/workload/night_shifts'e göre sıralar. Skor boyutlarında yüksek=iyi, workload/night_shifts'te düşük=iyi — yön otomatik seçiliyor
- `search_clinics` genişletildi: isteğe bağlı minimum genel/eğitim/akademik puan ve maksimum aylık nöbet filtreleri. Bir eşik istenip klinik hiç puanlanmamışsa (ortalama null), o eşiği sağlamamış sayılır — test edildi
- `submit_review` genişletildi: yeni 2 puanı da alıyor

**Test edilen senaryolar:** 3 farklı hekim, 3 farklı klinikte review; `rank_clinics_by_branch` overall/education/workload/night_shifts sıralamalarının hepsi doğru yönde çalıştı; `search_clinics(min_overall=4)` 160 klinikten yalnızca eşiği geçeni (1) döndürdü; `anon` rolüyle `clinic_review_stats`/`rank_clinics_by_branch` erişimi doğrulandı.

### 1. Klinik Karşılaştırma — `/compare`

`?clinicId=A&clinicId=B` query param'larını okur. **Client component veya JS gerekmiyor**: sıralama sayfasındaki checkbox'lar aynı `name="clinicId"` ile paylaşıldığı için, GET formunda otomatik olarak tekrarlanan query param dizisine dönüşüyor — Next.js bunu `searchParams.clinicId` içinde dizi olarak veriyor. Bu, "iki klinik seç" etkileşimini herhangi bir state yönetimi olmadan çözdü.

### 2. Sıralama — `/rankings`, `/rankings/[branch]`

`[branch]` dinamik: talimattaki "Best Internal Medicine/General Surgery/Ophthalmology" örnekleri sabit sayfalar olarak değil, veritabanındaki gerçek branş listesinden (`ClinicRepository.listBranches()`) türetilen genel bir rota olarak uygulandı — yeni bir branş eklendiğinde otomatik olarak sıralama sayfası kazanır.

### 3. Gelişmiş Arama

`/search` formuna native `<details>/<summary>` (JS'siz açılır bölüm) ile 4 filtre eklendi. "Workload score" harfiyen uygulanmadı (böyle bir puan yok) — yerine gerçek "maksimum aylık nöbet" eşiği kullanıldı.

### 4. İstatistikler + 5. Gelişmiş Detay Sayfası

Klinik detay sayfası artık (yorum varsa) şunları gösteriyor: istatistik özeti (Sprint 4'ün "Yakında" kartlarının yerini gerçek veri aldığında alıyor), puan dağılımı, artı/eksi, öne çıkan yorumlar.

**"Artı/eksi" nasıl hesaplanıyor (önemli, dürüst bir not):** Bu bir NLP/metin analizi değil — 6 kategori ortalamasının en yükseği "güçlü yön", en düşüğü "dikkat edilmesi gereken" olarak gösteriliyor. Yorum metnini yorumlamıyor, yalnızca sayısal kategori karşılaştırması yapıyor. Bu, açıklanabilir ve dürüst bir yöntem; sahte bir "AI özet" izlenimi vermekten kaçınıldı.

## Mimari tutarlılık

- Yeni repository metodu eklenmedi, var olanlar genişletildi (`ClinicRepository.getStats/rankByBranch/listBranches`, `ReviewRepository` puan alanları)
- Yeni bağımlılık **yok** (talimatla uyumlu) — `<details>` ve checkbox+GET-form teknikleri tamamen native HTML
- `ScoreBar`, `SectionLabel` gibi var olan/yeni paylaşılan bileşenler birden fazla sayfada tekrar kullanıldı
- Build/lint/typecheck temiz
