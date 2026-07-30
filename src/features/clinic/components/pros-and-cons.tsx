import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ClinicStats } from "@/types";

/**
 * "Artı/eksi" burada bir yapay zeka/metin analizi çıktısı DEĞİL — kategori
 * ortalamalarının en yükseği/en düşüğü. Bu, dürüst ve açıklanabilir bir
 * yöntem: hangi somut boyutun göreceli olarak güçlü/zayıf olduğunu
 * gösteriyor, yorum metnini yorumlamıyor.
 */
export function ProsAndCons({ stats }: { stats: ClinicStats }) {
  const categories = [
    { label: "Eğitim kalitesi", value: stats.avgEducationScore },
    { label: "Akademik fırsatlar", value: stats.avgAcademicScore },
    { label: "Finansal memnuniyet", value: stats.avgIncentiveScore },
    { label: "Sosyal ortam", value: stats.avgColleagueScore },
    { label: "Yönetim desteği", value: stats.avgManagementScore },
    { label: "Şehir / yaşam kalitesi", value: stats.avgCityScore },
  ].filter((c): c is { label: string; value: number } => c.value !== null);

  if (categories.length < 2) return null;

  const sorted = [...categories].sort((a, b) => b.value - a.value);
  const pros = sorted.slice(0, 2);
  const cons = sorted.slice(-2).reverse();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <ThumbsUp className="size-4" />
            Güçlü yönler
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {pros.map((p) => (
              <li key={p.label}>
                {p.label} <span className="font-mono">({p.value.toFixed(1)})</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <ThumbsDown className="size-4" />
            Dikkat edilmesi gerekenler
          </div>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {cons.map((c) => (
              <li key={c.label}>
                {c.label} <span className="font-mono">({c.value.toFixed(1)})</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
