import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { SectionLabel } from "@/components/section-label";
import { ClinicCard } from "@/features/clinic/components/clinic-card";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";

// Hastane/klinik referans verisi nadiren değişir — 1 saatlik ISR.
export const revalidate = 3600;

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const clinicRepository = new ClinicRepository(supabase);

  const hospital = await hospitalRepository.findById(id);
  if (!hospital) {
    notFound();
  }

  const clinics = await clinicRepository.findByHospitalId(id);

  return (
    <Container className="py-10">
      <DetailPageHeader
        title={hospital.name}
        subtitle={`${hospital.district}, ${hospital.city}`}
        badgeLabel={HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
      />

      <div className="mt-8">
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
      </div>
    </Container>
  );
}
