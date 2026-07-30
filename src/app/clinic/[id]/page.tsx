import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/section-label";
import { ClinicHero } from "@/features/clinic/components/clinic-hero";
import { ClinicIntro } from "@/features/clinic/components/clinic-intro";
import { ShareExperienceEmptyState } from "@/features/clinic/components/share-experience-empty-state";
import { UpcomingInfoGrid } from "@/features/clinic/components/upcoming-info-grid";
import { ExperienceTimeline } from "@/features/clinic/components/experience-timeline";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";

// Klinik+hastane bilgisi nadiren değişiyor — 1 saatlik ISR.
// Sprint 5'te bu sayfaya yorumlar eklenince (sık değişen veri), bu süre
// kısaltılmalı veya on-demand revalidation'a geçilmeli.
export const revalidate = 3600;

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const clinic = await clinicRepository.findByIdWithHospital(id);

  if (!clinic) {
    notFound();
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-14">
        <ClinicHero branch={clinic.branch} hospital={clinic.hospital} />

        <ClinicIntro />

        <section className="space-y-4">
          <SectionLabel>Deneyimler</SectionLabel>
          <ShareExperienceEmptyState />
        </section>

        <section className="space-y-4">
          <SectionLabel>Yakında gelecek bilgiler</SectionLabel>
          <UpcomingInfoGrid />
        </section>

        <section className="space-y-6">
          <SectionLabel>Zaman çizelgesi</SectionLabel>
          <ExperienceTimeline />
        </section>
      </div>
    </Container>
  );
}
