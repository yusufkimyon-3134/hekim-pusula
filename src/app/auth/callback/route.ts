import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { LegalAcceptanceRepository } from "@/lib/repositories/legal-acceptance-repository";

/**
 * Supabase'in e-posta aktivasyon/magic-link bağlantılarının döndüğü
 * yer. `code`'u gerçek bir oturuma (`exchangeCodeForSession`) çevirir.
 *
 * Açık yönlendirme (open redirect) riski: `next` parametresi kullanıcı
 * tarafından kontrol edilebilir bir query param olduğu için, doğrudan
 * kullanılmıyor — var olan `safeRedirectPath` (yalnızca site içi göreli
 * path'lere izin veren) yardımcı fonksiyonundan geçiriliyor.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/profile");

  if (!code) {
    return redirectToLogin(
      origin,
      "Aktivasyon bağlantısı geçersiz veya süresi dolmuş."
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Aktivasyon kodu oturuma çevrilemedi:", error.message);
      return redirectToLogin(origin, activationErrorMessage(error.message));
    }

    // Hukuki kabul kaydı yardımcı bir işlemdir. Canlı şema geçici olarak
    // erişilemez olsa bile başarıyla oluşturulan oturumu bozmamalıdır.
    if (data.user) {
      try {
        await new LegalAcceptanceRepository(supabase).recordAcceptance(data.user.id);
      } catch (acceptanceError) {
        console.error("[auth/callback] Hukuki kabul kaydı yazılamadı:", acceptanceError);
      }
    }

    return NextResponse.redirect(new URL(next, origin));
  } catch (error) {
    // Route handler'dan hata fırlarsa Next.js error boundary'si kullanıcıya
    // yanıltıcı bir genel hata ekranı gösteriyordu. Aktivasyon bağlantısı
    // her durumda kontrollü biçimde giriş ekranına dönmeli.
    console.error("[auth/callback] Beklenmeyen aktivasyon hatası:", error);
    return redirectToLogin(
      origin,
      "Aktivasyon tamamlanamadı. Lütfen yeniden giriş yapmayı dene."
    );
  }
}

function activationErrorMessage(message: string): string {
  const normalized = message.toLocaleLowerCase("en-US");
  if (normalized.includes("code verifier")) {
    return "Aktivasyon bağlantısı farklı bir tarayıcıda açıldığı için oturum oluşturulamadı. Hesabın etkinleştirildiyse e-posta ve şifrenle giriş yapabilirsin.";
  }
  if (normalized.includes("expired") || normalized.includes("invalid")) {
    return "Aktivasyon bağlantısı geçersiz veya süresi dolmuş. Hesabın etkinleştirildiyse giriş yapmayı dene.";
  }
  return "Aktivasyon tamamlanamadı. Lütfen e-posta ve şifrenle giriş yapmayı dene.";
}

function redirectToLogin(origin: string, message: string) {
  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

