import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hastane ve Klinik Karşılaştırma",
  description:
    "Hastane ve klinikleri çalışma koşulları ve hekim deneyimleri açısından karşılaştırın. Tercih döneminde kurumları yan yana değerlendirin.",
  alternates: {
    canonical: "/compare",
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
