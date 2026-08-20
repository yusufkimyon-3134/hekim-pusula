import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, LogIn, UserPlus, Clock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/section-label";
import { Card, CardContent } from "@/components/ui/card";
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
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { generateClinicSummary } from "@/lib/ai/services/clinic-summary-service";
import { generateClinicInsights } from "@/lib/ai/services/insights-service";
import { AiNotConfiguredError, InsufficientDataError, type ClinicSummaryResult } from "@/lib/ai/types";

const siteUrl = "https://www.hekimpusula.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const clinic = await new ClinicRepository(supabase).findByIdWithHospital(id);

  if (!clinic) return { title: "Klinik bulunamadı", robots: { index: false, follow: false } };

  const title = `${clinic.hospital.name} ${clinic.branch} Yorumları`;
  const description = `${clinic.hospital.city} ${clinic.hospital.name} ${clinic.branch} kliniği için hekim çalışma deneyimleri, nöbet düzeni, eğitim ortamı ve TUS, YDUS, DHY tercihleri öncesi bilgiler.`;
  const canonical = `${siteUrl}/clinic/${id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", url: canonical, title: `${title} | Hekim Pusula`, description, siteName: "Hekim Pusula", locale: "tr_TR" },
  };
}

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

  if (!clinic) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${clinic.hospital.name} ${clinic.branch} Yorumları`,
    url: `${siteUrl}/clinic/${id}`,
    about: { "@type": "Hospital", name: clinic.hospital.name, address: { "@type": "PostalAddress", addressLocality: clinic.hospital.district, addressRegion: clinic.hospital.city, addressCountry: "TR" } },
  };

  let isVerified = false;
  if (userData.user) {
    const doctorRepository = new DoctorRepository(supabase);
    const doctor = await doctorRepository.findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }

  const canViewReviews = userData.user !== null && isVerified;

  const [reviews, stats, ownReviewId, topicCounts, globalAvgManagement] = await Promise.all([
    canViewReviews ? reviewRepository.findByClinicId(id, { requireVerifiedUser: true }) : Promise.resolve([]),
    canViewReviews ? clinicRepository.getStats(id) : Promise.resolve(null),
    canViewReviews ? reviewRepository.findOwnReviewIdForClinic(id) : Promise.resolve(null),
    canViewReviews ? reviewRepository.getTopicCounts(id) : Promise.resolve({}),
    canViewReviews ? clinicRepository.getGlobalAverageManagementScore() : Promise.resolve(null),
  ]);

  const reviewHref = !userData.user ? `/login?redirectTo=${encodeURIComponent(`/clinic/${id}/review`)}` : ownReviewId ? `/clinic/${id}/review/${ownReviewId}/edit` : `/clinic/${id}/review`;
  const hasReviews = reviews.length > 0;
  const canWriteReview = Boolean(userData.user) && isVerified;

  let aiSummary: ClinicSummaryResult | null = null;
  let aiUnavailableReason: string | undefined;
  if (hasReviews) {
    try { aiSummary = await generateClinicSummary(reviews); }
    catch (e) {
      if (e instanceof InsufficientDataError || e instanceof AiNotConfiguredError) aiUnavailableReason = e.message;
      else aiUnavailableReason = "AI özeti şu an oluşturulamadı.";
    }
  }

  const insights = hasReviews ? generateClinicInsights({ reviews, topicCounts, globalAvgManagementScore: globalAvgManagement }) : [];

  return (
    <Container className="py-12 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-2xl space-y-14">
        <ClinicHero branch={clinic.branch} hospital={clinic.hospital} />
        <ClinicIntro />

        {!userData.user ? (
          <>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3"><p className="text-sm font-medium text-yellow-900">⚠️ Yorumları görmek için giriş yapmalısınız</p><p className="mt-1 text-xs text-yellow-800">Doktor değerlendirmelerini ve çalışma deneyimlerini görmek için lütfen giriş yapın veya kayıt olun.</p></div>
            <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-10 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Lock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim değerlendirmeleri üyeler içindir</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Yorumları, puanları ve çalışma deneyimlerini görmek için giriş yapın veya ücretsiz kayıt olun.</p></div><div className="flex flex-wrap justify-center gap-2"><Button asChild className="gap-2"><Link href={`/login?redirectTo=${encodeURIComponent(`/clinic/${id}`)}`}><LogIn className="size-4" />Giriş yap</Link></Button><Button asChild variant="outline" className="gap-2"><Link href="/register"><UserPlus className="size-4" />Kayıt ol</Link></Button></div></CardContent></Card>
          </>
        ) : !isVerified ? (
          <>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"><p className="text-sm font-medium text-blue-900">⚠️ Yorumları görmek için doktor doğrulaması gerekli</p><p className="mt-1 text-xs text-blue-800">Doktor değerlendirmelerini ve çalışma deneyimlerini görmek için hekim doğrulamanız gerekir.</p></div>
            <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-10 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Clock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim doğrulaması gerekiyor</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Yorumları, puanları ve çalışma deneyimlerini görmek için hekim doğrulamanızın tamamlanması gerekir.</p></div><Button asChild variant="outline"><Link href="/profile">Doğrulama durumumu gör</Link></Button></CardContent></Card>
          </>
        ) : (
          <>
            {(reported || deleted || shared) && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{reported && "Raporun alındı, teşekkürler."}{deleted && "Değerlendirmen silindi."}{shared && "Değerlendirmen paylaşıldı, teşekkürler."}</p>}
            {hasReviews && <section><AiClinicSummaryCard result={aiSummary} unavailableReason={aiUnavailableReason} /></section>}
            <section className="space-y-4"><SectionLabel>İstatistikler</SectionLabel>{hasReviews && stats ? <ClinicStatsSummary stats={stats} /> : <UpcomingInfoGrid />}</section>
            {insights.length > 0 && <section className="space-y-4"><SectionLabel>İçgörüler</SectionLabel><InsightCards insights={insights} /></section>}
            {hasReviews && stats && <><section className="space-y-4"><SectionLabel>Puan dağılımı</SectionLabel><RatingDistribution reviews={reviews} /></section><section className="space-y-4"><SectionLabel>Artı / eksi</SectionLabel><ProsAndCons stats={stats} /></section><section className="space-y-4"><SectionLabel>Öne çıkan yorumlar</SectionLabel><ReviewHighlights reviews={reviews} /></section></>}
            <section className="space-y-4"><div className="flex items-center justify-between gap-4"><SectionLabel>Deneyimler ({reviews.length})</SectionLabel>{canWriteReview && <Button asChild variant="outline" size="sm"><Link href={reviewHref}>{ownReviewId ? "Değerlendirmeni düzenle" : "Sen de paylaş"}</Link></Button>}</div>{hasReviews ? <ExperienceTimeline reviews={reviews} clinicId={id} /> : <ShareExperienceEmptyState reviewHref={reviewHref} />}</section>
          </>
        )}
      </div>
    </Container>
  );
}
