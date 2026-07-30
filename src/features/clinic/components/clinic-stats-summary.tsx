import { Card, CardContent } from "@/components/ui/card";
import { ScoreBar } from "@/components/score-bar";
import { formatCount, formatPercentage, formatScore } from "@/lib/format-score";
import type { ClinicStats } from "@/types";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="font-mono text-xl font-semibold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ClinicStatsSummary({ stats }: { stats: ClinicStats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox label="Değerlendirme" value={stats.reviewCount.toString()} />
        <StatBox label="Genel puan" value={formatScore(stats.avgOverallScore)} />
        <StatBox label="Öneri oranı" value={formatPercentage(stats.recommendPercentage)} />
        <StatBox label="Aylık nöbet" value={formatCount(stats.avgMonthlyShifts)} />
      </div>

      <Card>
        <CardContent className="space-y-3">
          <ScoreBar label="Eğitim kalitesi" value={stats.avgEducationScore} />
          <ScoreBar label="Akademik fırsatlar" value={stats.avgAcademicScore} />
          <ScoreBar label="Finansal memnuniyet" value={stats.avgIncentiveScore} />
          <ScoreBar label="Sosyal ortam" value={stats.avgColleagueScore} />
          <ScoreBar label="Yönetim desteği" value={stats.avgManagementScore} />
          <ScoreBar label="Şehir / yaşam kalitesi" value={stats.avgCityScore} />
        </CardContent>
      </Card>
    </div>
  );
}
