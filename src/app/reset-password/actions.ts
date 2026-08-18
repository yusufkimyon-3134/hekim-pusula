"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { newPasswordSchema } from "@/lib/validations/auth";

export async function updatePassword(formData: FormData) {
  const parsed = newPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) redirect(`/reset-password?error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/forgot-password?error=${encodeURIComponent("Şifre yenileme bağlantısının süresi dolmuş veya bağlantı geçersiz. Lütfen yeni bir bağlantı iste.")}`);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent("Şifre değiştirilemedi. Lütfen tekrar dene veya yeni bir bağlantı iste.")}`);

  await supabase.auth.signOut();
  redirect("/login?passwordReset=1");
}
