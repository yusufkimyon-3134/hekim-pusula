import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";

const siteUrl = "https://www.hekimpusula.com.tr";

async function getCityData(city: string) {
  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const clinicRepository = new ClinicRepository(supabase);
  const [hospitals, clinics] = await Promise.all([
    hospitalRepository.search({ city }),
    clinicRepository.search({ city }),
  ]);
  return { hospitals, clinics };
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const { hospitals } = await getCityData(city);
  if (hospitals.length === 0) return { title: "Şehir bulunamadı", robots: { index: false, follow: false } };
  const title = `${city} Hastane Yorumları ve Doktor Çalışma Koşulları`;
  const description = `${city} hastaneleri ve klinikleri için hekim deneyimlerini keşfet. Nöbet, eğitim, yönetim, teşvik ve çalışma koşulları hakkında bilgi edin; TUS, YDUS ve DHY tercihi öncesi kurumları karşılaştır.`;
  const canonical = `${siteUrl}/sehir/${encodeURIComponent(city)}`;
  return { title, description, alternates: { canonical }, openGraph: { type: "website", url: canonical, title: `${title} | Hekim Pusula`, description, siteName: "Hekim Pusula", locale: "tr_TR" } };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const { hospitals, clinics } = await getCityData(city);
  if (hospitals.length === 0) notFound();
  const branches = Array.from(new Set(clinics.map((clinic) => clinic.branch))).sort((a, b) => a.localeCompare(b, "tr"));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${city} Hastaneleri ve Hekim Deneyimleri`,
    url: `${siteUrl}/sehir/${encodeURIComponent(city)}`,
    about: { "@type": "City", name: city },
  };

  return (
    <Container className="py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" /> Şehir rehberi</div>
          <h1 className="text-3xl font-bold tracking-tight">{city} hastane yorumları ve çalışma koşulları</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{city} ilindeki hastane ve klinikleri keşfet. Hekimlerin nöbet düzeni, eğitim ortamı, yönetim, teşvik ve günlük çalışma koşulları hakkındaki deneyimleri TUS, YDUS ve DHY tercihleri öncesinde yol gösterir.</p>
        </header>

        <section className="space-y-4">
          <div><h2 className="text-xl font-semibold">{city} hastaneleri</h2><p className="mt-1 text-sm text-muted-foreground">{hospitals.length} kurum listeleniyor.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {hospitals.map((hospital) => (
              <Link key={hospital.id} href={`/hospital/${hospital.id}`} className="block">
                <Card className="h-full transition-colors hover:border-primary/40"><CardContent className="flex gap-3 p-4"><div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"><Building2 className="size-4" /></div><div><p className="font-medium leading-5">{hospital.name}</p><p className="mt-1 text-xs text-muted-foreground">{hospital.district}, {hospital.city}</p></div></CardContent></Card>
              </Link>
            ))}
          </div>
        </section>

        {branches.length > 0 && <section className="space-y-4"><div><h2 className="text-xl font-semibold">{city} branşları</h2><p className="mt-1 text-sm text-muted-foreground">Branşa göre klinikleri ve çalışma deneyimlerini incele.</p></div><div className="flex flex-wrap gap-2">{branches.slice(0, 40).map((branch) => <Button key={branch} asChild variant="outline" size="sm"><Link href={`/brans/${encodeURIComponent(branch)}?city=${encodeURIComponent(city)}`}>{branch}</Link></Button>)}</div></section>}

        <section className="rounded-lg border bg-muted/30 p-5"><h2 className="font-semibold">{city} için gerçek hekim deneyimleri</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Bir kurumda çalıştıysan ilgili klinik sayfasından deneyimini paylaşabilirsin. Yorumların içeriği yalnızca doğrulanmış hekimlere gösterilir; kurum ve klinik sayfaları ise tercih araştırması yapan hekimlerin Google üzerinden keşfedebilmesi için herkese açıktır.</p></section>
      </div>
    </Container>
  );
}
