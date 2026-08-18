import { ThumbsUp } from "lucide-react";
import { voteHelpful } from "@/app/clinic/[id]/actions";

export function HelpfulVoteButton({
  reviewId,
  clinicId,
  helpfulCount,
}: {
  reviewId: string;
  clinicId: string;
  helpfulCount: number;
}) {
  return (
    <form action={voteHelpful}>
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="clinicId" value={clinicId} />
      <button
        type="submit"
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <ThumbsUp className="size-3.5" />
        Faydalı ({helpfulCount})
      </button>
    </form>
  );
}
