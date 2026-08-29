import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AdminEmail = {
  deliveryKey: string;
  kind: "verification_request" | "signup_digest" | "verification_reminder";
  subject: string;
  heading: string;
  body: string;
};

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL?.replace(/^/, "https://") ??
    "https://www.hekimpusula.com.tr"
  ).replace(/\/$/, "");
}

async function rememberFailure(deliveryKey: string, kind: AdminEmail["kind"], reason: string) {
  try {
    const admin = createAdminClient();
    await admin.from("admin_notification_deliveries").upsert(
      {
        delivery_key: deliveryKey,
        kind,
        last_error: reason.slice(0, 300),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "delivery_key" }
    );
  } catch {
    // Bildirim ana akışın ikincil parçasıdır; kayıt hatası işleme yansıtılmaz.
  }
}

/**
 * Admin e-postaları kişisel veri veya belge içermez; yalnızca güvenli admin
 * sayfasına yönlendirir. Gönderim hatası kullanıcı işlemini asla engellemez.
 */
export async function sendAdminEmail(message: AdminEmail): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!resendApiKey || !emailFrom) {
    await rememberFailure(message.deliveryKey, message.kind, "E-posta yapılandırması eksik");
    console.warn("Admin e-posta bildirimi yapılandırılmadı.");
    return false;
  }

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("admin_notification_deliveries")
      .select("sent_at")
      .eq("delivery_key", message.deliveryKey)
      .maybeSingle();

    if (existing?.sent_at) return true;

    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw error;

    const recipients = data.users
      .filter((user) => user.app_metadata?.role === "admin" && user.email)
      .map((user) => user.email as string);

    if (recipients.length === 0) {
      await rememberFailure(message.deliveryKey, message.kind, "Admin alıcısı bulunamadı");
      return false;
    }

    const adminUrl = `${getAppUrl()}/admin`;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.deliveryKey,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: recipients,
        subject: message.subject,
        text: `${message.body}\n\nYönetim ekranını aç: ${adminUrl}\n\nBu e-postada doğrulama belgesi veya kişisel bilgi bulunmaz.`,
        html: `<h2>${message.heading}</h2><p>${message.body}</p><p><a href="${adminUrl}">Güvenli yönetim ekranını aç</a></p><p>Bu e-postada doğrulama belgesi veya kişisel bilgi bulunmaz.</p>`,
      }),
    });

    if (!response.ok) {
      await rememberFailure(message.deliveryKey, message.kind, `E-posta servisi: HTTP ${response.status}`);
      return false;
    }

    await admin.from("admin_notification_deliveries").upsert(
      {
        delivery_key: message.deliveryKey,
        kind: message.kind,
        sent_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "delivery_key" }
    );
    return true;
  } catch (error) {
    await rememberFailure(
      message.deliveryKey,
      message.kind,
      error instanceof Error ? error.message : "Beklenmeyen gönderim hatası"
    );
    console.warn("Admin e-posta bildirimi gönderilemedi.");
    return false;
  }
}

export async function notifyNewVerificationRequest(requestId: string): Promise<void> {
  await sendAdminEmail({
    deliveryKey: `verification-request-${requestId}`,
    kind: "verification_request",
    subject: "Yeni hekim doğrulama başvurusu | Hekim Pusula",
    heading: "Yeni doğrulama başvurusu",
    body: "İncelenmesi gereken yeni bir hekim doğrulama başvurusu yüklendi.",
  });
}

export async function sendDailyAdminNotifications(): Promise<{
  signupDigestSent: boolean;
  pendingReminderSent: boolean;
}> {
  const admin = createAdminClient();
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const [signupResult, pendingResult] = await Promise.all([
    admin.rpc("admin_signup_count_since", { p_since: since }),
    admin
      .from("doctor_verification_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("created_at", since),
  ]);

  if (signupResult.error) {
    throw new Error(`Günlük üyelik özeti alınamadı: ${signupResult.error.message}`);
  }
  if (pendingResult.error) {
    throw new Error(`Bekleyen başvuru özeti alınamadı: ${pendingResult.error.message}`);
  }

  const newUsers = Number(signupResult.data ?? 0);
  const oldPending = pendingResult.count ?? 0;

  const signupDigestSent =
    newUsers > 0
      ? await sendAdminEmail({
          deliveryKey: `signup-digest-${dateKey}`,
          kind: "signup_digest",
          subject: "Günlük yeni üye özeti | Hekim Pusula",
          heading: "Günlük üyelik özeti",
          body: `Son 24 saatte ${newUsers} yeni hesap oluşturuldu.`,
        })
      : false;

  const pendingReminderSent =
    oldPending > 0
      ? await sendAdminEmail({
          deliveryKey: `verification-reminder-${dateKey}`,
          kind: "verification_reminder",
          subject: "Bekleyen hekim doğrulama başvurusu | Hekim Pusula",
          heading: "Doğrulama hatırlatması",
          body: `${oldPending} doğrulama başvurusu 24 saatten uzun süredir karar bekliyor.`,
        })
      : false;

  return { signupDigestSent, pendingReminderSent };
}
