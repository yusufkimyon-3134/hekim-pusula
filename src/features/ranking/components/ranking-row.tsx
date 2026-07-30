import Link from "next/link";
import { formatCount, formatPercentage, formatScore } from "@/lib/format-score";
import type { ClinicRanking } from "@/types";

export function RankingRow({
  ranking,
  position,
}: {
  ranking: ClinicRanking;
  position: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 sm:gap-4 sm:p-4">
      <label className="flex shrink-0 items-center">
        <input
          type="checkbox"
          name="clinicId"
          value={ranking.clinicId}
          className="size-4"
          aria-label={`${ranking.hospitalName} kliniğini karşılaştırmak için seç`}
        />
      </label>

      <span className="w-5 shrink-0 text-center font-mono text-sm text-muted-foreground">
        {position}
      </span>

      <div className="min-w-0 flex-1">
        <Link
          href={`/clinic/${ranking.clinicId}`}
          className="truncate text-sm font-medium hover:underline underline-offset-2"
        >
          {ranking.hospitalName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {ranking.hospitalDistrict}, {ranking.hospitalCity}
        </p>
      </div>

      <div className="hidden shrink-0 gap-4 text-xs text-muted-foreground sm:flex">
        <span>
          Genel <b className="font-mono text-foreground">{formatScore(ranking.avgOverallScore)}</b>
        </span>
        <span>
          Nöbet <b className="font-mono text-foreground">{formatCount(ranking.avgMonthlyShifts)}</b>
        </span>
        <span>
          Öneri <b className="font-mono text-foreground">{formatPercentage(ranking.recommendPercentage)}</b>
        </span>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {ranking.reviewCount} yorum
      </span>
    </div>
  );
}
