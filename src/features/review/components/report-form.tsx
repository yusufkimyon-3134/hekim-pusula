import { Flag } from "lucide-react";
import { NativeSelect } from "@/components/ui/native-select";
import { submitReport } from "@/app/clinic/[id]/actions";
import { REPORT_REASONS, REPORT_REASON_LABELS } from "@/lib/validations/report";

export function ReportForm({ reviewId, clinicId }: { reviewId: string; clinicId: string }) {
  return (
    <details className="group">
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive">
        <Flag className="size-3.5" />
        Bildir
      </summary>
      <form
        action={submitReport}
        className="mt-2 flex flex-wrap items-center gap-2 rounded-md border border-border bg-card p-2"
      >
        <input type="hidden" name="reviewId" value={reviewId} />
        <input type="hidden" name="clinicId" value={clinicId} />
        <NativeSelect name="reason" required className="h-8 w-auto text-xs">
          <option value="">Sebep seç…</option>
          {REPORT_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REPORT_REASON_LABELS[reason]}
            </option>
          ))}
        </NativeSelect>
        <button
          type="submit"
          className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground"
        >
          Gönder
        </button>
      </form>
    </details>
  );
}
