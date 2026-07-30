import { formatScore } from "@/lib/format-score";

/**
 * 1-5 arası bir puanı yatay bir çubuk + sayısal değer olarak gösterir.
 * Karşılaştırma, istatistik ve sıralama sayfalarında tekrar kullanılıyor.
 */
export function ScoreBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const pct = value ? Math.min(100, Math.max(0, (value / 5) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{formatScore(value)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
