import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Client component'lerden (tarayıcıda) kullanılacak Supabase istemcisi.
 * Sprint 1 kapsamında yalnızca bağlantı katmanı hazırlanıyor;
 * kimlik doğrulama/sorgu mantığı sonraki sprintlerde eklenecek.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
