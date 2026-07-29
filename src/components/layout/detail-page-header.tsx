import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Hastane/klinik detay sayfalarındaki ortak başlık bloğu.
 * Sprint 1'de `hospital/[id]` ve `clinic/[id]` sayfaları birebir aynı
 * işaretlemeyi tekrarlıyordu; bu bileşen tek kaynak haline getiriyor.
 */
export function DetailPageHeader({
  title,
  subtitle,
  badgeLabel,
}: {
  title: string;
  subtitle: ReactNode;
  badgeLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Badge variant="secondary">{badgeLabel}</Badge>
    </div>
  );
}
