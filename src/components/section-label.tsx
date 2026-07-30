import type { ReactNode } from "react";

/**
 * Arama, hastane detay ve klinik detay sayfalarında tekrarlanan
 * "HASTANELER (3)" tarzı bölüm başlığı stilini tek yerde topluyor.
 */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}
