import { Quote } from "lucide-react";
import type { ReviewWithScores } from "@/types";

export function ReviewHighlights({ reviews }: { reviews: ReviewWithScores[] }) {
  const highlights = reviews.filter((r) => r.comment && r.comment.length > 0).slice(0, 2);

  if (highlights.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {highlights.map((r) => (
        <blockquote
          key={r.id}
          className="rounded-lg border border-border bg-card p-4 text-sm leading-relaxed"
        >
          <Quote className="mb-1.5 size-4 text-muted-foreground/50" />
          <p className="line-clamp-4">{r.comment}</p>
        </blockquote>
      ))}
    </div>
  );
}
