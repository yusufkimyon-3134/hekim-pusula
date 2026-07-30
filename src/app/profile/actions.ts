"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { profileSchema } from "@/lib/validations/profile";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const redirectTo = safeRedirectPath(
    formData.get("redirectTo")?.toString(),
    "/profile?saved=1"
  );

  if (!userData.user) {
    redirect("/login");
  }

  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
    role: formData.get("role"),
    specialty: formData.get("specialty"),
    city: formData.get("city") || undefined,
    currentHospital: formData.get("currentHospital") || undefined,
    experienceYear: formData.get("experienceYear") || undefined,
    bio: formData.get("bio") || undefined,
  });

  if (!parsed.success) {
    redirect(`/profile?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const doctorRepository = new DoctorRepository(supabase);

  let errorMessage: string | null = null;
  try {
    await doctorRepository.upsert(userData.user.id, parsed.data);
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Bilinmeyen hata";
  }

  if (errorMessage) {
    redirect(`/profile?error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(redirectTo);
}
