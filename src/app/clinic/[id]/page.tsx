import { ClinicReviewPreview } from "@/features/clinic/components/clinic-review-preview";
import { DoctorVerificationRepository } from "@/lib/repositories/doctor-verification-repository";
import { isAdminUser } from "@/lib/admin/auth";
import { safeQuery } from "@/lib/safe-query";
import { PublicReviewSummary } from "@/features/clinic/components/public-review-summary";
import { getPublicReviewSummaries } from "@/lib/repositories/public-review-summary";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Lock, LogIn, UserPlus, PenLine } from "lucide-react";
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
import { InviteColleagueButton } from "@/features/review/components/invite-colleague-button";
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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteUrl = "https://www.hekimpusula.com.tr";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const clinic = await new ClinicRepository(supabase).findByIdWithHospital(id);
  if (!clinic) return { title: "Klinik bulunamadı", robots: { index: false, follow: false } };
  const title = `${clinic.hospital.name} ${clinic.branch} Yorumları ve Çalışma Koşulları`;
  const description = `${clinic.hospital.city} ${clinic.hospital.name} ${clinic.branch}: hekim deneyimleri, nöbet düzeni, eğitim ortamı, teşvik ve çalışma koşulları. TUS, YDUS ve DHY tercihi öncesi bilgi edin, çalıştıysan deneyimini paylaş.`;
  const canonical = `${siteUrl}/clinic/${id}`;
  return { title, description, alternates: { canonical }, openGraph: { type: "website", url: canonical, title: `${title} | Hekim Pusula`, description, siteName: "Hekim Pusula", locale: "tr_TR" } };
}

export default async function ClinicDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reported?: string; deleted?: string; shared?: string; previewError?: string }> }) {
  const { id } = await params;
  const { reported, deleted, shared, previewError } = await searchParams;
  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const reviewRepository = new ReviewRepository(supabase);
  const [clinic, { data: userData }] = await Promise.all([clinicRepository.findByIdWithHospital(id), supabase.auth.getUser()]);
  if (!clinic) notFound();
  if (clinic.mergedIntoId) permanentRedirect(`/clinic/${clinic.mergedIntoId}`);

  const structuredData = { "@context": "https://schema.org", "@type": "WebPage", name: `${clinic.hospital.name} ${clinic.branch} Yorumları ve Çalışma Koşulları`, description: `${clinic.branch} için hekim deneyimleri, nöbet, eğitim ve çalışma koşulları.`, url: `${siteUrl}/clinic/${id}`, about: { "@type": "Hospital", name: clinic.hospital.name, address: { "@type": "PostalAddress", addressLocality: clinic.hospital.district, addressRegion: clinic.hospital.city, addressCountry: "TR" } } };

  let isVerified = false;
  if (userData.user) {
    const doctor = await new DoctorRepository(supabase).findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }
  const canViewReviews = userData.user !== null && isVerified;
  const [reviews, stats, ownReviewId, topicCounts, globalAvgManagement, publicSummaries] = await Promise.all([
    canViewReviews ? reviewRepository.findByClinicId(id, { requireVerifiedUser: true }) : Promise.resolve([]),
    canViewReviews ? clinicRepository.getStats(id) : Promise.resolve(null),
    canViewReviews ? reviewRepository.findOwnReviewIdForClinic(id) : Promise.resolve(null),
    canViewReviews ? reviewRepository.getTopicCounts(id) : Promise.resolve({}),
    canViewReviews ? clinicRepository.getGlobalAverageManagementScore() : Promise.resolve(null),
    getPublicReviewSummaries([id]),
  ]);

  const user = userData.user;
  const showPreviewPanel = Boolean(user && !isVerified);
  const [previews, verification, previewIds] = await Promise.all([
    showPreviewPanel && user?.email_confirmed_at
      ? supabase.rpc("clinic_review_previews", { p_clinic_id: id }).then(({ data, error }) => {
          if (error) console.error("[clinic-review-previews]", error.message);
          return data ?? [];
        })
      : [],
    user && showPreviewPanel
      ? safeQuery(() => new DoctorVerificationRepository(supabase).findLatestRequest(user.id), null)
      : null,
    canViewReviews && isAdminUser(user)
      ? supabase.rpc("admin_clinic_review_preview_ids", { p_clinic_id: id }).then(({ data }) => data)
      : null,
  ]);

  const targetReview = `/clinic/${id}/review`;
  const reviewHref = !userData.user ? `/register?next=${encodeURIComponent(targetReview)}` : ownReviewId ? `/clinic/${id}/review/${ownReviewId}/edit` : targetReview;
  const hasReviews = reviews.length > 0;
  const canWriteReview = Boolean(userData.user) && isVerified;
  let aiSummary: ClinicSummaryResult | null = null;
  let aiUnavailableReason: string | undefined;
  if (hasReviews) {
    try { aiSummary = await generateClinicSummary(reviews); }
    catch (e) {
      console.error("[clinic-ai-summary]", e);
      if (e instanceof InsufficientDataError || e instanceof AiNotConfiguredError) aiUnavailableReason = e.message;
      else aiUnavailableReason = "AI özeti şu an oluşturulamadı.";
    }
  }
  const insights = hasReviews ? generateClinicInsights({ reviews, topicCounts, globalAvgManagementScore: globalAvgManagement }) : [];

  return <div className={showPreviewPanel ? "h-full bg-white" : undefined}><Container className={showPreviewPanel ? "py-5 sm:py-10" : "py-8 sm:py-16"}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <div className={`mx-auto max-w-2xl ${showPreviewPanel ? "space-y-5 sm:space-y-7" : "space-y-8 sm:space-y-14"}`}>
      {showPreviewPanel ? (
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
            <Link prefetch={false} href={`/hospital/${clinic.hospital.id}`} className="hover:underline">{clinic.hospital.name}</Link>
          </h1>
          <p className="text-base text-slate-600">{clinic.branch}</p>
        </div>
      ) : (
        <>
          <ClinicHero branch={clinic.branch} hospital={clinic.hospital} />
          {publicSummaries && <div className="rounded-lg border bg-muted/30 px-4 py-3"><PublicReviewSummary summary={publicSummaries.get(id)} /></div>}
          <ClinicIntro />
        </>
      )}
      {!userData.user ? <>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-primary/10"><PenLine className="size-5 text-primary" /></div><div className="space-y-1.5"><p className="text-lg font-semibold">Bu klinikte çalıştın mı?</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Nöbet, eğitim, yönetim, teşvik ve çalışma ortamı deneyimini diğer hekimlerle paylaş. Deneyimin, tercih yapacak bir meslektaşına yardımcı olabilir.</p></div><Button asChild className="w-full max-w-xs gap-2"><Link prefetch={false} href={`/register?next=${encodeURIComponent(targetReview)}`}><PenLine className="size-4" />Deneyimimi paylaş</Link></Button><p className="text-xs text-muted-foreground">Üyelik ücretsiz. E-postanı doğruladığında varsa seçili yorumları okuyabilirsin.</p></CardContent></Card>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Lock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim yorumlarını keşfet</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Seçili yorumları okumak için giriş yap veya ücretsiz hesap oluştur. Tüm yorumlar için hekim onayı gerekiyor.</p></div><div className="flex flex-wrap justify-center gap-2"><Button asChild variant="outline" className="gap-2"><Link prefetch={false} href={`/login?redirectTo=${encodeURIComponent(`/clinic/${id}`)}`}><LogIn className="size-4" />Giriş yap</Link></Button><Button asChild variant="outline" className="gap-2"><Link prefetch={false} href={`/register?next=${encodeURIComponent(`/clinic/${id}`)}`}><UserPlus className="size-4" />Kayıt ol</Link></Button></div></CardContent></Card>
      </> : !isVerified ? (
        <ClinicReviewPreview clinicId={id} previews={previews} summary={publicSummaries?.get(id)} pending={verification?.status === "pending"} />
      ) : <>
        {previewError && isAdminUser(user) && <p role="alert" className="text-sm text-destructive">Önizleme seçimi kaydedilemedi. Sayfayı yenileyip tekrar dene.</p>}
        {(reported || deleted || shared) && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{reported && "Raporun alındı, teşekkürler."}{deleted && "Değerlendirmen silindi."}{shared && "Değerlendirmen paylaşıldı, teşekkürler."}</p>}
        {shared === "created" && ownReviewId && (
          <InviteColleagueButton clinicUrl={`${siteUrl}/clinic/${encodeURIComponent(clinic.id)}`} />
        )}
        {hasReviews && <section><AiClinicSummaryCard result={aiSummary} unavailableReason={aiUnavailableReason} /></section>}
        <section className="space-y-4"><SectionLabel>İstatistikler</SectionLabel>{hasReviews && stats ? <ClinicStatsSummary stats={stats} /> : <UpcomingInfoGrid />}</section>
        {insights.length > 0 && <section className="space-y-4"><SectionLabel>İçgörüler</SectionLabel><InsightCards insights={insights} /></section>}
        {hasReviews && stats && <><section className="space-y-4"><SectionLabel>Puan dağılımı</SectionLabel><RatingDistribution reviews={reviews} /></section><section className="space-y-4"><SectionLabel>Artı / eksi</SectionLabel><ProsAndCons stats={stats} /></section><section className="space-y-4"><SectionLabel>Öne çıkan yorumlar</SectionLabel><ReviewHighlights reviews={reviews} /></section></>}
        <section className="space-y-4"><div className="flex items-center justify-between gap-4"><SectionLabel>Deneyimler ({reviews.length})</SectionLabel>{canWriteReview && <Button asChild variant="outline" size="sm"><Link prefetch={false} href={reviewHref}>{ownReviewId ? "Değerlendirmeni düzenle" : "Sen de paylaş"}</Link></Button>}</div>{hasReviews ? <ExperienceTimeline reviews={reviews} clinicId={id} previewIds={previewIds} /> : <ShareExperienceEmptyState reviewHref={reviewHref} />}</section>
      </>}
      <section className="rounded-lg border bg-muted/30 p-5"><h2 className="font-semibold">{clinic.hospital.name} {clinic.branch} hakkında</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Hekim Pusula, {clinic.hospital.city} ilindeki {clinic.hospital.name} {clinic.branch} kliniği hakkında hekimlerin çalışma deneyimlerini bir araya getirir. Nöbet düzeni, eğitim ortamı, yönetim, teşvik ve günlük çalışma koşulları; TUS, YDUS ve DHY tercihleri öncesinde hekimlerin en çok merak ettiği başlıklardandır. Bu klinikte çalıştıysan güncel deneyimini paylaşarak meslektaşlarının daha bilinçli tercih yapmasına katkı sağlayabilirsin.</p></section>
    </div>
  </Container></div>;
}
