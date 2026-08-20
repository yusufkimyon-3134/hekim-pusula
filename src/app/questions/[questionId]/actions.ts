"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendThreadMessage(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!questionId || !body) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?redirectTo=${encodeURIComponent(`/questions/${questionId}`)}`);

  const { error } = await (supabase as any).rpc("send_review_question_message", {
    p_question_id: questionId,
    p_body: body,
  });
  if (error) redirect(`/questions/${questionId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/questions/${questionId}`);
  redirect(`/questions/${questionId}`);
}

export async function setContactConsent(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const consent = String(formData.get("consent") ?? "") === "true";
  if (!questionId) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?redirectTo=${encodeURIComponent(`/questions/${questionId}`)}`);

  const { error } = await (supabase as any).rpc("set_review_question_contact_consent", {
    p_question_id: questionId,
    p_consent: consent,
  });
  if (error) redirect(`/questions/${questionId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/questions/${questionId}`);
  redirect(`/questions/${questionId}`);
}
