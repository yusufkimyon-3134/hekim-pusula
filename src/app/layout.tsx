import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://hekimpusula.com.tr"),
  title: {
    default: "Hekim Pusula | Doktorlar İçin Hastane ve Klinik Deneyimleri",
    template: "%s | Hekim Pusula",
  },
  description:
    "Hekimlerin hastane ve klinik deneyimlerini keşfedin. TUS, YDUS ve DHY tercihleri öncesinde kurumlar, branşlar, nöbet düzeni ve çalışma koşulları hakkında hekim deneyimlerine ulaşın.",
  applicationName: "Hekim Pusula",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://hekimpusula.com.tr",
    siteName: "Hekim Pusula",
    title: "Hekim Pusula | Doktorlar İçin Hastane ve Klinik Deneyimleri",
    description:
      "TUS, YDUS ve DHY tercihleri öncesinde hastane ve klinikler hakkında gerçek hekim deneyimlerini keşfedin.",
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
