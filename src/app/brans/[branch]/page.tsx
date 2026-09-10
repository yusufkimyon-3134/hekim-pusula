import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Stethoscope } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";

const siteUrl = "https://www.hekimpusula.com.tr";

async function getClinics(branch: string, city?: string) {
  const supabase = await createClient();
  return new ClinicRepository(supabase).search({ query: branch, city });
}

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }): Promise<Metadata> {
  const { branch } = await params;
  const clinics = await getClinics(branch);
  const exact = clinics.filter((clinic) => clinic.branch === branch);
  if (exact.length === 0) return { title: "Branş bulunamadı", robots: { index: false, follow: false } };
  const title = `${branch} Hastane Yorumları ve Çalışma Koşulları`;
  const description = `${branch} klinikleri için hekim deneyimlerini keşfet. Hastaneleri nöbet, eğitim, yönetim, teşvik ve çalışma koşulları açısından araştır; TUS, YDUS ve DHY tercihleri öncesi bilgi edin.`;
  const canonical = `${siteUrl}/brans/${encodeURIComponent(branch)}`;
  return { title, description, alternates: { canonical }, openGraph: { type: "website", url: canonical, title: `${title} | Hekim Pusula`, description, siteName: "Hekim Pusula", locale: "tr_TR" } };
}

export default async function BranchPage({ params, searchParams }: { params: Promise<{ branch: string }>; searchParams: Promise<{ city?: string }> }) {
  const { branch } = await params;
  const { city } = await searchParams;
  const clinics = (await getClinics(branch, city)).filter((clinic) => clinic.branch === branch);
  if (clinics.length === 0 && !city) notFound();
  const cities = Array.from(new Set((await getClinics(branch)).filter((clinic) => clinic.branch === branch).map((clinic) => clinic.hospitalCity))).sort((a, b) => a.localeCompare(b, "tr"));

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl space-y-10">
        <header className="space-y-3"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Stethoscope className="size-4" /> Branş rehberi</div><h1 className="text-3xl font-bold tracking-tight">{city ? `${city} ${branch}` : branch} hastane yorumları</h1><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{branch} alanında hastane ve klinik çalışma koşullarını araştır. Nöbet düzeni, eğitim ortamı, yönetim, teşvik ve iş yükü hakkındaki gerçek hekim deneyimleri tercih öncesinde yol gösterir.</p></header>

        {!city && cities.length > 0 && <section className="space-y-3"><h2 className="font-semibold">Şehre göre {branch}</h2><div className="flex flex-wrap gap-2">{cities.map((item) => <Link key={item} href={`/sehir/${encodeURIComponent(item)}`} className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary/40">{item}</Link>)}</div></section>}

        <section className="space-y-4"><div><h2 className="text-xl font-semibold">{city ? `${city} klinikleri` : "Klinikler"}</h2><p className="mt-1 text-sm text-muted-foreground">{clinics.length} klinik listeleniyor.</p></div>{clinics.length ? <div className="space-y-3">{clinics.map((clinic) => <Link key={clinic.clinicId} href={`/clinic/${clinic.clinicId}`} className="block"><Card className="transition-colors hover:border-primary/40"><CardContent className="flex gap-3 p-4"><div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-muted"><Building2 className="size-4" /></div><div><p className="font-medium">{clinic.hospitalName}</p><p className="mt-1 text-sm text-muted-foreground">{clinic.branch} · {clinic.hospitalDistrict}, {clinic.hospitalCity}</p></div></CardContent></Card></Link>)}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Bu şehirde bu branş için kayıtlı klinik bulunamadı.</p>}</section>

        <section className="rounded-lg border bg-muted/30 p-5"><h2 className="font-semibold">{branch} tercihi yaparken</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Kurum adının yanında klinik deneyimine de bakmak önemlidir. Hekim Pusula&apos;da değerlendirmeler klinik bazında tutulur; böylece aynı hastanedeki farklı branşların nöbet, eğitim, yönetim ve çalışma ortamı birbirinden ayrı değerlendirilebilir. Bu branşta çalıştıysan ilgili kliniğe girerek kendi deneyimini de paylaşabilirsin.</p></section>
      </div>
    </Container>
  );
}
