# Hekim Pusula — PRD (Product Requirements Document)

## 1. Problem

Türkiye'de hekimler (Devlet Hizmeti Yükümlülüğü kurası, uzmanlık/yan dal kurası, ya da naklen/puanla iller arası atama yoluyla) bir kuruma atanırken, o kurumun gerçek çalışma koşulları hakkında güvenilir bilgiye sahip olmadan tercih yapıyor: nöbet yükü, yönetim tavrı, lojman durumu, ulaşım, sosyal imkanlar gibi bilgiler dağınık biçimde (WhatsApp grupları, tanıdık zinciri) dolaşıyor, merkezi ve aranabilir bir kaynak yok.

## 2. Çözüm

Hekimlerin, çalıştıkları veya çalışmış oldukları kurumlar hakkında anonim deneyim paylaştığı, kategori bazlı puanladığı ve isteğe bağlı olarak o kurumdaki aktif bir hekimle anonim şekilde iletişime geçebildiği bir platform.

## 3. Hedef kitle

- Pratisyen hekimler (ilk DHY ataması öncesi)
- Uzman / yan dal hekimleri (uzmanlık sonrası DHY veya yan dal ataması)
- Naklen/puanla il değiştirmeyi düşünen hekimler

## 4. Temel özellikler (ürün genel kapsamı — sprint bazlı önceliklendirme ROADMAP.md'de)

1. **Kurum arama ve keşif** — il/ilçe/branşa göre arama, kurum profili
2. **Kategori bazlı puanlama** — nöbet yükü, yönetim tutumu, ulaşım, sosyal imkan, iş yükü
3. **Anonim deneyim paylaşımı (yorumlar)** — "aktif çalışıyor" / "önceden çalıştı" rozetiyle
4. **Hekim kimliği doğrulama** — diploma/TTB no belgesi + SGK hizmet dökümü ile kurum bağlama
5. **Aktif hekimle anonim iletişim** — talep gönderme, kabul/red, anonim sohbet
6. **Katkı teşviki** — tam yorumları görmek için en az bir deneyim paylaşma şartı (ilk göreve gidenler muaf)
7. **Atama türü etiketi** — DHY / ilk-yeniden atama / naklen / yan dal, yorumların bağlamını gösterir
8. **Moderasyon** — kişiye yönelik hakaret/iftira yasak, sistem/kurum eleştirisi serbest

## 5. Kapsam dışı (bu doküman kapsamında netleştirilmemiş)

- Ödeme/gelir modeli
- TTB veya Sağlık Bakanlığı ile resmi işbirliği
- Yasal/KVKK nihai incelemesi (hukuki danışmanlık gerektirir)

## 6. Tasarım prensipleri

- **Anonimlik esas.** Kullanıcılar birbirine sadece rozetle (unvan, branş, aktif/eski durum) görünür, isim veya iletişim bilgisi paylaşılmaz.
- **Ton: rehberlik, yargılama değil.** Marka ismi ve dili buna göre seçildi ("Pusula" — yol gösterici).
- **Karşılıklılık üzerinden katılım.** Parasal teşvik yerine "ver-gör" mekaniği kullanılır; bu, yorum güvenilirliğini bozmadan katılımı artırır.

## 7. Sprint 1 kapsamı (bu proje iskeleti)

Bu doküman, projenin genel ürün vizyonunu anlatır. **Sprint 1'de yalnızca teknik temel (proje iskeleti, sayfa placeholder'ları, tasarım sistemi) kurulmuştur — kimlik doğrulama, yorum/puanlama, iletişim ve moderasyon gibi özellikler henüz implemente edilmemiştir.** Detaylar için bkz. `ROADMAP.md`.
