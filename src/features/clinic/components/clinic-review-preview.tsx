import Link from "next/link";
import { Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicReviewSummary } from "@/features/clinic/components/public-review-summary";
import type { ReviewSummary } from "@/lib/repositories/public-review-summary";

type Preview = { comment: string; rating: number };

export function ClinicReviewPreview({ clinicId, previews, summary, pending }: {
  clinicId: string;
  previews: Preview[];
  summary?: ReviewSummary;
  pending: boolean;
}) {
  const remaining = Math.max(0, (summary?.count ?? 0) - previews.length);
  const profileHref = `/profile?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`;

  return (
    <section aria-labelledby="clinic-reviews" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="clinic-reviews" className="text-lg font-semibold text-slate-900">Hekim yorumları</h2>
        <PublicReviewSummary summary={summary} />
      </div>
      {previews.map(({ comment, rating }, index) => (
        <article key={index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="flex gap-0.5" role="img" aria-label={`5 üzerinden ${rating} yıldız`}>
              {Array.from({ length: 5 }, (_, star) => (
                <Star key={star} aria-hidden="true" className={`size-4 fill-current ${star < rating ? "text-teal-700" : "text-slate-300"}`} />
              ))}
            </span>
            <span className="text-sm font-medium text-slate-600">Anonim hekim</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-slate-900">{comment}</p>
        </article>
      ))}
      <div className="space-y-3 rounded-xl border border-teal-100 bg-teal-50 p-4">
        <h3 className="flex items-start gap-2 text-base font-semibold text-slate-900">
          <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal-700" />
          {remaining > 0 && previews.length > 0
            ? `Bu klinikte ${remaining} yorum daha var`
            : remaining > 0 ? "Yorumları okumak için hekim onayı gerekiyor" : "Yorum yazmak için hekim onayı gerekiyor"}
        </h3>
        {remaining > 0 && <p className="text-sm leading-relaxed text-slate-700">Hekim onayıyla tüm yorumları okuyabilir ve yorum yazabilirsin.</p>}
        {pending ? (
          <p role="status" className="rounded-md bg-white px-3 py-2 text-center text-sm font-medium text-teal-900">Belgen incelemede</p>
        ) : (
          <Button asChild className="min-h-11 w-full bg-teal-700 text-white hover:bg-teal-800">
            <Link prefetch={false} href={profileHref}>Hekim hesabını doğrula</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
