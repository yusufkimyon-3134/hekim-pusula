HEKIM PUSULA - PRATISYEN HEKIM GOREVI

Bu paket, devlet, sehir ve egitim-arastirma hastanelerine
"Pratisyen Hekim Gorevi" adinda ayri bir degerlendirme birimi ekler.

1) ZIP'i acin.
2) Icindeki src ve supabase klasorlerini proje klasorunuzun ustune kopyalayin:
   C:\HekimPusula\hekim-pusula
   Windows sorarsa dosyalari degistirmeyi kabul edin.

3) VS Code terminalinde sirasiyla calistirin:

   npx.cmd supabase db push
   npm.cmd run build

4) Ikisi de basariliysa, Vercel'e gondermek icin:

   git add src/app/hospital/[id]/page.tsx supabase/migrations/20260101000027_add_pratisyen_hekim_gorevi.sql
   git commit -m "Pratisyen hekim gorevi ekle"
   git push origin HEAD:main

Sonuc:
- Hastane sayfasinda "Pratisyen Hekim Gorevi" en ustte gorunur.
- Oraya giren doktorlar DHY/pratisyen deneyimlerini ayri yazabilir.
- Yeni veri en gec bir dakika icinde gorunur.

Not: Ilk asamada mevcut genel degerlendirme formu kullanilir. Pratisyene ozel
nobet/112-acil/yatan hasta gibi form alanlarini ikinci adimda ekleyecegiz.
