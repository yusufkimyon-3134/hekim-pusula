import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { SectionLabel } from "@/components/section-label";
import { ClinicCard } from "@/features/clinic/components/clinic-card";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";

// Yeni eklenen kliniklerin ve değerlendirmelerin betada kısa sürede görünmesi için.
export const revalidate = 60;

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
  const sortedClinics = [...clinics].sort((a, b) => {
    const aIsPratisyen = a.branch === "Pratisyen Hekim Görevi";
    const bIsPratisyen = b.branch === "Pratisyen Hekim Görevi";

    if (aIsPratisyen !== bIsPratisyen) {
      return aIsPratisyen ? -1 : 1;
    }

    return a.branch.localeCompare(b.branch, "tr");
  });

  return (
    <Container className="py-10">
      <DetailPageHeader
        title={hospital.name}
        subtitle={`${hospital.district}, ${hospital.city}`}
        badgeLabel={HOSPITAL_TYPE_LABELS[hospital.hospitalType]}
      />

      <div className="mt-8">
        <SectionLabel>Klinikler ({sortedClinics.length})</SectionLabel>

        {sortedClinics.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Bu hastane için henüz kayıtlı klinik yok.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {sortedClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                branch={clinic.branch}
                href={`/clinic/${clinic.id}`}
                subtitle={
                  clinic.branch === "Pratisyen Hekim Görevi"
                    ? "DHY ve pratisyen hekim çalışma koşulları"
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
