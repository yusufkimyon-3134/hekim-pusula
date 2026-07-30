import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteReview } from "@/app/clinic/[id]/actions";

export function ReviewOwnerActions({
  reviewId,
  clinicId,
}: {
  reviewId: string;
  clinicId: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/clinic/${clinicId}/review/${reviewId}/edit`}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Pencil className="size-3.5" />
        Düzenle
      </Link>
      <form action={deleteReview}>
        <input type="hidden" name="reviewId" value={reviewId} />
        <input type="hidden" name="clinicId" value={clinicId} />
        <button
          type="submit"
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Sil
        </button>
      </form>
    </div>
  );
}
