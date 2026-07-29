import { createBrowserClient } from "@supabase/ssr";

/**
 * Client component'lerden (tarayıcıda) kullanılacak Supabase istemcisi.
 * Sprint 1 kapsamında yalnızca bağlantı katmanı hazırlanıyor;
 * kimlik doğrulama/sorgu mantığı sonraki sprintlerde eklenecek.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
