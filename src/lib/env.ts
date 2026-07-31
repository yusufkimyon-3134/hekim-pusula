import { z } from "zod";

/**
 * Ortam değişkenlerinin tek, doğrulanmış kaynağı.
 *
 * Neden gerekli: `process.env.X!` ile non-null assertion kullanmak,
 * değişken eksik/yanlış olduğunda hatayı Supabase istemcisinin içinde,
 * anlaşılması zor bir noktada patlatır. Burada net bir hata mesajıyla
 * erken (fail-fast) uyarı veriyoruz.
 *
 * Doğrulama kasıtlı olarak TEMBEL (lazy) yapılır — modül import
 * edildiğinde değil, `getEnv()` gerçekten çağrıldığında çalışır. Next.js
 * build sırasında sayfa modüllerini analiz etmek için import edebilir;
 * modül üst seviyesinde eager bir doğrulama, ortam değişkenleri henüz
 * ayarlanmamış bir build ortamını gereksiz yere kırabilir.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ message: "NEXT_PUBLIC_SUPABASE_URL tanımlı değil (.env.local dosyasını kontrol et)" })
    .url("NEXT_PUBLIC_SUPABASE_URL geçerli bir URL olmalı"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil (.env.local dosyasını kontrol et)",
  }),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

/**
 * `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` tanımlı değilken kullanılan
 * zararsız placeholder değerler. Gerçek bir Supabase projesine karşılık
 * gelmezler; yalnızca `createServerClient`/`createBrowserClient`'ın
 * (yapılandırma eksikken bile) FIRLATMADAN bir istemci nesnesi
 * oluşturabilmesi için var. Gerçek ağ çağrıları (`.auth.getUser()`,
 * `.from().select()`, `.rpc()`) bu placeholder'a karşı yapıldığında
 * Supabase JS SDK'sı bunu (doğrulanmış davranış) sessizce bir
 * `{ data: null, error }` olarak döner, ASLA throw etmez — bu yüzden
 * bu placeholder'ları kullanmak güvenlidir.
 */
export const PLACEHOLDER_SUPABASE_URL = "https://placeholder.supabase.co";
export const PLACEHOLDER_SUPABASE_ANON_KEY = "placeholder-anon-key";

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    const detay = parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(
      `Ortam değişkenleri eksik/geçersiz:\n${detay}\n\n.env.example dosyasını .env.local olarak kopyalayıp değerleri gir.`
    );
  }

  cached = parsed.data;
  return cached;
}

/**
 * `getEnv()`'in fırlatmayan (non-throwing) hali — ortam değişkenleri
 * tanımlı mı diye önceden kontrol etmek isteyen çağıranlar için (örn.
 * middleware: yapılandırma eksikse TÜM uygulamayı çökertmek yerine
 * zarifçe devam etmeli).
 */
export function isEnvConfigured(): boolean {
  return envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }).success;
}

/**
 * Bug fix: `createClient()` (server ve browser) bunu kullanır. Gerçek
 * ortam değişkenleri tanımlıysa onları, değilse ZARARSIZ bir placeholder
 * döner — `getEnv()`'in aksine ASLA fırlatmaz. Bu sayede Supabase
 * yapılandırılmamışken bile bir istemci NESNESİ oluşturulabilir; asıl
 * hata (varsa) yalnızca gerçek bir ağ çağrısı yapıldığında, o çağrıyı
 * yapan kodun kendi hata yönetimi seviyesinde ortaya çıkar — tüm
 * sayfanın, istemci oluşturma anında çökmesi yerine.
 */
export function getEnvOrPlaceholder(): Env {
  if (isEnvConfigured()) return getEnv();
  return {
    NEXT_PUBLIC_SUPABASE_URL: PLACEHOLDER_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: PLACEHOLDER_SUPABASE_ANON_KEY,
  };
}
