import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getEnvOrPlaceholder } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server component / route handler'lardan kullanılacak Supabase istemcisi.
 * Sprint 2'de gerçek `Database` tipiyle güçlendirildi.
 *
 * Bug fix: eskiden `getEnv()` (fırlatan hali) kullanılıyordu — Supabase
 * yapılandırılmamışken bu, çağıran HER sayfayı çökertiyordu (bu fonksiyon
 * onlarca sayfada kullanılıyor). Artık `getEnvOrPlaceholder()` kullanıyor;
 * yapılandırma eksikse zararsız bir placeholder ile bir istemci nesnesi
 * yine de oluşturulur, sayfa render edilmeye devam eder. Gerçek hata
 * (varsa), yalnızca bu istemciyle GERÇEK bir sorgu yapıldığında ortaya
 * çıkar — repository katmanının kendi hata yönetimi bunu ele alır.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const env = getEnvOrPlaceholder();

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
