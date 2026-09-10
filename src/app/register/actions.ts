"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

function getFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("security purposes") || (normalized.includes("after") && normalized.includes("seconds")) || normalized.includes("rate limit") || normalized.includes("too many requests")) return "Çok kısa sürede birden fazla istek gönderildi. Yaklaşık 1 dakika sonra tekrar dene.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) return "Bu e-posta ile zaten bir hesap var. Giriş yapabilir veya aktivasyon e-postasını yeniden gönderebilirsin.";
  return "Kayıt tamamlanamadı. Lütfen kısa bir süre sonra tekrar dene.";
}

async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function register(formData: FormData) {
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/profile");
  if (formData.get("acceptLegal") !== "on") redirect(`/register?next=${encodeURIComponent(next)}&error=${encodeURIComponent("Devam etmek için KVKK metnini ve Kullanım Koşullarını onaylaman gerekiyor.")}`);

  const parsed = registerSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect(`/register?next=${encodeURIComponent(next)}&error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  const email = parsed.data.email.trim().toLowerCase();
  const origin = await getOrigin();
  const supabase = await createClient();
  const confirmUrl = `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
  const { error } = await supabase.auth.signUp({ email, password: parsed.data.password, options: { emailRedirectTo: confirmUrl } });
  if (error) redirect(`/register?next=${encodeURIComponent(next)}&error=${encodeURIComponent(getFriendlyAuthError(error.message))}`);
  redirect(`/register?checkEmail=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
}

export async function resendActivation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeRedirectPath(String(formData.get("next") ?? ""), "/profile");
  if (!email || !email.includes("@")) redirect(`/register?checkEmail=1&next=${encodeURIComponent(next)}&error=${encodeURIComponent("Geçerli bir e-posta adresi gerekli.")}`);

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` } });
  if (error) redirect(`/register?checkEmail=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}&error=${encodeURIComponent(getFriendlyAuthError(error.message))}`);
  redirect(`/register?checkEmail=1&email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}&resent=1`);
}
