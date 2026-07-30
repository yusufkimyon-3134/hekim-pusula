import { Clock, ThumbsUp, ThumbsDown } from "lucide-react";
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
 * render eder.
 */
export function ExperienceTimeline({ reviews }: { reviews: ReviewWithScores[] }) {
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
      {reviews.map((review) => (
        <div key={review.id} className="relative flex items-start gap-3.5">
          <div className="absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 border-primary bg-background">
            {review.wouldChooseAgain ? (
              <ThumbsUp className="size-3.5 text-primary" />
            ) : (
              <ThumbsDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Doğrulanmamış hekim beyanı
              </span>
              <span>· {formatRelativeDate(review.createdAt)}</span>
            </div>
            {review.comment && (
              <p className="text-sm leading-relaxed">{review.comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Aylık {review.monthlyShifts} nöbet · Günlük {review.dailyPatients}{" "}
              hasta · Servis {review.servicePatients} hasta
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
