import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv, isEnvConfigured } from "@/lib/env";

let warnedOnce = false;

/**
 * Supabase Auth oturum çerezlerini her istekte tazeler. Bu olmadan,
 * Server Component'lerdeki `createClient()` çağrıları süresi dolmuş bir
 * oturumla çalışabilir. Resmi Supabase + Next.js App Router deseni.
 *
 * ÖNEMLİ (bug fix): Ortam değişkenleri (henüz) tanımlı değilse — örn.
 * bir geliştirici projeyi yeni klonlayıp `.env.local`'ı henüz
 * oluşturmadıysa — bu ARTIK middleware'i (dolayısıyla TÜM uygulamayı,
 * login sayfası dahil) çökertmiyor. Middleware her rotada çalıştığı için
 * eskiden burada fırlatılan bir hata, hiçbir sayfanın render edilmesini
 * engelliyordu. Bunun yerine isteği olduğu gibi geçiriyoruz ve sunucu
 * konsoluna net, tek seferlik bir uyarı basıyoruz.
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  if (!isEnvConfigured()) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        "[Hekim Pusula] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. " +
          "Supabase gerektiren sayfalar/özellikler çalışmayacak. .env.example dosyasını .env.local olarak kopyalayıp değerleri gir."
      );
    }
    return supabaseResponse;
  }

  return updateSessionWithSupabase(request, supabaseResponse);
}

async function updateSessionWithSupabase(
  request: NextRequest,
  initialResponse: NextResponse
) {
  let supabaseResponse = initialResponse;
  const env = getEnv();
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ÖNEMLİ: createServerClient ile bu satır arasına mantık eklenmemeli
  // (Supabase'in resmi uyarısı) — oturum senkronizasyonunu bozabilir.
  await supabase.auth.getUser();

  return supabaseResponse;
}
