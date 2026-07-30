import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Hastane/klinik detay sayfalarındaki ortak başlık bloğu. `badgeLabel`
 * opsiyonel: hastane detayında hastane türü rozeti için kullanılır,
 * klinik detayında (rozet olmadığı için) atlanır.
 */
export function DetailPageHeader({
  title,
  subtitle,
  badgeLabel,
}: {
  title: string;
  subtitle: ReactNode;
  badgeLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {badgeLabel && (
        <Badge variant="secondary" className="shrink-0">
          {badgeLabel}
        </Badge>
      )}
    </div>
  );
}
