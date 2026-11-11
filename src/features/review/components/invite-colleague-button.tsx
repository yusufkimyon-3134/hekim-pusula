"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InviteColleagueButton({ clinicUrl }: { clinicUrl: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "manual">("idle");

  async function shareClinic() {
    setStatus("idle");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Hekim Pusula",
          text: "Bu klinikte çalıştıysan deneyimini Hekim Pusula’da paylaşabilirsin.",
          url: clinicUrl,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(clinicUrl);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" size="sm" onClick={shareClinic}>
        <Share2 aria-hidden="true" />
        Bir meslektaşını davet et
      </Button>
      <div role="status" className="text-sm text-muted-foreground">
        {status === "copied" && "Klinik bağlantısı kopyalandı."}
        {status === "manual" && "Klinik bağlantısını aşağıdan kopyalayabilirsin."}
      </div>
      {status === "manual" && (
        <input
          aria-label="Klinik bağlantısı"
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={clinicUrl}
          readOnly
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </div>
  );
}
