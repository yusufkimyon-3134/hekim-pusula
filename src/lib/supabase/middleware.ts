import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv, isEnvConfigured } from "@/lib/env";

let warnedOnce = false;

/**
 * Erişim katmanları:
 * - "public": giriş yapılmamış olsa bile herkes görebilir.
 * - "authenticated": herhangi bir giriş yapmış kullanıcı (doğrulama
 *   durumu ne olursa olsun — pending/rejected/hiç başvurmamış dahil).
 * - "verified": yalnızca `doctors.is_verified = true` olan hekimler.
 *
 * Listelenmemiş HERHANGİ bir sayfa (örn. `/compare`, `/rankings`,
 * `/career-match`) varsayılan olarak "verified" kabul edilir — bu
 * bilinçli bir tercih: bu sayfalar da hastane/klinik/puan verisi
 * gösteriyor, ve talimattaki "giriş yapmamış kişi SADECE [şu sayfaları]
 * görebilsin" (madde 1) ifadesi kapalı bir liste (allowlist) olarak
 * okundu — açıkça izin verilmeyen her şey varsayılan olarak kısıtlı.
 * `/questions` şu an projede hiç yok — listede olması zararsız, sayfa
 * ileride eklenirse otomatik korunur.
 *
 * NOT: Yorum YAZMA yetkisi (submit_review) burada değil — o kontrol
 * zaten SQL fonksiyonunda VE review sayfalarında var, dokunulmadı. Bu
 * yalnızca "bu sayfaları GÖRME" iznini kapsıyor.
 */
type AccessTier = "public" | "authenticated" | "verified";

const PUBLIC_EXACT_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
const PUBLIC_PREFIXES = [
  "/auth/callback",
  "/kvkk-aydinlatma",
  "/kullanim-kosullari",
  // Hastane sayfası artık herkese açık — sayfa kendi içinde, giriş/
  // doğrulama durumuna göre yorum/klinik içeriğini gösterip
  // göstermeyeceğine karar veriyor (bkz. hospital/[id]/page.tsx).
  // Misafir kullanıcı, sayfaya hiç ULAŞAMAMAK yerine, "giriş yap/kayıt
  // ol" bilgi kartını GÖRMELİ — bu yüzden middleware burada artık
  // engellemiyor.
  "/hospital",
  // Ana sayfadaki canlı hastane/klinik önerileri ziyaretçilere de açık olmalı.
  // Yorum içeriği bu route üzerinden dönmez; yalnızca keşif verisi döner.
  "/api/search-suggestions",
];
const AUTHENTICATED_PREFIXES = ["/profile"];

// Next.js'in kendi altyapı yolları (statik dosyalar, RSC istekleri vb.)
// middleware matcher'ında zaten büyük ölçüde hariç tutuluyor (bkz.
// src/middleware.ts), ama API route'ları (/api/*) burada AYRI ele
// alınıyor (JSON 401, sayfa yönlendirmesi değil — bkz. aşağısı).

function getAccessTier(pathname: string): AccessTier {
  if (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return "public";
  }
  if (AUTHENTICATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return "authenticated";
  }
  return "verified";
}

/**
 * Supabase Auth oturum çerezlerini her istekte tazeler VE erişim
 * katmanına göre sunucu taraflı yönlendirme/engelleme uygular. Bu
 * olmadan, Server Component'lerdeki `createClient()` çağrıları süresi
 * dolmuş bir oturumla çalışabilir. Resmi Supabase + Next.js App Router
 * deseni, erişim kontrolüyle genişletildi.
 *
 * ÖNEMLİ (bug fix, korunuyor): Ortam değişkenleri (henüz) tanımlı
 * değilse — örn. bir geliştirici projeyi yeni klonlayıp `.env.local`'ı
 * henüz oluşturmadıysa — bu middleware'i (dolayısıyla TÜM uygulamayı,
 * login sayfası dahil) çökertmiyor; erişim kontrolü de bu durumda devre
 * dışı kalır (Supabase'e hiç bağlanılamadığı için giriş/doğrulama
 * durumu sorgulanamaz).
 */
export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  if (!isEnvConfigured()) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        "[Hekim Pusula] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil. " +
          "Supabase gerektiren sayfalar/özellikler ve erişim kontrolü çalışmayacak. " +
          ".env.example dosyasını .env.local olarak kopyalayıp değerleri gir."
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const tier = getAccessTier(pathname);
  const isApiRoute = pathname.startsWith("/api/");

  if (tier === "public") {
    return supabaseResponse;
  }

  // API route'ları (örn. /api/search-suggestions): sayfa yönlendirmesi
  // yerine JSON 401 — fetch() ile çağrıldıkları için bir login SAYFASINA
  // yönlendirmek istemci tarafında anlamsız olurdu.
  if (!user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (tier === "verified") {
      // "doğrulanmış hekim" gerektiren bir sayfaya giriş yapmadan
      // erişilmeye çalışıldı — login sayfası bu özel durumu (`reason`)
      // görüp ona göre bir mesaj göstersin diye `next` + `reason`
      // kullanılıyor (yalnızca "giriş yap" değil, "giriş yap VE
      // doğrulamanı tamamla" mesajı için).
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      loginUrl.searchParams.set("reason", "verified");
      return redirectWithCookies(loginUrl, supabaseResponse);
    }
    return redirectTo(request, supabaseResponse, "/login", pathname);
  }

  if (tier === "authenticated") {
    return supabaseResponse;
  }

  // tier === "verified": doctors.is_verified kontrolü.
  const { data: doctor } = await supabase
    .from("doctors")
    .select("is_verified")
    .eq("id", user.id)
    .maybeSingle();

  const isVerified = doctor?.is_verified === true;

  if (!isVerified) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Doğrulanmamış (pending/rejected/hiç başvurmamış) ama GİRİŞ YAPMIŞ
    // kullanıcı — login'e değil, profildeki doğrulama bölümüne
    // yönlendiriliyor (madde 4/5).
    return redirectTo(request, supabaseResponse, "/profile", pathname);
  }

  return supabaseResponse;
}

function redirectWithCookies(url: URL, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

function redirectTo(
  request: NextRequest,
  supabaseResponse: NextResponse,
  target: "/login" | "/profile",
  originalPathname: string
) {
  const url = new URL(target, request.url);
  url.searchParams.set(
    "redirectTo",
    originalPathname + request.nextUrl.search
  );
  return redirectWithCookies(url, supabaseResponse);
}
