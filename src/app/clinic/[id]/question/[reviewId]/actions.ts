"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendPrivateQuestionNotification } from "@/lib/email/private-question-notifications";

function errorUrl(clinicId: string, reviewId: string, message: string): string {
  return `/clinic/${clinicId}/question/${reviewId}?error=${encodeURIComponent(message)}`;
}

const CONTACT_PATTERN = /(instagram|insta\b|telegram|whatsapp|telefon|numara|gsm|@[a-z0-9._]{3,}|(?:\+?90\s*)?(?:5\d{2})[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2})/i;

export async function createReviewQuestion(formData: FormData) {
  const clinicId = String(formData.get("clinicId") ?? "");
  const reviewId = String(formData.get("reviewId") ?? "");
  const question = String(formData.get("question") ?? "").trim();

  if (!clinicId || !reviewId) redirect("/search");
  if (question.length < 10) redirect(errorUrl(clinicId, reviewId, "Sorunuz en az 10 karakter olmalıdır."));
  if (question.length > 600) redirect(errorUrl(clinicId, reviewId, "Sorunuz en fazla 600 karakter olabilir."));
  if (CONTACT_PATTERN.test(question)) redirect(errorUrl(clinicId, reviewId, "Güvenlik ve mahremiyet için iletişim bilgisi veya sosyal medya hesabı paylaşmayın."));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}/question/${reviewId}`)}`);

  const { data: recentQuestions } = await supabase
    .from("review_questions")
    .select("id")
    .eq("asker_doctor_id", auth.user.id)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(6);

  if ((recentQuestions?.length ?? 0) >= 5) {
    redirect(errorUrl(clinicId, reviewId, "Bir günde en fazla 5 deneyim sorusu gönderebilirsiniz. Lütfen daha sonra tekrar deneyin."));
  }

  const { data: existingQuestion } = await supabase
    .from("review_questions")
    .select("id")
    .eq("review_id", reviewId)
    .eq("asker_doctor_id", auth.user.id)
    .is("answer", null)
    .maybeSingle();

  if (existingQuestion) {
    redirect(errorUrl(clinicId, reviewId, "Bu deneyim için zaten yanıt bekleyen bir sorunuz var."));
  }

  const { data: questionId, error } = await supabase.rpc("create_review_question", {
    p_review_id: reviewId,
    p_question: question,
  });

  if (error) redirect(errorUrl(clinicId, reviewId, error.message));

  if (questionId) {
    const { data: savedQuestion } = await supabase.from("review_questions").select("author_doctor_id").eq("id", questionId).maybeSingle();
    if (savedQuestion) {
      await sendPrivateQuestionNotification({ recipientUserId: savedQuestion.author_doctor_id, kind: "new_question" });
    }
  }

  redirect("/questions?sent=1");
}
