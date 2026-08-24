import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClinicSummaryResult } from "@/lib/ai/types";

/**
 * AI özetini gösterir. Teknik servis/yapılandırma ayrıntıları son kullanıcıya
 * gösterilmez; özet üretilemezse güvenli ve ürün odaklı bir mesaj gösterilir.
 */
export function AiClinicSummaryCard({
  result,
  unavailableReason,
}: {
  result: ClinicSummaryResult | null;
  unavailableReason?: string;
}) {
  const isInsufficientData =
    unavailableReason?.toLocaleLowerCase("tr-TR").includes("yetersiz") ||
    unavailableReason?.toLocaleLowerCase("tr-TR").includes("insufficient");

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-accent/40 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-foreground" />
          <CardTitle className="text-base">AI Özeti</CardTitle>
          <Badge variant="soft" className="ml-auto text-[10px]">
            Deneysel
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Güçlü yönler: </span>
              {result.strengths}
            </p>
            <p>
              <span className="font-medium">Zayıf yönler: </span>
              {result.weaknesses}
            </p>
            <p>
              <span className="font-medium">Genel değerlendirme: </span>
              {result.recommendation}
            </p>
            <p className="text-xs text-muted-foreground">
              Bu özet yalnızca {result.basedOnReviewCount} onaylı, yorumlu
              değerlendirmeye dayanıyor — kendi yargını oluşturmak için
              aşağıdaki gerçek yorumları da okumanı öneririz.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isInsufficientData
              ? "AI özeti için henüz yeterli sayıda hekim deneyimi bulunmuyor. Yeni değerlendirmeler geldikçe bu bölüm otomatik olarak güncellenecek."
              : "AI özeti şu anda hazırlanıyor. Bu klinikteki hekim deneyimleri aşağıdaki değerlendirmelerden incelenebilir."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
