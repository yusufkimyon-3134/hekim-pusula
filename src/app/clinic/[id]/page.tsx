import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, LogIn, UserPlus, Clock, PenLine } from "lucide-react";
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

export default async function ClinicDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reported?: string; deleted?: string; shared?: string }> }) {
  const { id } = await params;
  const { reported, deleted, shared } = await searchParams;
  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const reviewRepository = new ReviewRepository(supabase);
  const [clinic, { data: userData }] = await Promise.all([clinicRepository.findByIdWithHospital(id), supabase.auth.getUser()]);
  if (!clinic) notFound();

  const structuredData = { "@context": "https://schema.org", "@type": "WebPage", name: `${clinic.hospital.name} ${clinic.branch} Yorumları ve Çalışma Koşulları`, description: `${clinic.branch} için hekim deneyimleri, nöbet, eğitim ve çalışma koşulları.`, url: `${siteUrl}/clinic/${id}`, about: { "@type": "Hospital", name: clinic.hospital.name, address: { "@type": "PostalAddress", addressLocality: clinic.hospital.district, addressRegion: clinic.hospital.city, addressCountry: "TR" } } };

  let isVerified = false;
  if (userData.user) {
    const doctor = await new DoctorRepository(supabase).findById(userData.user.id);
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

  return <Container className="py-12 sm:py-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-2xl space-y-14">
      <ClinicHero branch={clinic.branch} hospital={clinic.hospital} /><ClinicIntro />
      {!userData.user ? <>
        <Card className="border-primary/30 bg-primary/5"><CardContent className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-primary/10"><PenLine className="size-5 text-primary" /></div><div className="space-y-1.5"><p className="text-lg font-semibold">Bu klinikte çalıştın mı?</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Nöbet, eğitim, yönetim, teşvik ve çalışma ortamı deneyimini diğer hekimlerle paylaş. Deneyimin, tercih yapacak bir meslektaşına yardımcı olabilir.</p></div><Button asChild className="w-full max-w-xs gap-2"><Link href={`/register?next=${encodeURIComponent(targetReview)}`}><PenLine className="size-4" />Deneyimimi paylaş</Link></Button><p className="text-xs text-muted-foreground">Üyelik ücretsiz. Yorum içeriği yalnızca doğrulanmış hekimlere gösterilir.</p></CardContent></Card>
        <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-8 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Lock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim deneyimleri doğrulanmış hekimlere özeldir</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Bu klinikteki değerlendirmeleri görmek için ücretsiz hesap oluştur ve hekim doğrulamanı tamamla.</p></div><div className="flex flex-wrap justify-center gap-2"><Button asChild variant="outline" className="gap-2"><Link href={`/login?redirectTo=${encodeURIComponent(`/clinic/${id}`)}`}><LogIn className="size-4" />Giriş yap</Link></Button><Button asChild variant="outline" className="gap-2"><Link href={`/register?next=${encodeURIComponent(`/clinic/${id}`)}`}><UserPlus className="size-4" />Kayıt ol</Link></Button></div></CardContent></Card>
      </> : !isVerified ? <><div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"><p className="text-sm font-medium text-blue-900">Hekim doğrulaması gerekli</p><p className="mt-1 text-xs text-blue-800">Deneyimleri görmek ve paylaşmak için hekim doğrulamanı tamamla.</p></div><Card className="border-dashed"><CardContent className="flex flex-col items-center gap-4 py-10 text-center"><div className="flex size-12 items-center justify-center rounded-full bg-muted"><Clock className="size-5 text-muted-foreground" /></div><div className="space-y-1.5"><p className="font-medium">Hekim doğrulaması gerekiyor</p><p className="mx-auto max-w-md text-sm text-muted-foreground">Doğrulama tamamlandığında gerçek hekim deneyimlerine erişebilir ve kendi deneyimini paylaşabilirsin.</p></div><Button asChild variant="outline"><Link href="/profile">Doğrulama durumumu gör</Link></Button></CardContent></Card></> : <>
        {(reported || deleted || shared) && <p className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">{reported && "Raporun alındı, teşekkürler."}{deleted && "Değerlendirmen silindi."}{shared && "Değerlendirmen paylaşıldı, teşekkürler."}</p>}
        {hasReviews && <section><AiClinicSummaryCard result={aiSummary} unavailableReason={aiUnavailableReason} /></section>}
        <section className="space-y-4"><SectionLabel>İstatistikler</SectionLabel>{hasReviews && stats ? <ClinicStatsSummary stats={stats} /> : <UpcomingInfoGrid />}</section>
        {insights.length > 0 && <section className="space-y-4"><SectionLabel>İçgörüler</SectionLabel><InsightCards insights={insights} /></section>}
        {hasReviews && stats && <><section className="space-y-4"><SectionLabel>Puan dağılımı</SectionLabel><RatingDistribution reviews={reviews} /></section><section className="space-y-4"><SectionLabel>Artı / eksi</SectionLabel><ProsAndCons stats={stats} /></section><section className="space-y-4"><SectionLabel>Öne çıkan yorumlar</SectionLabel><ReviewHighlights reviews={reviews} /></section></>}
        <section className="space-y-4"><div className="flex items-center justify-between gap-4"><SectionLabel>Deneyimler ({reviews.length})</SectionLabel>{canWriteReview && <Button asChild variant="outline" size="sm"><Link href={reviewHref}>{ownReviewId ? "Değerlendirmeni düzenle" : "Sen de paylaş"}</Link></Button>}</div>{hasReviews ? <ExperienceTimeline reviews={reviews} clinicId={id} /> : <ShareExperienceEmptyState reviewHref={reviewHref} />}</section>
      </>}
      <section className="rounded-lg border bg-muted/30 p-5"><h2 className="font-semibold">{clinic.hospital.name} {clinic.branch} hakkında</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Hekim Pusula, {clinic.hospital.city} ilindeki {clinic.hospital.name} {clinic.branch} kliniği hakkında hekimlerin çalışma deneyimlerini bir araya getirir. Nöbet düzeni, eğitim ortamı, yönetim, teşvik ve günlük çalışma koşulları; TUS, YDUS ve DHY tercihleri öncesinde hekimlerin en çok merak ettiği başlıklardandır. Bu klinikte çalıştıysan güncel deneyimini paylaşarak meslektaşlarının daha bilinçli tercih yapmasına katkı sağlayabilirsin.</p></section>
    </div>
  </Container>;
}
