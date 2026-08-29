import { NextResponse, type NextRequest } from "next/server";
import { sendDailyAdminNotifications } from "@/lib/email/admin-notifications";

const EXPECTED_SECRET_SHA256 =
  process.env.ADMIN_NOTIFICATION_CRON_SECRET_SHA256 ??
  "c7619d8c6c34a06b918eff4e0e74112ad28c378073e837f07518ea31f2482189";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-admin-notification-secret") ?? "";
  if (!secret || (await sha256Hex(secret)) !== EXPECTED_SECRET_SHA256) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendDailyAdminNotifications();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Bildirim görevi tamamlanamadı." }, { status: 500 });
  }
}
