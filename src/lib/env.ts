import { z } from "zod";

/**
 * Ortam değişkenlerinin tek, doğrulanmış kaynağı.
 *
 * Neden gerekli: `process.env.X!` ile non-null assertion kullanmak,
 * değişken eksik/yanlış olduğunda hatayı Supabase istemcisinin içinde,
 * anlaşılması zor bir noktada patlatır. Burada uygulama başlar başlamaz
 * net bir hata mesajıyla erken (fail-fast) uyarı veriyoruz.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ message: "NEXT_PUBLIC_SUPABASE_URL tanımlı değil (.env.local dosyasını kontrol et)" })
    .url("NEXT_PUBLIC_SUPABASE_URL geçerli bir URL olmalı"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string({
    message: "NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil (.env.local dosyasını kontrol et)",
  }),
});

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

export const env = parsed.data;
