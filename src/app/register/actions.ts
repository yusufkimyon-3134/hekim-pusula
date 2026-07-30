"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // Not: Supabase projesinde e-posta doğrulaması açıksa, bu noktada
  // henüz aktif bir oturum olmayabilir (kullanıcı e-postasını
  // onaylayana kadar). Bu durumda /profile kullanıcıyı zaten /login'e
  // geri yönlendirecek — bkz. profile/page.tsx.
  redirect("/profile");
}
