# Sprint 4 — Premium Clinic Detail Experience

## Kapsam

Bu sprint yalnızca klinik detay sayfasının **tasarımı ve algısı** üzerineydi — yeni bir özellik (kimlik doğrulama, yorum yazma, puanlama, favoriler, admin paneli) eklenmedi. Amaç: bir hekim sayfayı açtığında anında "bu platform ciddi ve güvenilir" hissetmesi.

## Tasarım kararları

### Neden tek sütun, `max-w-2xl`, bol boşluk

Sayfa bilinçli olarak dar ve dikey akışlı tutuldu (geniş bir grid/dashboard değil). Bunun sebebi: bu sayfa henüz bir "veri paneli" değil, bir **vaat** sunuyor ("burada ileride ne bulacaksın"). Editoryal/dergi tarzı dar bir sütun, geniş bir dashboard'dan daha "düşünceli, kürate edilmiş" hissettiriyor — ki marka için istenen izlenim tam olarak bu.

### Hiyerarşi: Klinik adı > Hastane adı > Konum

Hero'da en büyük/en belirgin öğe **klinik adı** (örn. "Kardiyoloji"), hemen üstünde hastaneye dönüş linki, altında konum bilgisi var. Bunun mantığı: kullanıcı bu sayfaya zaten belirli bir kliniği merak ettiği için geliyor (arama sonucundan ya da hastane sayfasından tıklayarak) — "neye baktığını" en büyük puntoyla, "nerede olduğunu" ikincil bilgi olarak göstermek, sayfanın kendi kendini anında açıklamasını sağlıyor (talep edilen "UX: neredeyse hiç açıklamaya ihtiyaç duymamalı" hedefi).

### İmza öğesi: "Zaman çizelgesi" boş durumu

Jenerik bir "veri yok" kutusu yerine, kesikli dikey çizgi + tek bir "hayalet" düğüm ile tasarlanan boş zaman çizelgesi bu sayfanın akılda kalan tek özgün detayı. Amaç: "burada henüz bir şey yok" değil, "burada bir şey birikmeye başlayacak" hissi vermek — ürünün genel "pusula/yol gösterici, henüz erken ama ciddi" konumlandırmasıyla tutarlı.

### Renk ve tipografi

Yeni bir palet eklenmedi — Sprint 1'den beri var olan marka token'ları (`--primary` petrol, `--accent` amber tonu, `--card`, `--border` vb.) kullanıldı. Yeni eklenen tek şey `Badge`'e **`soft`** varyantı (`bg-accent`/`text-accent-foreground`) — "Yakında" etiketleri ve ikon arka planları için; bu, var olan amber accent'i "bekleyen/gelecek" anlamıyla tutarlı biçimde yeniden kullanıyor.

Tipografi ölçeği: hero başlığı `text-3xl`/`sm:text-4xl` `font-semibold`, bölüm etiketleri küçük harf aralıklı `uppercase text-xs tracking-wide text-muted-foreground` (bkz. `SectionLabel` — aşağıda), gövde metni `text-muted-foreground` ile ikincil bilgi olarak ayrıştırıldı.

### İkonografi

`lucide-react` (zaten kurulu bağımlılık) ile her "yakında" kartına tek, anlamlı bir ikon verildi (nöbet için takvim, hasta yoğunluğu için kullanıcı grubu, servis için yatak, ek ödeme için banknot, yönetim için kontrol listesi, ortam için bina). İkonlar amber tonlu yuvarlak bir rozet içinde — dekoratif değil, her biri kartın konusunu doğrudan temsil ediyor.

### Karanlık mod uyumluluğu

Hiçbir yeni bileşen ham renk (hex/rgb) kullanmıyor — hepsi `bg-card`, `text-muted-foreground`, `border-border` gibi semantik Tailwind/CSS-değişken token'ları üzerinden çalışıyor. `globals.css`'teki `.dark` bloğu (Sprint 1'den beri var) bu token'ları zaten karşılıyor. **Not:** bu sprint'te bir karanlık mod açma/kapama arayüzü (toggle) eklenmedi — bu talep edilmemişti; yalnızca "uyumlu" olması istendi, ki mevcut token disiplini bunu zaten sağlıyor.

## UX kararları

- **Devre dışı buton, gizlenmiş değil:** "Deneyimini Paylaş" butonu `disabled` durumda gösteriliyor (yok sayılmıyor) — bu, kullanıcıya "bu özellik var olacak, henüz açık değil" mesajını, butonu tamamen kaldırmaktan daha net veriyor.
- **"Yakında" rozeti her kartta tekrarlanıyor:** kullanıcı listeyi yarıda kesip okumaya başlasa bile her kartın kendi başına "bu henüz aktif değil" dediği net olsun diye.
- **Boş durumların hiçbiri özür dilemiyor** ("maalesef", "üzgünüz" gibi ifadeler yok) — nötr, ileriye dönük bir ton kullanıldı (bkz. `frontend-design` prensipleri: "Errors don't apologize").

## Bileşen yapısı

Yeni bileşenler `src/features/clinic/components/` altında (mevcut ölçeklenebilir mimariye uygun):

| Bileşen | Sorumluluk |
|---|---|
| `ClinicHero` | Geri linki, klinik adı, hastane türü rozeti, konum |
| `ClinicIntro` | Tanıtım paragrafı (statik metin) |
| `ShareExperienceEmptyState` | "Henüz deneyim yok" + devre dışı CTA |
| `UpcomingInfoGrid` | 6 "yakında" kartı, veri odaklı bir dizi üzerinden render ediliyor (kart içeriği kopyala-yapıştır değil, `UPCOMING_INFO_ITEMS` dizisi map'leniyor) |
| `ExperienceTimeline` | İmza öğesi: boş zaman çizelgesi |

### Refactor: `SectionLabel`

Arama, hastane detay ve klinik detay sayfalarında birebir aynı "küçük harf aralıklı başlık" class'ı üç yerde tekrarlanıyordu. Bu sprintte ortak bir `SectionLabel` bileşenine (`src/components/section-label.tsx`) çıkarıldı ve her üç sayfada da kullanıldı — Sprint 1 CTO incelemesindeki "tekrarı ortak bileşene çıkar" prensibiyle tutarlı.

`DetailPageHeader` (Sprint 1) bilinçli olarak klinik sayfasında **kullanılmadı**: klinik hero'sunun tasarımı (geri linki + büyük başlık + rozet + konum satırı) artık hastane sayfasınınkinden yeterince farklı ki ortak bileşene zorlamak yapaylaşırdı. Hastane detay sayfası `DetailPageHeader`'ı kullanmaya devam ediyor, değişmedi.

## Test yaklaşımı

Bu sprint saf sunum katmanı (statik/placeholder içerik, Supabase sorgusu yok) olduğu için veritabanı testi gerekmedi. Doğrulama: `tsc --noEmit`, `next lint`, `npm run build` — hepsi temiz. Bu sandbox'ta canlı bir tarayıcı/ekran görüntüsü alma imkanı olmadığı için görsel doğrulama koddan ve Tailwind sınıflarının mantığından yapıldı; ekibin `npm run dev` ile gerçek tarayıcıda gözden geçirmesi önerilir.
