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
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/profile");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Kapalı beta hukuki kabul kaydı: e-posta aktivasyonu (yani
      // gerçek üyelik) tam bu anda tamamlanıyor. Kayıt formunda iki
      // onay kutusu da zorunlu olduğu için, buraya ulaşan kullanıcının
      // ikisini de kabul ettiği kesin — bu yüzden koşulsuz yazılıyor.
      // Bu adımın başarısız olması login akışını KESMEMELİ (kullanıcı
      // yine de oturumunu açabilmeli); hata varsa sessizce loglanıyor.
      if (data.user) {
        try {
          await new LegalAcceptanceRepository(supabase).recordAcceptance(data.user.id);
        } catch (acceptanceError) {
          console.error("[auth/callback] Hukuki kabul kaydı yazılamadı:", acceptanceError);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      "Aktivasyon bağlantısı geçersiz veya süresi dolmuş."
    )}`
  );
}
