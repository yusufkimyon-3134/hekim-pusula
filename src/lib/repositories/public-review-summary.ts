import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ReviewSummary = { count: number; lastVerifiedAt: string | null };

export async function getPublicReviewSummaries(clinicIds: string[]) {
  const summaries = new Map<string, ReviewSummary>();
  if (!clinicIds.length) return summaries;

  const client = await createClient();
  for (let start = 0; start < clinicIds.length; start += 40) {
    const { data, error } = await client
      .from("public_clinic_review_summaries")
      .select("clinic_id, review_count, last_verified_at")
      .in("clinic_id", clinicIds.slice(start, start + 40));

    if (error) {
      console.error("[public-review-summary]", error.message);
      return null;
    }
    for (const row of data) {
      summaries.set(row.clinic_id, {
        count: row.review_count,
        lastVerifiedAt: row.last_verified_at,
      });
    }
  }
  return summaries;
}
