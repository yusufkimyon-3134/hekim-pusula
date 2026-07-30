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
import { ClinicStatsSummary } from "@/features/clinic/components/clinic-stats-summary";
import { RatingDistribution } from "@/features/clinic/components/rating-distribution";
import { ProsAndCons } from "@/features/clinic/components/pros-and-cons";
import { ReviewHighlights } from "@/features/clinic/components/review-highlights";
import { AiClinicSummaryCard } from "@/features/clinic/components/ai-clinic-summary-card";
import { InsightCards } from "@/features/clinic/components/insight-cards";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { ReviewRepository } from "@/lib/repositories/review-repository";
import { generateClinicSummary } from "@/lib/ai/services/clinic-summary-service";
import { generateClinicInsights } from "@/lib/ai/services/insights-service";
import { AiNotConfiguredError, InsufficientDataError, type ClinicSummaryResult } from "@/lib/ai/types";

export default async function ClinicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reported?: string; deleted?: string; shared?: string }>;
}) {
  const { id } = await params;
  const { reported, deleted, shared } = await searchParams;

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

  const [reviews, stats, ownReviewId, topicCounts, globalAvgManagement] = await Promise.all([
    reviewRepository.findByClinicId(id),
    clinicRepository.getStats(id),
    userData.user ? reviewRepository.findOwnReviewIdForClinic(id) : Promise.resolve(null),
    reviewRepository.getTopicCounts(id),
    clinicRepository.getGlobalAverageManagementScore(),
  ]);

  const reviewHref = !userData.user
    ? `/login?redirectTo=${encodeURIComponent(`/clinic/${id}/review`)}`
    : ownReviewId
      ? `/clinic/${id}/review/${ownReviewId}/edit`
      : `/clinic/${id}/review`;

  const hasReviews = reviews.length > 0;

  // AI özeti: yalnızca yeterli veri varsa üretilir (bkz. AI Safety —
  // "yetersiz veri açıkça belirtilmeli"). Hata durumunda sayfanın
  // tamamı çökmesin diye burada yakalanıyor.
  let aiSummary: ClinicSummaryResult | null = null;
  let aiUnavailableReason: string | undefined;
  if (hasReviews) {
    try {
      aiSummary = await generateClinicSummary(reviews);
    } catch (e) {
      if (e instanceof InsufficientDataError || e instanceof AiNotConfiguredError) {
        aiUnavailableReason = e.message;
      } else {
        aiUnavailableReason = "AI özeti şu an oluşturulamadı.";
      }
    }
  }

  const insights = hasReviews
    ? generateClinicInsights({
        reviews,
        topicCounts,
        globalAvgManagementScore: globalAvgManagement,
      })
    : [];

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-14">
        <ClinicHero branch={clinic.branch} hospital={clinic.hospital} />

        <ClinicIntro />

        {(reported || deleted || shared) && (
          <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
            {reported && "Raporun alındı, teşekkürler."}
            {deleted && "Değerlendirmen silindi."}
            {shared && "Değerlendirmen paylaşıldı, teşekkürler."}
          </p>
        )}

        {hasReviews && (
          <section>
            <AiClinicSummaryCard result={aiSummary} unavailableReason={aiUnavailableReason} />
          </section>
        )}

        <section className="space-y-4">
          <SectionLabel>İstatistikler</SectionLabel>
          {hasReviews && stats ? (
            <ClinicStatsSummary stats={stats} />
          ) : (
            <UpcomingInfoGrid />
          )}
        </section>

        {insights.length > 0 && (
          <section className="space-y-4">
            <SectionLabel>İçgörüler</SectionLabel>
            <InsightCards insights={insights} />
          </section>
        )}

        {hasReviews && stats && (
          <>
            <section className="space-y-4">
              <SectionLabel>Puan dağılımı</SectionLabel>
              <RatingDistribution reviews={reviews} />
            </section>

            <section className="space-y-4">
              <SectionLabel>Artı / eksi</SectionLabel>
              <ProsAndCons stats={stats} />
            </section>

            <section className="space-y-4">
              <SectionLabel>Öne çıkan yorumlar</SectionLabel>
              <ReviewHighlights reviews={reviews} />
            </section>
          </>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <SectionLabel>Deneyimler ({reviews.length})</SectionLabel>
            {hasReviews && (
              <Button asChild variant="outline" size="sm">
                <Link href={reviewHref}>
                  {ownReviewId ? "Değerlendirmeni düzenle" : "Sen de paylaş"}
                </Link>
              </Button>
            )}
          </div>

          {hasReviews ? (
            <ExperienceTimeline reviews={reviews} clinicId={id} />
          ) : (
            <ShareExperienceEmptyState reviewHref={reviewHref} />
          )}
        </section>
      </div>
    </Container>
  );
}
