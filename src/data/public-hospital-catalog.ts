export type PublicHospitalCatalogItem = {
  name: string;
  city: string;
  district: string;
  href?: string;
};

/**
 * Ana sayfadaki typeahead icin hafif, public kurum katalogu.
 *
 * Bu liste bir guvenlik siniri degildir: sadece kurum adi/konum gibi zaten
 * public kesif verisini istemcide hizli gostermek icindir. Yorum metinleri,
 * puanlar ve kullanici verileri burada YOKTUR. Supabase/API erisilebilir
 * oldugunda canli sonuc bu katalogu zenginlestirir; erisilemezse typeahead
 * yine calisir.
 */
export const PUBLIC_HOSPITAL_CATALOG: PublicHospitalCatalogItem[] = [
  { name: "Adana Şehir Hastanesi", city: "Adana", district: "Çukurova", href: "/hospital/10000000-0000-0000-0000-000000000011" },
  { name: "Ankara Eğitim ve Araştırma Hastanesi", city: "Ankara", district: "Altındağ", href: "/hospital/10000000-0000-0000-0000-000000000005" },
  { name: "Ankara Şehir Hastanesi", city: "Ankara", district: "Çankaya", href: "/hospital/10000000-0000-0000-0000-000000000004" },
  { name: "Antalya Eğitim ve Araştırma Hastanesi", city: "Antalya", district: "Kepez", href: "/hospital/10000000-0000-0000-0000-000000000010" },
  { name: "Bursa Devlet Hastanesi", city: "Bursa", district: "Osmangazi", href: "/hospital/10000000-0000-0000-0000-000000000008" },
  { name: "Bursa Eğitim ve Araştırma Hastanesi", city: "Bursa", district: "Yıldırım", href: "/hospital/10000000-0000-0000-0000-000000000009" },
  { name: "Gaziantep Üniversitesi Şahinbey Hastanesi", city: "Gaziantep", district: "Şahinbey", href: "/hospital/10000000-0000-0000-0000-000000000013" },
  { name: "Hatay Devlet Hastanesi", city: "Hatay", district: "Antakya", href: "/hospital/10000000-0000-0000-0000-000000000017" },
  { name: "İstanbul Eğitim ve Araştırma Hastanesi", city: "İstanbul", district: "Fatih", href: "/hospital/10000000-0000-0000-0000-000000000002" },
  { name: "İstanbul Şehir Hastanesi", city: "İstanbul", district: "Başakşehir", href: "/hospital/10000000-0000-0000-0000-000000000001" },
  { name: "İstanbul Üniversitesi Tıp Fakültesi Hastanesi", city: "İstanbul", district: "Fatih", href: "/hospital/10000000-0000-0000-0000-000000000003" },
  { name: "İzmir Devlet Hastanesi", city: "İzmir", district: "Konak", href: "/hospital/10000000-0000-0000-0000-000000000007" },
  { name: "İzmir Şehir Hastanesi", city: "İzmir", district: "Bayraklı", href: "/hospital/10000000-0000-0000-0000-000000000006" },
  { name: "Kayseri Şehir Hastanesi", city: "Kayseri", district: "Kocasinan", href: "/hospital/10000000-0000-0000-0000-000000000015" },
  { name: "Kocaeli Devlet Hastanesi", city: "Kocaeli", district: "İzmit", href: "/hospital/10000000-0000-0000-0000-000000000020" },
  { name: "Konya Eğitim ve Araştırma Hastanesi", city: "Konya", district: "Meram", href: "/hospital/10000000-0000-0000-0000-000000000012" },
  { name: "Mersin Şehir Hastanesi", city: "Mersin", district: "Toroslar", href: "/hospital/10000000-0000-0000-0000-000000000016" },
  { name: "Şanlıurfa Eğitim ve Araştırma Hastanesi", city: "Şanlıurfa", district: "Haliliye", href: "/hospital/10000000-0000-0000-0000-000000000014" },
  { name: "Trabzon Kanuni Eğitim ve Araştırma Hastanesi", city: "Trabzon", district: "Ortahisar", href: "/hospital/10000000-0000-0000-0000-000000000019" },
  { name: "Van Eğitim ve Araştırma Hastanesi", city: "Van", district: "İpekyolu", href: "/hospital/10000000-0000-0000-0000-000000000018" },

  { name: "Altınözü Devlet Hastanesi", city: "Hatay", district: "Altınözü" },
  { name: "Arsuz Devlet Hastanesi", city: "Hatay", district: "Arsuz" },
  { name: "Belen Devlet Hastanesi", city: "Hatay", district: "Belen" },
  { name: "Defne Devlet Hastanesi", city: "Hatay", district: "Defne" },
  { name: "Dörtyol Devlet Hastanesi", city: "Hatay", district: "Dörtyol" },
  { name: "Erzin Devlet Hastanesi", city: "Hatay", district: "Erzin" },
  { name: "Hatay Eğitim ve Araştırma Hastanesi", city: "Hatay", district: "Antakya" },
  { name: "Hassa Devlet Hastanesi", city: "Hatay", district: "Hassa" },
  { name: "İskenderun Devlet Hastanesi", city: "Hatay", district: "İskenderun" },
  { name: "Kırıkhan Devlet Hastanesi", city: "Hatay", district: "Kırıkhan" },
  { name: "Kumlu Devlet Hastanesi", city: "Hatay", district: "Kumlu" },
  { name: "Reyhanlı Devlet Hastanesi", city: "Hatay", district: "Reyhanlı" },
  { name: "Samandağ Devlet Hastanesi", city: "Hatay", district: "Samandağ" },
  { name: "Yayladağı Devlet Hastanesi", city: "Hatay", district: "Yayladağı" },

  { name: "Şırnak Devlet Hastanesi", city: "Şırnak", district: "Merkez" },
  { name: "Şırnak Şehit Aydoğan Aydın Devlet Hastanesi", city: "Şırnak", district: "Merkez" },
  { name: "Cizre Dr. Selahattin Cizrelioğlu Devlet Hastanesi", city: "Şırnak", district: "Cizre" },
  { name: "Silopi Devlet Hastanesi", city: "Şırnak", district: "Silopi" },
  { name: "İdil Devlet Hastanesi", city: "Şırnak", district: "İdil" },
  { name: "Uludere Devlet Hastanesi", city: "Şırnak", district: "Uludere" },
  { name: "Beytüşşebap Devlet Hastanesi", city: "Şırnak", district: "Beytüşşebap" },
  { name: "Güçlükonak Entegre İlçe Devlet Hastanesi", city: "Şırnak", district: "Güçlükonak" },
];

const trLower = (value: string) => value.toLocaleLowerCase("tr-TR");

export function findPublicHospitalMatches(query: string, limit = 8) {
  const needle = trLower(query.trim());
  if (needle.length < 2) return [];

  return PUBLIC_HOSPITAL_CATALOG
    .filter((item) =>
      [item.name, item.city, item.district].some((value) => trLower(value).includes(needle))
    )
    .sort((a, b) => {
      const aName = trLower(a.name);
      const bName = trLower(b.name);
      const aStarts = aName.startsWith(needle) ? 0 : 1;
      const bStarts = bName.startsWith(needle) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name, "tr-TR");
    })
    .slice(0, limit);
}
