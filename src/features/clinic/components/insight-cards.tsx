import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { InsightCard } from "@/lib/ai/types";

/**
 * Sprint 8: "AI Insights" — tamamı gerçek, hesaplanmış verilerden
 * türetilir (bkz. `src/lib/ai/services/insights-service.ts`), LLM
 * kullanılmaz. Hiç kart yoksa (yeterli veri/eğilim tespit edilmediyse)
 * hiçbir şey render edilmez — boş bir "yeterli veri yok" kartı bile
 * göstermeye gerek yok, çünkü bu bölüm zaten opsiyonel bir ek bilgi.
 */
export function InsightCards({ insights }: { insights: InsightCard[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight) => (
        <Card key={insight.title}>
          <CardContent className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent">
              <TrendingUp className="size-4 text-accent-foreground" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {insight.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
