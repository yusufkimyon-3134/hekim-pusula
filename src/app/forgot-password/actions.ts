"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { passwordResetRequestSchema } from "@/lib/validations/auth";

export async function requestPasswordReset(formData: FormData) {
  const parsed = passwordResetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    redirect(`/forgot-password?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? "https://hekimpusula.com.tr";
  const supabase = await createClient();

  // Hesabın var olup olmadığını kullanıcıya açıklamıyoruz. Bu, hesap
  // keşfi (account enumeration) saldırılarına karşı standart davranıştır.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("[forgot-password] reset e-postası gönderilemedi:", error.message);
    // Rate-limit / sağlayıcı hatalarında dahi hesap varlığını sızdırmamak için
    // kullanıcıya aynı genel yanıtı gösteriyoruz.
  }

  redirect("/forgot-password?sent=1");
}
