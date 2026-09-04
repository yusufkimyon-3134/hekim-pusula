"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

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
  if (formData.get("acceptLegal") !== "on") redirect(`/register?error=${encodeURIComponent("Devam etmek için KVKK metnini ve Kullanım Koşullarını onaylaman gerekiyor.")}`);

  const parsed = registerSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);

  const email = parsed.data.email.trim().toLowerCase();
  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password: parsed.data.password, options: { emailRedirectTo: `${origin}/auth/callback?next=/profile` } });
  if (error) redirect(`/register?error=${encodeURIComponent(getFriendlyAuthError(error.message))}`);
  redirect(`/register?checkEmail=1&email=${encodeURIComponent(email)}`);
}

export async function resendActivation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) redirect(`/register?checkEmail=1&error=${encodeURIComponent("Geçerli bir e-posta adresi gerekli.")}`);

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${origin}/auth/callback?next=/profile` } });
  if (error) redirect(`/register?checkEmail=1&email=${encodeURIComponent(email)}&error=${encodeURIComponent(getFriendlyAuthError(error.message))}`);
  redirect(`/register?checkEmail=1&email=${encodeURIComponent(email)}&resent=1`);
}
