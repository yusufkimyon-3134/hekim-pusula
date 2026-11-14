import { PublicReviewSummary } from "@/features/clinic/components/public-review-summary";
import { getPublicReviewSummaries } from "@/lib/repositories/public-review-summary";
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
    department: clinics.filter((clinic) => clinic.availabilityVerified).map((clinic) => ({ "@type": "MedicalClinic", name: clinic.branch, url: `${siteUrl}/clinic/${clinic.id}` })),
  };

  const publicSummaries = await getPublicReviewSummaries(clinics.map((clinic) => clinic.id));
  const hospitalSummary = { count: 0, lastVerifiedAt: null as string | null };
  for (const summary of publicSummaries?.values() ?? []) {
    hospitalSummary.count += summary.count;
    if (summary.lastVerifiedAt && (!hospitalSummary.lastVerifiedAt || Date.parse(summary.lastVerifiedAt) > Date.parse(hospitalSummary.lastVerifiedAt))) {
      hospitalSummary.lastVerifiedAt = summary.lastVerifiedAt;
    }
  }
  const clinicsByReviewCount = [...clinics].sort(
    (first, second) =>
      (publicSummaries?.get(second.id)?.count ?? 0) -
      (publicSummaries?.get(first.id)?.count ?? 0),
  );
  const verifiedClinics = clinicsByReviewCount.filter((clinic) => clinic.availabilityVerified);
  const unverifiedClinics = clinicsByReviewCount.filter((clinic) => !clinic.availabilityVerified);

  function renderClinicCards(branches: typeof clinics) {
    return (
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {branches.map((clinic) => (
          <ClinicCard
            key={clinic.id}
            branch={clinic.branch}
            href={`/clinic/${clinic.id}`}
            publicSummary={publicSummaries ? publicSummaries.get(clinic.id) ?? { count: 0, lastVerifiedAt: null } : undefined}
          />
        ))}
      </div>
    );
  }

  let isVerified = false;
  if (userData.user) {
    const doctor = await new DoctorRepository(supabase).findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }

  return (
    <Container className="py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <DetailPageHeader title={hospital.name} subtitle={`${hospital.district}, ${hospital.city}`} badgeLabel={HOSPITAL_TYPE_LABELS[hospital.hospitalType]} />

      {publicSummaries && (
        <div className="mt-4">
          <PublicReviewSummary summary={hospitalSummary} />
        </div>
      )}

      {verifiedClinics.length > 0 && (
        <section className="mt-8">
          <SectionLabel>Hizmet verdiği doğrulanmış klinikler ({verifiedClinics.length})</SectionLabel>
          {renderClinicCards(verifiedClinics)}
        </section>
      )}

      {unverifiedClinics.length > 0 && (
        <section className="mt-8">
          <SectionLabel>Branşlara göre hekim değerlendirmeleri</SectionLabel>
          {renderClinicCards(unverifiedClinics)}
          <p className="mt-3 text-sm text-muted-foreground">
            Güncel klinik ve kadro bilgisi için hastanenin resmî sitesine bakabilirsiniz.
          </p>
        </section>
      )}

      <div className="mt-8">
        {!userData.user ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted"><Lock className="size-5 text-muted-foreground" /></div>
            <div className="space-y-1.5"><p className="font-medium">Gerçek hekim deneyimleri doğrulanmış hekimlere özeldir</p><p className="mx-auto max-w-sm text-sm text-muted-foreground">Klinik sayfalarını inceleyebilir, yorumları görmek ve kendi deneyimini paylaşmak için ücretsiz hesap oluşturabilirsin.</p></div>
            <div className="flex flex-wrap justify-center gap-2"><Button asChild className="gap-2"><Link prefetch={false} href={`/login?redirectTo=${encodeURIComponent(`/hospital/${id}`)}`}><LogIn className="size-4" />Giriş yap</Link></Button><Button asChild variant="outline" className="gap-2"><Link prefetch={false} href={`/register?next=${encodeURIComponent(`/hospital/${id}`)}`}><UserPlus className="size-4" />Kayıt ol</Link></Button></div>
          </CardContent></Card>
        ) : !isVerified ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Clock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim doğrulaması gerekiyor</p><p className="mx-auto max-w-sm text-sm text-muted-foreground">Yorumları görmek ve deneyim paylaşmak için hekim doğrulamanı tamamla.</p></div><Button asChild variant="outline"><Link prefetch={false} href={`/profile?redirectTo=${encodeURIComponent(`/hospital/${id}`)}`}>Doğrulama durumumu gör</Link></Button></CardContent></Card>
        ) : null}
      </div>
    </Container>
  );
}
