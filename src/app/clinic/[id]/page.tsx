import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/section-label";
import { Button } from "@/components/ui/button";
import { ClinicHero } from "@/features/clinic/components/clinic-hero";
import { ClinicIntro } from "@/features/clinic/components/clinic-intro";
import { ShareExperienceEmptyState } from "@/features/clinic/components/share-experience-empty-state";
import { UpcomingInfoGrid } from "@/features/clinic/components/upcoming-info-grid";
import { ExperienceTimeline } from "@/features/clinic/components/experience-timeline";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { ReviewRepository } from "@/lib/repositories/review-repository";

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const reviewRepository = new ReviewRepository(supabase);

  const [clinic, { data: userData }] = await Promise.all([
    clinicRepository.findByIdWithHospital(id),
    supabase.auth.getUser(),
  ]);

  if (!clinic) {
    notFound();
  }

  const reviews = await reviewRepository.findByClinicId(id);

  const reviewHref = userData.user
    ? `/clinic/${id}/review`
    : `/login?redirectTo=${encodeURIComponent(`/clinic/${id}/review`)}`;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-14">
        <ClinicHero branch={clinic.branch} hospital={clinic.hospital} />

        <ClinicIntro />

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <SectionLabel>Deneyimler ({reviews.length})</SectionLabel>
            {reviews.length > 0 && (
              <Button asChild variant="outline" size="sm">
                <Link href={reviewHref}>Sen de paylaş</Link>
              </Button>
            )}
          </div>

          {reviews.length === 0 ? (
            <ShareExperienceEmptyState reviewHref={reviewHref} />
          ) : (
            <ExperienceTimeline reviews={reviews} />
          )}
        </section>

        <section className="space-y-4">
          <SectionLabel>Yakında gelecek bilgiler</SectionLabel>
          <UpcomingInfoGrid />
        </section>
      </div>
    </Container>
  );
}
