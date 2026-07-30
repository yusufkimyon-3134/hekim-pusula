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
