import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server component / route handler'lardan kullanılacak Supabase istemcisi.
 * Sprint 2'de gerçek `Database` tipiyle güçlendirildi.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server component içinden çağrılırsa (middleware yoksa) yok sayılabilir.
          }
        },
      },
    }
  );
}
