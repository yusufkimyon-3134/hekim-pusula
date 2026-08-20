import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const siteUrl = "https://www.hekimpusula.com.tr";
const siteTitle = "Hekim Pusula | TUS, YDUS ve DHY İçin Hastane Deneyimleri";
const siteDescription =
  "TUS, YDUS ve DHY tercihleri öncesinde hastane ve klinikleri hekim deneyimleriyle keşfedin. Nöbet düzeni, çalışma koşulları, eğitim ve kurum ortamı hakkında bilgi edinin.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Hekim Pusula",
  },
  description: siteDescription,
  applicationName: "Hekim Pusula",
  category: "healthcare",
  keywords: [
    "Hekim Pusula",
    "TUS tercih",
    "YDUS tercih",
    "DHY tercih",
    "doktor hastane yorumları",
    "hastane çalışma koşulları",
    "hekim deneyimleri",
    "mecburi hizmet hastane yorumları",
    "asistanlık hastane yorumları",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
