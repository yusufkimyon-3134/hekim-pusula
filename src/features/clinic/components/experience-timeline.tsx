import Link from "next/link";
import { Clock, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { ReputationBadge } from "@/components/reputation-badge";
import { HelpfulVoteButton } from "@/features/review/components/helpful-vote-button";
import { ReportForm } from "@/features/review/components/report-form";
import { ReviewOwnerActions } from "@/features/review/components/review-owner-actions";
import type { ReviewWithScores } from "@/types";

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  return `${Math.floor(months / 12)} yıl önce`;
}

/**
 * Sprint 4'te tasarlanan "boş zaman çizelgesi" imza öğesi, artık veri
 * odaklı: hiç değerlendirme yoksa aynı zarif boş durumu gösterir, varsa
 * her değerlendirmeyi aynı kesikli-çizgi görsel diliyle bir düğüm olarak
 * render eder. Sprint 7: itibar rozeti, düzenlendi göstergesi, faydalı
 * oy, rapor ve (sahibiyse) düzenle/sil eklendi.
 */
export function ExperienceTimeline({
  reviews,
  clinicId,
}: {
  reviews: ReviewWithScores[];
  clinicId: string;
}) {
  if (reviews.length === 0) {
    return (
      <div className="relative pl-8">
        <div
          className="absolute top-1 left-[13px] h-full border-l-2 border-dashed border-border"
          aria-hidden="true"
        />
        <div className="relative flex items-start gap-3.5">
          <div className="absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 border-dashed border-border bg-background">
            <Clock className="size-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-1 pt-0.5">
            <p className="text-sm font-medium text-muted-foreground">
              İlk deneyim burada görünecek
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground/70">
              Bir hekim bu klinik hakkında deneyimini paylaştığında, zaman
              çizelgesi burada birikmeye başlayacak.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pl-8">
      <div
        className="absolute top-1 left-[13px] h-[calc(100%-8px)] border-l-2 border-border"
        aria-hidden="true"
      />
      {reviews.map((review) => {
        const wasEdited =
          new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 60_000;

        return (
          <div key={review.id} className="relative flex items-start gap-3.5">
            <div className="absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 border-primary bg-background">
              {review.wouldChooseAgain ? (
                <ThumbsUp className="size-3.5 text-primary" />
              ) : (
                <ThumbsDown className="size-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <ReputationBadge
                    reviewCount={review.authorReviewCount}
                    helpfulVotes={review.authorHelpfulVotes}
                    isVerified={review.authorIsVerified}
                  />
                  {review.authorNickname && (
                    <span className="text-xs font-medium text-muted-foreground">
                      @{review.authorNickname}
                    </span>
                  )}
                </div>
                {review.isMine && (
                  <ReviewOwnerActions reviewId={review.id} clinicId={clinicId} />
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {formatRelativeDate(review.createdAt)}
                {wasEdited && ` · Düzenlendi (${formatRelativeDate(review.updatedAt)})`}
              </p>

              {review.comment && (
                <p className="text-sm leading-relaxed">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Aylık {review.monthlyShifts} nöbet · Günlük {review.dailyPatients}{" "}
                hasta · Servis {review.servicePatients} hasta
              </p>

              {!review.isMine && (
                <div className="flex items-center gap-2 pt-1">
                  <HelpfulVoteButton
                    reviewId={review.id}
                    clinicId={clinicId}
                    helpfulCount={review.helpfulCount}
                  />
                  <Link
                    href={`/clinic/${clinicId}/question/${review.id}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <MessageCircle className="size-3.5" />
                    Özel soru sor
                  </Link>
                  <ReportForm reviewId={review.id} clinicId={clinicId} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
