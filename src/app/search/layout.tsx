import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hastane ve Klinik Ara",
  description:
    "Türkiye'deki hastane ve klinikleri şehir, kurum türü ve branşa göre keşfedin. TUS, YDUS ve DHY tercihleri öncesinde kurumları Hekim Pusula'da inceleyin.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Hastane ve Klinik Ara | Hekim Pusula",
    description:
      "Hastane ve klinikleri şehir, kurum türü ve branşa göre keşfedin.",
    url: "/search",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
