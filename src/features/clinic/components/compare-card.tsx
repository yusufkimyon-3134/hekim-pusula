import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/score-bar";
import { HOSPITAL_TYPE_LABELS } from "@/lib/hospital-type";
import { formatCount, formatPercentage } from "@/lib/format-score";
import type { ClinicStats, ClinicWithHospital } from "@/types";

export function CompareCard({
  clinic,
  stats,
}: {
  clinic: ClinicWithHospital;
  stats: ClinicStats | null;
}) {
  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary" className="mb-1 w-fit">
          {HOSPITAL_TYPE_LABELS[clinic.hospital.hospitalType]}
        </Badge>
        <CardTitle className="text-lg">{clinic.branch}</CardTitle>
        <Link
          href={`/clinic/${clinic.id}`}
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          {clinic.hospital.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {clinic.hospital.district}, {clinic.hospital.city}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md bg-accent px-3 py-2">
          <span className="text-sm font-medium text-accent-foreground">Genel puan</span>
          <span className="font-mono text-lg font-semibold text-accent-foreground">
            {stats?.avgOverallScore?.toFixed(1) ?? "—"}
          </span>
        </div>

        <div className="space-y-3">
          <ScoreBar label="Eğitim kalitesi" value={stats?.avgEducationScore ?? null} />
          <ScoreBar label="Akademik fırsatlar" value={stats?.avgAcademicScore ?? null} />
          <ScoreBar label="Finansal memnuniyet" value={stats?.avgIncentiveScore ?? null} />
          <ScoreBar label="Sosyal ortam" value={stats?.avgColleagueScore ?? null} />
          <ScoreBar label="Yönetim desteği" value={stats?.avgManagementScore ?? null} />
          <ScoreBar label="Şehir / yaşam kalitesi" value={stats?.avgCityScore ?? null} />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-center text-xs">
          <div>
            <p className="text-muted-foreground">Aylık nöbet</p>
            <p className="font-mono text-sm font-medium">
              {formatCount(stats?.avgMonthlyShifts)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Öneri oranı</p>
            <p className="font-mono text-sm font-medium">
              {formatPercentage(stats?.recommendPercentage)}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {stats?.reviewCount ?? 0} değerlendirmeye dayanıyor
        </p>
      </CardContent>
    </Card>
  );
}
