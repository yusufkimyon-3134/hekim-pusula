"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/lib/repositories/review-repository";
import { ReportRepository } from "@/lib/repositories/report-repository";
import { reportSchema } from "@/lib/validations/report";

export async function confirmReviewCurrent(formData: FormData) {
  const reviewId = formData.get("reviewId")?.toString() ?? "";
  const clinicId = formData.get("clinicId")?.toString() ?? "";
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  const { error } = await supabase.rpc("confirm_review_current" as never, { p_review_id: reviewId } as never);
  if (error) redirect(`/clinic/${clinicId}?error=${encodeURIComponent("Güncellik doğrulanamadı.")}`);
  revalidatePath(`/clinic/${clinicId}`);
  redirect(`/clinic/${clinicId}?confirmed=1`);
}

export async function voteHelpful(formData: FormData) {
  const reviewId = formData.get("reviewId")?.toString() ?? "";
  const clinicId = formData.get("clinicId")?.toString() ?? "";
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  const reviewRepository = new ReviewRepository(supabase);
  try { await reviewRepository.voteHelpful(reviewId, userData.user.id); } catch {}
  revalidatePath(`/clinic/${clinicId}`);
  redirect(`/clinic/${clinicId}`);
}

export async function deleteReview(formData: FormData) {
  const reviewId = formData.get("reviewId")?.toString() ?? "";
  const clinicId = formData.get("clinicId")?.toString() ?? "";
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  const reviewRepository = new ReviewRepository(supabase);
  await reviewRepository.delete(reviewId);
  revalidatePath(`/clinic/${clinicId}`);
  redirect(`/clinic/${clinicId}?deleted=1`);
}

export async function submitReport(formData: FormData) {
  const reviewId = formData.get("reviewId")?.toString() ?? "";
  const clinicId = formData.get("clinicId")?.toString() ?? "";
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  const parsed = reportSchema.safeParse({ reviewId, reason: formData.get("reason") });
  if (!parsed.success) redirect(`/clinic/${clinicId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const reportRepository = new ReportRepository(supabase);
  try { await reportRepository.create(parsed.data.reviewId, userData.user.id, parsed.data.reason); } catch {}
  revalidatePath(`/clinic/${clinicId}`);
  redirect(`/clinic/${clinicId}?reported=1`);
}

export async function setClinicReviewPreview(formData: FormData) {
  const clinicId = String(formData.get("clinicId") ?? "");
  const reviewId = String(formData.get("reviewId") ?? "");
  const clinicPath = `/clinic/${encodeURIComponent(clinicId)}`;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user?.app_metadata?.role !== "admin") redirect(clinicPath);

  const result = await supabase.rpc("admin_set_clinic_review_preview", {
    p_clinic_id: clinicId,
    p_review_id: reviewId,
    p_comment: String(formData.get("comment") ?? ""),
    p_enabled: formData.get("enabled") === "true",
  });
  if (result.error || !result.data) redirect(`${clinicPath}?previewError=1#review-${encodeURIComponent(reviewId)}`);
  revalidatePath(clinicPath);
  redirect(`${clinicPath}#review-${encodeURIComponent(reviewId)}`);
}
