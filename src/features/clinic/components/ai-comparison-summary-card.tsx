import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AiComparisonSummaryCard({
  narrative,
  unavailableReason,
}: {
  narrative: string | null;
  unavailableReason?: string;
}) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-accent/40 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-foreground" />
          <CardTitle className="text-base">AI Karşılaştırma</CardTitle>
          <Badge variant="soft" className="ml-auto text-[10px]">
            Deneysel
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          {narrative ?? unavailableReason ?? "AI karşılaştırması şu an kullanılamıyor."}
        </p>
      </CardContent>
    </Card>
  );
}
