"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function answerReviewQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();

  if (!questionId || answer.length < 10) {
    redirect("/questions?error=Yanıtınız en az 10 karakter olmalıdır.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/questions");

  const { error } = await supabase.rpc("answer_review_question", {
    p_question_id: questionId,
    p_answer: answer,
  });

  if (error) redirect(`/questions?error=${encodeURIComponent(error.message)}`);
  redirect("/questions?answered=1");
}
