"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewRepository } from "@/lib/repositories/review-repository";
import { reviewSchema } from "@/lib/validations/review";

export async function submitReview(formData: FormData) {
  const clinicId = formData.get("clinicId")?.toString() ?? "";

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}/review`)}`);
  }

  const parsed = reviewSchema.safeParse({
    clinicId,
    monthlyShifts: formData.get("monthlyShifts"),
    dailyPatients: formData.get("dailyPatients"),
    servicePatients: formData.get("servicePatients"),
    wouldChooseAgain: formData.get("wouldChooseAgain"),
    comment: formData.get("comment") || undefined,
    incentiveScore: formData.get("incentiveScore"),
    colleagueScore: formData.get("colleagueScore"),
    managementScore: formData.get("managementScore"),
    cityScore: formData.get("cityScore"),
    educationScore: formData.get("educationScore"),
    academicScore: formData.get("academicScore"),
  });

  if (!parsed.success) {
    redirect(
      `/clinic/${clinicId}/review?error=${encodeURIComponent(parsed.error.issues[0].message)}`
    );
  }

  const reviewRepository = new ReviewRepository(supabase);

  let errorMessage: string | null = null;
  try {
    await reviewRepository.create(parsed.data);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Bilinmeyen hata";
  }

  if (errorMessage) {
    redirect(`/clinic/${clinicId}/review?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(`/clinic/${clinicId}?shared=1`);
}
