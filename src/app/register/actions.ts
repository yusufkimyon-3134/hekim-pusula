"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("security purposes") ||
    normalized.includes("after") && normalized.includes("seconds") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "Çok kısa sürede birden fazla istek gönderildi. Lütfen yaklaşık 1 dakika bekleyip tekrar deneyin.";
  }

  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Bu e-posta adresiyle zaten bir hesap bulunuyor. Giriş yapmayı deneyin.";
  }

  return "Kayıt işlemi tamamlanamadı. Lütfen kısa bir süre sonra tekrar deneyin.";
}

export async function register(formData: FormData) {
  const acceptedKvkk = formData.get("acceptKvkk") === "on";
  const acceptedTerms = formData.get("acceptTerms") === "on";

  if (!acceptedKvkk || !acceptedTerms) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Devam edebilmek için KVKK Aydınlatma Metni'ni ve Kullanım Koşulları'nı onaylaman gerekiyor."
      )}`
    );
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/profile`,
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(getFriendlyAuthError(error.message))}`);
  }

  redirect("/register?checkEmail=1");
}
