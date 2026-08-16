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

// Hastane referans verisi (ad/il/ilçe/tür) nadiren değişir — 1 saatlik ISR.
// Not: bu artık yalnızca hastane bilgisi için geçerli; klinik/yorum
// içeriği zaten yalnızca doğrulanmış hekimler için, dinamik olarak
// (auth durumuna göre) gösteriliyor.
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

  // Hastane adı/il/ilçe/tür herkese açık (bkz. migration
  // 20260101000028) — bu yüzden yukarıdaki sorgu auth durumundan
  // bağımsız çalışır. Klinik/yorum içeriği ise RLS'te hâlâ yalnızca
  // doğrulanmış hekimlere açık; burada o içeriği HİÇ SORGULAMADAN önce
  // auth/doğrulama durumunu kontrol ediyoruz — hem gereksiz bir sorgu
  // atmamak hem de "boş liste" ile "erişimin yok" durumunu birbirine
  // karıştırmamak için.
  const { data: userData } = await supabase.auth.getUser();

  let isVerified = false;
  if (userData.user) {
    const doctorRepository = new DoctorRepository(supabase);
    const doctor = await doctorRepository.findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }

  return (
    <Container className="py-10">
      <DetailPageHeader
        title={hospital.name}
        subtitle={`${hospital.district}, ${hospital.city}`}
        badgeLabel={HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
      />

      <div className="mt-8">
        {!userData.user ? (
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
        ) : !isVerified ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Değerlendirmeleri görmek için hekim doğrulamanın onaylanması
                gerekiyor.
              </p>
              <Button asChild variant="outline">
                <Link href="/profile">Doğrulama durumumu gör</Link>
              </Button>
            </CardContent>
          </Card>
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
