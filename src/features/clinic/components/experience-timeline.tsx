import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { ReputationBadge } from "@/components/reputation-badge";
import { HelpfulVoteButton } from "@/features/review/components/helpful-vote-button";
import { ReportForm } from "@/features/review/components/report-form";
import { ReviewOwnerActions } from "@/features/review/components/review-owner-actions";
import { confirmReviewCurrent } from "@/app/clinic/[id]/actions";
import type { ReviewWithScores } from "@/types";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

function getFreshness(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 183) return { label: "Güncel bilgi", style: "border-emerald-200 bg-emerald-50 text-emerald-700", Icon: CheckCircle2, needsConfirmation: false };
  if (days < 365) return { label: "Güncellenme zamanı yaklaşmış", style: "border-amber-200 bg-amber-50 text-amber-700", Icon: Clock, needsConfirmation: true };
  return { label: "Eski deneyim", style: "border-orange-200 bg-orange-50 text-orange-700", Icon: AlertTriangle, needsConfirmation: true };
}

export function ExperienceTimeline({ reviews, clinicId }: { reviews: ReviewWithScores[]; clinicId: string }) {
  if (!reviews.length) return <div className="relative pl-8"><div className="absolute top-1 left-[13px] h-full border-l-2 border-dashed border-border" aria-hidden="true" /><div className="relative flex items-start gap-3.5"><div className="absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 border-dashed border-border bg-background"><Clock className="size-3.5 text-muted-foreground" /></div><div className="space-y-1 pt-0.5"><p className="text-sm font-medium text-muted-foreground">İlk deneyim burada görünecek</p><p className="text-xs leading-relaxed text-muted-foreground/70">Bir hekim bu klinik hakkında deneyimini paylaştığında, zaman çizelgesi burada birikmeye başlayacak.</p></div></div></div>;

  return <div className="relative space-y-6 pl-8"><div className="absolute top-1 left-[13px] h-[calc(100%-8px)] border-l-2 border-border" aria-hidden="true" />{reviews.map((review) => {
    const freshness = getFreshness(review.lastVerifiedAt);
    const FreshnessIcon = freshness.Icon;
    const wasReverified = new Date(review.lastVerifiedAt).getTime() - new Date(review.createdAt).getTime() > 60_000;

    return <div key={review.id} className="relative flex items-start gap-3.5"><div className="absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 border-primary bg-background">{review.wouldChooseAgain ? <ThumbsUp className="size-3.5 text-primary" /> : <ThumbsDown className="size-3.5 text-muted-foreground" />}</div><div className="min-w-0 flex-1 space-y-2 pt-0.5"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex flex-wrap items-center gap-2"><ReputationBadge reviewCount={review.authorReviewCount} helpfulVotes={review.authorHelpfulVotes} isVerified={review.authorIsVerified} />{review.authorNickname && <span className="text-xs font-medium text-muted-foreground">@{review.authorNickname}</span>}</div>{review.isMine && <ReviewOwnerActions reviewId={review.id} clinicId={clinicId} />}</div><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>{formatDate(review.createdAt)}</span><span>·</span><span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${freshness.style}`}><FreshnessIcon className="size-3" />{freshness.label}</span></div>{wasReverified && <p className="text-xs text-muted-foreground/80">Bilgiler {formatDate(review.lastVerifiedAt)} tarihinde yeniden doğrulandı.</p>}{review.isMine && freshness.needsConfirmation && <form action={confirmReviewCurrent}><input type="hidden" name="reviewId" value={review.id} /><input type="hidden" name="clinicId" value={clinicId} /><button type="submit" className="cursor-pointer text-xs font-medium text-primary underline-offset-4 hover:underline">Bilgilerim hâlâ güncel</button></form>}{review.comment && <p className="text-sm leading-relaxed">{review.comment}</p>}<p className="text-xs text-muted-foreground">Aylık {review.monthlyShifts} nöbet · Günlük {review.dailyPatients} hasta · Servis {review.servicePatients} hasta</p>{!review.isMine && <div className="flex items-center gap-2 pt-1"><HelpfulVoteButton reviewId={review.id} clinicId={clinicId} helpfulCount={review.helpfulCount} /><Link href={`/clinic/${clinicId}/question/${review.id}`} className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"><MessageCircle className="size-3.5" />Özel soru sor</Link><ReportForm reviewId={review.id} clinicId={clinicId} /></div>}</div></div>;
  })}</div>;
}
