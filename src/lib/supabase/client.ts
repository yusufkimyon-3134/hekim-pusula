import { createBrowserClient } from "@supabase/ssr";
import { getEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Client component'lerden (tarayıcıda) kullanılacak Supabase istemcisi.
 * Sprint 1 kapsamında yalnızca bağlantı katmanı hazırlanmıştı;
 * Sprint 2'de gerçek `Database` tipiyle güçlendirildi.
 */
export function createClient() {
  const env = getEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
