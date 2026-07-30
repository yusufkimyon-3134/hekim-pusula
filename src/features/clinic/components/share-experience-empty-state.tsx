import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ShareExperienceEmptyState() {
  return (
    <Card className="border-dashed bg-card/50">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent">
          <MessageSquarePlus className="size-5 text-accent-foreground" />
        </div>
        <div className="space-y-1.5">
          <p className="font-medium">
            Bu klinik için henüz hiçbir hekim deneyim paylaşmadı.
          </p>
          <p className="text-sm text-muted-foreground">
            Meslektaşlarına yardım eden ilk kişi ol.
          </p>
        </div>
        <Button disabled title="Bu özellik yakında açılacak">
          Deneyimini Paylaş
        </Button>
      </CardContent>
    </Card>
  );
}
