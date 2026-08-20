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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const hospital = await new HospitalRepository(supabase).findById(id);

  if (!hospital) {
    return {
      title: "Hastane bulunamadı",
      robots: { index: false, follow: false },
    };
  }

  const title = `${hospital.name} Yorumları ve Çalışma Koşulları`;
  const description = `${hospital.name} (${hospital.district}, ${hospital.city}) için hekim deneyimleri, klinikler, çalışma koşulları, nöbet düzeni ve TUS, YDUS, DHY tercihleri öncesi kurum bilgileri.`;
  const canonical = `${siteUrl}/hospital/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${title} | Hekim Pusula`,
      description,
      siteName: "Hekim Pusula",
      locale: "tr_TR",
    },
  };
}

export const revalidate = 3600;

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);

  const hospital = await hospitalRepository.findById(id);
  if (!hospital) {
    notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Hospital",
    name: hospital.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: hospital.district,
      addressRegion: hospital.city,
      addressCountry: "TR",
    },
    url: `${siteUrl}/hospital/${id}`,
  };

  const { data: userData } = await supabase.auth.getUser();

  let isVerified = false;
  if (userData.user) {
    const doctorRepository = new DoctorRepository(supabase);
    const doctor = await doctorRepository.findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }

  return (
    <Container className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />

      <DetailPageHeader
        title={hospital.name}
        subtitle={`${hospital.district}, ${hospital.city}`}
        badgeLabel={HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
      />

      <div className="mt-8">
        {!userData.user ? (
          <>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
              <p className="text-sm font-medium text-yellow-900">
                ⚠️ Yorumları görmek için giriş yapmalısınız
              </p>
              <p className="mt-1 text-xs text-yellow-800">
                Doktor değerlendirmelerini ve çalışma deneyimlerini görmek için lütfen giriş yapın veya kayıt olun.
              </p>
            </div>
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Lock className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-medium">Hekim değerlendirmeleri üyeler içindir</p>
                  <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                    Yorumları, puanları ve çalışma deneyimlerini görmek için giriş yapın veya ücretsiz kayıt olun.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild className="gap-2">
                    <Link href={`/login?next=${encodeURIComponent(`/hospital/${id}`)}&reason=verified`}>
                      <LogIn className="size-4" />
                      Giriş yap
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link href="/register">
                      <UserPlus className="size-4" />
                      Kayıt ol
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : !isVerified ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm font-medium text-blue-900">
                ⚠️ Yorumları görmek için doktor doğrulaması gerekli
              </p>
              <p className="mt-1 text-xs text-blue-800">
                Doktor değerlendirmelerini ve çalışma deneyimlerini görmek için hekim doğrulamanız gerekir.
              </p>
            </div>
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Clock className="size-5 text-muted-foreground" />
                </div>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  Değerlendirmeleri görmek için hekim doğrulamanın onaylanması gerekiyor.
                </p>
                <Button asChild variant="outline">
                  <Link href="/profile">Doğrulama durumumu gör</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <VerifiedHospitalContent hospitalId={id} supabase={supabase} />
        )}
      </div>
    </Container>
  );
}

async function VerifiedHospitalContent({
  hospitalId,
  supabase,
}: {
  hospitalId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const clinicRepository = new ClinicRepository(supabase);
  const clinics = await clinicRepository.findByHospitalId(hospitalId);

  return (
    <>
      <SectionLabel>Klinikler ({clinics.length})</SectionLabel>

      {clinics.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Bu hastane için henüz kayıtlı klinik yok.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {clinics.map((clinic) => (
            <ClinicCard
              key={clinic.id}
              branch={clinic.branch}
              href={`/clinic/${clinic.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
