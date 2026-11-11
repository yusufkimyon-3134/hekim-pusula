import type { ReviewSummary } from "@/lib/repositories/public-review-summary";

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export function PublicReviewSummary({ summary }: { summary?: ReviewSummary }) {
  return (
    <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <span>{summary?.count ? `${summary.count} hekim değerlendirmesi` : "Henüz değerlendirme yok"}</span>
      {summary?.lastVerifiedAt && (
        <span>· Son yorum teyidi: <time dateTime={summary.lastVerifiedAt}>{dateFormat.format(new Date(summary.lastVerifiedAt))}</time></span>
      )}
    </p>
  );
}
