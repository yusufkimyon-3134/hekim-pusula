"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validations/auth";

export async function register(formData: FormData) {
  // Sunucu tarafı zorunluluk: `required` HTML özniteliği yalnızca
  // istemci tarafı bir kolaylık — JS kapalıyken veya form doğrudan
  // gönderildiğinde atlanabilir. Asıl kural burada uygulanıyor.
  const acceptedKvkk = formData.get("acceptKvkk") === "on";
  const acceptedTerms = formData.get("acceptTerms") === "on";

  if (!acceptedKvkk || !acceptedTerms) {
    redirect(
      `/register?error=${encodeURIComponent(
        "Devam edebilmek için KVKK Aydınlatma Metni'ni ve Kullanım Koşulları'nı onaylaman gerekiyor."
      )}`
    );
  }

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  // Aktivasyon e-postasındaki bağlantının hangi origin'e döneceğini
  // (dev/prod fark etmeksizin, yeni bir env değişkeni gerektirmeden)
  // gelen isteğin kendi host başlığından türetiyoruz.
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/profile`,
    },
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  // E-posta aktivasyonu tamamlanana kadar aktif bir oturum olmayacağı
  // için artık /profile'a değil, "e-postanı kontrol et" ekranına
  // yönlendiriyoruz (bkz. register/page.tsx, checkEmail=1).
  redirect("/register?checkEmail=1");
}
