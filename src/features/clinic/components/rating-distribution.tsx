import type { ReviewWithScores } from "@/types";

function overallOf(review: ReviewWithScores): number {
  return (
    (review.incentiveScore +
      review.colleagueScore +
      review.managementScore +
      review.cityScore +
      review.educationScore +
      review.academicScore) /
    6
  );
}

/**
 * Her değerlendirmenin (6 alt puanın ortalaması alınarak hesaplanan)
 * genel puanını 1-5 arası kovalara ayırıp basit bir dağılım çubuğu olarak
 * gösterir. Ayrı bir DB sorgusu gerekmez — zaten sayfada bulunan
 * `reviews` dizisi üzerinden hesaplanır.
 */
export function RatingDistribution({ reviews }: { reviews: ReviewWithScores[] }) {
  const buckets = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(overallOf(r)) === star).length;
    return { star, count };
  });
  const max = Math.max(1, ...buckets.map((b) => b.count));

  return (
    <div className="space-y-1.5">
      {buckets.map((b) => (
        <div key={b.star} className="flex items-center gap-2 text-xs">
          <span className="w-3 text-muted-foreground">{b.star}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className="w-4 text-right font-mono text-muted-foreground">
            {b.count}
          </span>
        </div>
      ))}
    </div>
  );
}
