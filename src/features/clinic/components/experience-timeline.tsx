import { Clock } from "lucide-react";

/**
 * Henüz hiç deneyim yokken, ileride deneyimlerin zaman içinde nasıl
 * birikeceğini ima eden zarif bir "boş" zaman çizelgesi. Sayfanın imza
 * öğesi: kesikli dikey çizgi + tek bir "hayalet" düğüm, "bir şey burada
 * birikmeye başlayacak" hissini veriyor — jenerik bir "veri yok" kutusu
 * yerine.
 */
export function ExperienceTimeline() {
  return (
    <div className="relative pl-8">
      <div
        className="absolute top-1 left-[13px] h-full border-l-2 border-dashed border-border"
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-3.5">
        <div className="absolute -left-8 flex size-7 items-center justify-center rounded-full border-2 border-dashed border-border bg-background">
          <Clock className="size-3.5 text-muted-foreground" />
        </div>
        <div className="space-y-1 pt-0.5">
          <p className="text-sm font-medium text-muted-foreground">
            İlk deneyim burada görünecek
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            Bir hekim bu klinik hakkında deneyimini paylaştığında, zaman
            çizelgesi burada birikmeye başlayacak.
          </p>
        </div>
      </div>
    </div>
  );
}
