"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function errorUrl(clinicId: string, reviewId: string, message: string): string {
  return `/clinic/${clinicId}/question/${reviewId}?error=${encodeURIComponent(message)}`;
}

export async function createReviewQuestion(formData: FormData) {
  const clinicId = String(formData.get("clinicId") ?? "");
  const reviewId = String(formData.get("reviewId") ?? "");
  const question = String(formData.get("question") ?? "").trim();

  if (!clinicId || !reviewId) redirect("/search");
  if (question.length < 10) {
    redirect(errorUrl(clinicId, reviewId, "Sorunuz en az 10 karakter olmalıdır."));
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}/question/${reviewId}`)}`);
  }

  const { error } = await supabase.rpc("create_review_question", {
    p_review_id: reviewId,
    p_question: question,
  });

  if (error) {
    redirect(errorUrl(clinicId, reviewId, error.message));
  }

  redirect("/questions?sent=1");
}
