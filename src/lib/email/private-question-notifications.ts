import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type NotificationKind = "new_question" | "new_answer";

type SendPrivateQuestionNotificationArgs = {
  recipientUserId: string;
  kind: NotificationKind;
};

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function messageFor(kind: NotificationKind): { subject: string; heading: string; body: string } {
  if (kind === "new_answer") {
    return {
      subject: "Sorunuz yanıtlandı | Hekim Pusula",
      heading: "Sorunuz yanıtlandı",
      body: "Hekim Pusula'da sorduğunuz özel soruya yanıt geldi.",
    };
  }

  return {
    subject: "Size özel bir soru geldi | Hekim Pusula",
    heading: "Size özel bir soru geldi",
    body: "Hekim Pusula'da bir deneyiminiz hakkında size özel bir soru soruldu.",
  };
}

/**
 * E-posta bildirimleri ikincil bir özelliktir: yapılandırma veya gönderim hatası,
 * soru/yanıt kaydını asla engellemez. Anahtarlar yalnızca sunucuda tutulur.
 */
export async function sendPrivateQuestionNotification({
  recipientUserId,
  kind,
}: SendPrivateQuestionNotificationArgs): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom) {
    console.warn("E-posta bildirimi yapılandırılmadı; bildirim gönderilmedi.");
    return;
  }

  try {
    const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.admin.getUserById(recipientUserId);
    const email = data.user?.email;
    if (error || !email) {
      console.warn("Bildirim e-posta adresi bulunamadı.");
      return;
    }

    const message = messageFor(kind);
    const questionsUrl = `${getAppUrl()}/questions`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [email],
        subject: message.subject,
        text: `${message.body}\n\nSorularım alanını açmak için: ${questionsUrl}`,
        html: `<h2>${message.heading}</h2><p>${message.body}</p><p><a href="${questionsUrl}">Sorularım alanını aç</a></p><p>Bu e-posta, Hekim Pusula hesabınızdaki özel soru-cevap bildirimi için gönderilmiştir.</p>`,
      }),
    });

    if (!response.ok) {
      console.warn("E-posta bildirimi gönderilemedi.");
    }
  } catch {
    console.warn("E-posta bildirimi sırasında beklenmeyen hata oluştu.");
  }
}
