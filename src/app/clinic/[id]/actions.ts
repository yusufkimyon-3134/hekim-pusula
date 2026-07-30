"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/lib/repositories/review-repository";
import { ReportRepository } from "@/lib/repositories/report-repository";
import { reportSchema } from "@/lib/validations/report";

export async function voteHelpful(formData: FormData) {
  const reviewId = formData.get("reviewId")?.toString() ?? "";
  const clinicId = formData.get("clinicId")?.toString() ?? "";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  }

  const reviewRepository = new ReviewRepository(supabase);
  try {
    await reviewRepository.voteHelpful(reviewId, userData.user.id);
  } catch {
    // Sessizce yut: en olası sebep "zaten oy verdin" (bileşik PK) —
    // kullanıcı için bir hata değil, sonuç zaten istediği durum.
  }

  revalidatePath(`/clinic/${clinicId}`);
  redirect(`/clinic/${clinicId}`);
}

export async function deleteReview(formData: FormData) {
  const reviewId = formData.get("reviewId")?.toString() ?? "";
  const clinicId = formData.get("clinicId")?.toString() ?? "";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  }

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
  if (!userData.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}`)}`);
  }

  const parsed = reportSchema.safeParse({
    reviewId,
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect(`/clinic/${clinicId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const reportRepository = new ReportRepository(supabase);
  try {
    await reportRepository.create(parsed.data.reviewId, userData.user.id, parsed.data.reason);
  } catch {
    // Zaten raporlanmışsa (aynı kullanıcı ikinci kez) sessizce yut.
  }

  revalidatePath(`/clinic/${clinicId}`);
  redirect(`/clinic/${clinicId}?reported=1`);
}
