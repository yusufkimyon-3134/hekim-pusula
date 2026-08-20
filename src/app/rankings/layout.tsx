import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hastane ve Klinik Sıralamaları",
  description:
    "Hekim deneyimlerine dayalı hastane ve klinik sıralamalarını inceleyin. TUS, YDUS ve DHY tercihleri öncesinde kurumları karşılaştırın.",
  alternates: {
    canonical: "/rankings",
  },
  openGraph: {
    title: "Hastane ve Klinik Sıralamaları | Hekim Pusula",
    description:
      "Hekim deneyimlerine dayalı hastane ve klinik sıralamalarını inceleyin.",
    url: "/rankings",
  },
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
