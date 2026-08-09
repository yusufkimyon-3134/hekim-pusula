"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPrivateQuestionNotification } from "@/lib/email/private-question-notifications";

export async function answerReviewQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();

  if (!questionId || answer.length < 10) {
    redirect("/questions?error=Yanıtınız en az 10 karakter olmalıdır.");
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/questions");

  const { data: question } = await supabase
    .from("review_questions")
    .select("asker_doctor_id")
    .eq("id", questionId)
    .maybeSingle();

  const { error } = await supabase.rpc("answer_review_question", {
    p_question_id: questionId,
    p_answer: answer,
  });

  if (error) redirect(`/questions?error=${encodeURIComponent(error.message)}`);

  // Bildirim gönderilemese bile yanıt başarıyla kaydedilmiş kalır.
  if (question) {
    await sendPrivateQuestionNotification({
      recipientUserId: question.asker_doctor_id,
      kind: "new_answer",
    });
  }

  redirect("/questions?answered=1");
}
