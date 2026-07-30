# Sprint 8 — AI Career Advisor

## En önemli mimari karar: neresi gerçekten "AI", neresi deterministik?

Görev tanımının kendisi "AI asla veri uydurmasın" diyordu — bunu ciddiye alarak, 9 bölümün **yalnızca ikisinde** gerçekten bir LLM çağrısı kullanıldı. Geri kalan her şey kasıtlı olarak deterministik:

| Bölüm | Yöntem | Neden |
|---|---|---|
| 1. Klinik Özeti | **LLM** (Anthropic) | Doğal dil üretimi gerektiren tek gerçek görev |
| 2. Karşılaştırma Özeti | **LLM** (Anthropic) | Aynı sebep |
| 3. Kariyer Eşleştirme (uyum puanı) | Deterministik formül | Bir LLM'in bir "uyum puanı" tahmin etmesi tam da önlenmek istenen türden bir uydurma olurdu |
| 4. İçgörüler (trend, sık konu, ortalama karşılaştırması) | Deterministik SQL/hesaplama | Gerçek, ölçülebilir veri; LLM'e ihtiyaç yok |
| 5. Konu Tespiti | Anahtar kelime sınıflandırıcı | Sıfır halüsinasyon riski, her zaman çalışır (API anahtarı olmasa bile) |
| 6. AI Dashboard | Deterministik SQL agregasyonları | "Bu ay en iyi/en çok gelişen" gibi somut, gerçek zaman aralıklı sorgular |

## Test yaklaşımı

- **Anthropic API'ye gerçek bir bağlantı testi** yapıldı (kimlik doğrulamasız istek → `401 x-api-key header is required`) — bu, uç nokta/istek şeklinin doğru olduğunu, yalnızca gerçek bir anahtarın eksik olduğunu kanıtlıyor. Gerçek üretimde `ANTHROPIC_API_KEY` tanımlandığında adapter olduğu gibi çalışır.
- **4 dashboard fonksiyonu gerçek Postgres'te, farklı tarihli test verisiyle test edildi**: 45 gün önce düşük puanlı, 10 gün önce yüksek puanlı iki review eklenerek "en çok gelişen" fonksiyonunun doğru şekilde 2.0→5.0 gelişimini bulduğu doğrulandı; "bu ayın en iyisi" yalnızca son 30 gündeki review'ı sayıyor (45 günlük olanı hariç tutuyor) — doğrulandı.
- **Konu sınıflandırıcısı** gerçek Türkçe örnek cümlelerle test edildi (doğru etiketleri buluyor).
- **Kariyer eşleştirme formülü** iki farklı aday profiliyle test edildi — akademik öncelikli aday ile dengeli aday arasında mantıklı, farklılaşan sonuçlar üretiyor.
- **`review_topics` RLS** gerçek Postgres'te test edildi: kendi review'una etiket ekleyebiliyor, başkasınınkine ekleyemiyor, herkes okuyabiliyor.
- 19 migration dosyasının tamamı sıfırdan doğrulandı.
- `tsc`/`lint`/`build` temiz.

**Yapılamayan:** gerçek bir API anahtarıyla uçtan uca özet üretimi (bu sandbox'ta anahtar yok). Mimari tam olarak hazır — gerçek bir `ANTHROPIC_API_KEY` eklendiğinde ek kod değişikliği gerekmez.

## Mimari (`src/lib/ai/`)

```
src/lib/ai/
  types.ts              — paylaşılan tipler, hata sınıfları (AiNotConfiguredError, InsufficientDataError)
  adapters/
    anthropic-adapter.ts        — gerçek Anthropic API çağrısı (LlmAdapter arayüzünü uygular)
    get-llm-adapter.ts          — fabrika: anahtar yoksa null döner (throw etmez)
    keyword-topic-classifier.ts — deterministik konu sınıflandırıcı
  prompts/
    clinic-summary-prompt.ts    — "asla uydurma" kısıtları gömülü sistem promptu
    comparison-prompt.ts
  services/
    clinic-summary-service.ts   — eşik kontrolü + adapter çağrısı + JSON ayrıştırma
    comparison-service.ts
    career-match-service.ts     — deterministik uyum puanlama (LLM YOK)
    insights-service.ts         — deterministik içgörü üretimi (LLM YOK)
```

**Sağlayıcı değiştirme:** `LlmAdapter` arayüzünü uygulayan yeni bir sınıf yazıp `get-llm-adapter.ts`'e bir dal eklemek yeterli — `services/` katmanı hiç değişmez.

## AI Safety uygulaması

- **Asgari veri eşiği:** klinik özeti için en az 3 yorumlu değerlendirme, karşılaştırma için her iki klinikte de en az 3. Altında **özet üretilmez**, neden açıkça gösterilir (`AiClinicSummaryCard`/`AiComparisonSummaryCard`, `unavailableReason` prop'u).
- **Yalnızca onaylı review'lar:** tüm AI/istatistik sorguları `status = 'approved'` filtresi kullanıyor (Sprint 7'nin moderasyon altyapısıyla tutarlı).
- **Prompt kısıtları:** sistem promptu açıkça "yalnızca verilen bilgiyi kullan, dışarıdan bilgi ekleme, uydurma, emin değilsen yazma" diyor; yanıt yapılandırılmış JSON olarak isteniyor (güvenilir ayrıştırma için).
- **Yapılandırılmamışsa çökme yok:** `getLlmAdapter()` `null` döner, servisler bunu `AiNotConfiguredError` olarak yukarı taşır, sayfa "AI şu an kullanılamıyor" gösterir — asla sayfa çökmez ya da sessizce boş kalmaz.

## Diğer notlar

- Konu sınıflandırması, review gönderildiğinde/düzenlendiğinde `ReviewRepository` içinde otomatik çalışır; başarısız olursa (nadir) sessizce yutulur — etiketleme "nice to have", review'ın kendisi kritik.
- Ana sayfadaki dashboard bölümleri, veri yoksa (küçük/yeni bir kurulumda beklenen durum) "Henüz yeterli veri yok" gösteriyor, boş bir tablo/hata değil.
- `/career-match`, JS gerektirmeyen bir GET formu (mevcut mimariyle tutarlı) — sonuçlar `matchCareerPreferences` ile saf, test edilebilir bir fonksiyonda hesaplanıyor.
