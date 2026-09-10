import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, LogIn, UserPlus, Clock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { SectionLabel } from "@/components/section-label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClinicCard } from "@/features/clinic/components/clinic-card";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";

const siteUrl = "https://www.hekimpusula.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const hospital = await new HospitalRepository(supabase).findById(id);
  if (!hospital) return { title: "Hastane bulunamadı", robots: { index: false, follow: false } };

  const title = `${hospital.name} Yorumları ve Çalışma Koşulları`;
  const description = `${hospital.name} (${hospital.district}, ${hospital.city}) klinikleri, hekim deneyimleri, çalışma koşulları, nöbet düzeni, eğitim ortamı ve TUS, YDUS, DHY tercihleri öncesi kurum bilgileri.`;
  const canonical = `${siteUrl}/hospital/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: `${title} | Hekim Pusula`, description, siteName: "Hekim Pusula", locale: "tr_TR" },
  };
}

export const revalidate = 3600;

export default async function HospitalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const clinicRepository = new ClinicRepository(supabase);

  const [hospital, clinics, { data: userData }] = await Promise.all([
    hospitalRepository.findById(id),
    clinicRepository.findByHospitalId(id),
    supabase.auth.getUser(),
  ]);
  if (!hospital) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: hospital.name,
    address: { "@type": "PostalAddress", addressLocality: hospital.district, addressRegion: hospital.city, addressCountry: "TR" },
    url: `${siteUrl}/hospital/${id}`,
    department: clinics.map((clinic) => ({ "@type": "MedicalClinic", name: clinic.branch, url: `${siteUrl}/clinic/${clinic.id}` })),
  };

  let isVerified = false;
  if (userData.user) {
    const doctor = await new DoctorRepository(supabase).findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }

  return (
    <Container className="py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <DetailPageHeader title={hospital.name} subtitle={`${hospital.district}, ${hospital.city}`} badgeLabel={HOSPITAL_TYPE_LABELS[hospital.hospitalType]} />

      <section className="mt-6 rounded-lg border bg-muted/30 p-5">
        <h2 className="font-semibold">{hospital.name} çalışma deneyimleri</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hospital.city} ilindeki {hospital.name} için kliniklere göre hekim deneyimlerini keşfet. Nöbet düzeni, eğitim ortamı, yönetim, teşvik ve günlük çalışma koşulları TUS, YDUS ve DHY tercihleri öncesinde en çok merak edilen başlıklardır.
        </p>
      </section>

      <section className="mt-8">
        <SectionLabel>Klinikler ({clinics.length})</SectionLabel>
        {clinics.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Bu hastane için henüz kayıtlı klinik yok.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {clinics.map((clinic) => <ClinicCard key={clinic.id} branch={clinic.branch} href={`/clinic/${clinic.id}`} />)}
          </div>
        )}
      </section>

      <div className="mt-8">
        {!userData.user ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Lock className="size-5 text-muted-foreground" /></div>
            <div className="space-y-1.5"><p className="font-medium">Gerçek hekim deneyimleri doğrulanmış hekimlere özeldir</p><p className="mx-auto max-w-sm text-sm text-muted-foreground">Klinik sayfalarını inceleyebilir, yorumları görmek ve kendi deneyimini paylaşmak için ücretsiz hesap oluşturabilirsin.</p></div>
            <div className="flex flex-wrap justify-center gap-2"><Button asChild className="gap-2"><Link href={`/login?redirectTo=${encodeURIComponent(`/hospital/${id}`)}`}><LogIn className="size-4" />Giriş yap</Link></Button><Button asChild variant="outline" className="gap-2"><Link href={`/register?next=${encodeURIComponent(`/hospital/${id}`)}`}><UserPlus className="size-4" />Kayıt ol</Link></Button></div>
          </CardContent></Card>
        ) : !isVerified ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Clock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim doğrulaması gerekiyor</p><p className="mx-auto max-w-sm text-sm text-muted-foreground">Yorumları görmek ve deneyim paylaşmak için hekim doğrulamanı tamamla.</p></div><Button asChild variant="outline"><Link href="/profile">Doğrulama durumumu gör</Link></Button></CardContent></Card>
        ) : null}
      </div>
    </Container>
  );
}
