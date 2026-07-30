import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCount, formatPercentage, formatScore } from "@/lib/format-score";
import type { CareerMatchResult } from "@/lib/ai/services/career-match-service";

export function CareerMatchResultCard({
  result,
  rank,
}: {
  result: CareerMatchResult;
  rank: number;
}) {
  const { clinic, compatibilityScore } = result;
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-xs text-muted-foreground">#{rank}</p>
          <CardTitle className="text-base">
            <Link href={`/clinic/${clinic.clinicId}`} className="hover:underline">
              {clinic.hospitalName}
            </Link>
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {clinic.branch} · {clinic.hospitalCity}
          </p>
        </div>
        <Badge variant="soft" className="shrink-0 font-mono">
          %{compatibilityScore} uyum
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="font-mono text-sm font-medium">{formatScore(clinic.avgOverallScore)}</p>
            <p className="text-muted-foreground">Genel puan</p>
          </div>
          <div>
            <p className="font-mono text-sm font-medium">{formatCount(clinic.avgMonthlyShifts)}</p>
            <p className="text-muted-foreground">Aylık nöbet</p>
          </div>
          <div>
            <p className="font-mono text-sm font-medium">
              {formatPercentage(clinic.recommendPercentage)}
            </p>
            <p className="text-muted-foreground">Öneri oranı</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
