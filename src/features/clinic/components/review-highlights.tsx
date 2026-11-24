import { Quote } from "lucide-react";
import type { ReviewWithScores } from "@/types";

export function ReviewHighlights({ reviews }: { reviews: ReviewWithScores[] }) {
  const highlights = reviews.filter((r) => r.comment && r.comment.length > 0).slice(0, 2);

  if (highlights.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {highlights.map((r) => (
        <a
          key={r.id}
          href={`#review-${r.id}`}
          className="block rounded-lg border border-border bg-card p-4 text-sm leading-relaxed transition-colors hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Quote aria-hidden="true" className="mb-1.5 size-4 text-muted-foreground/50" />
          <p className="line-clamp-4">{r.comment}</p>
          <span className="mt-2 block font-medium text-primary underline-offset-4 hover:underline">Yorumun tamamını oku</span>
        </a>
      ))}
    </div>
  );
}
