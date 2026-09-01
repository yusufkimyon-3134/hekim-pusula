import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const siteUrl = "https://www.hekimpusula.com.tr";
const siteTitle = "Hekim Pusula | Doktor Hastane Yorumları, TUS, YDUS ve DHY";
const siteDescription =
  "Doktorların hastane ve klinik deneyimlerini keşfedin. TUS, YDUS ve DHY tercihleri için nöbet düzeni, çalışma koşulları, eğitim, teşvik ve kurum ortamı hakkında hekim değerlendirmeleri.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Hekim Pusula",
  },
  description: siteDescription,
  alternates: { canonical: "/" },
  applicationName: "Hekim Pusula",
  category: "healthcare",
  keywords: [
    "Hekim Pusula",
    "doktor yorumları",
    "doktor hastane yorumları",
    "hekim değerlendirmeleri",
    "hastane yorumları",
    "TUS tercih",
    "YDUS tercih",
    "DHY tercih",
    "doktor hastane tercih",
    "hastane çalışma koşulları",
    "hekim deneyimleri",
    "mecburi hizmet hastane yorumları",
    "asistanlık hastane yorumları",
    "doktor nöbet sayısı",
    "hastane teşvik ödemesi",
  ],
  verification: {
    google: "aDKJk3oLTyzFNqf9xo3h5MxCEYiZT1k6MNA5Kmi0QC4",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteUrl,
    siteName: "Hekim Pusula",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Hekim Pusula",
  alternateName: "HekimPusula",
  url: siteUrl,
  description: siteDescription,
  inLanguage: "tr-TR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hekim Pusula",
  url: siteUrl,
  logo: `${siteUrl}/favicon.ico`,
  description: "Hekimlerin hastane ve klinik deneyimlerini paylaşabildiği tercih ve kurum keşif platformu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
