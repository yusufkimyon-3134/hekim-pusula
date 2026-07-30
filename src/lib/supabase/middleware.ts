import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "@/lib/env";

/**
 * Supabase Auth oturum çerezlerini her istekte tazeler. Bu olmadan,
 * Server Component'lerdeki `createClient()` çağrıları süresi dolmuş bir
 * oturumla çalışabilir. Resmi Supabase + Next.js App Router deseni.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
