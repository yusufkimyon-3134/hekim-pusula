import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LegalAcceptanceRepository } from "@/lib/repositories/legal-acceptance-repository";
import { safeRedirectPath } from "@/lib/safe-redirect";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = safeRedirectPath(url.searchParams.get("next"), "/profile");

  const supabase = await createClient();

  let errorMessage: string | null = null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    errorMessage = error?.message ?? null;
  } else if (code) {
    // Backward compatibility for confirmation links generated with
    // Supabase's default ConfirmationURL / PKCE redirect flow.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorMessage = error?.message ?? null;
  } else {
    errorMessage = "Doğrulama bağlantısı geçersiz veya eksik.";
  }

  if (errorMessage) {
    console.error("[auth/confirm] E-posta doğrulaması başarısız:", errorMessage);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "error",
      "E-posta doğrulaması tamamlanamadı. Lütfen yeni bir aktivasyon e-postası iste ve en son gelen bağlantıyı kullan."
    );
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await new LegalAcceptanceRepository(supabase).recordAcceptance(user.id);
    } catch (acceptanceError) {
      console.error("[auth/confirm] Hukuki kabul kaydı yazılamadı:", acceptanceError);
    }
  }

  const redirectTo = new URL(next, request.url);
  redirectTo.search = "";
  return NextResponse.redirect(redirectTo);
}
