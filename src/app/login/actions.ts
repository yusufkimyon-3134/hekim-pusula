"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function login(formData: FormData) {
  const redirectTo = safeRedirectPath(
    formData.get("redirectTo")?.toString(),
    "/profile"
  );

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      `/login?error=${encodeURIComponent(parsed.error.issues[0].message)}&redirectTo=${encodeURIComponent(redirectTo)}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Supabase'in İngilizce teknik hata metnini kullanıcıya göstermeyelim.
    const message =
      error.code === "invalid_credentials"
        ? "E-posta veya şifre hatalı."
        : error.code === "email_not_confirmed"
          ? "E-posta adresini doğrulaman gerekiyor. Gelen kutunu kontrol et."
          : error.status === 429
            ? "Çok fazla giriş denemesi yapıldı. Biraz bekleyip tekrar dene."
            : "Giriş yapılamadı. Lütfen biraz sonra tekrar dene.";

    redirect(
      `/login?error=${encodeURIComponent(message)}&redirectTo=${encodeURIComponent(redirectTo)}`
    );
  }

  redirect(redirectTo);
}
