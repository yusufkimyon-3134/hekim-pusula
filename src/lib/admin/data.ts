import "server-only";

import { createClient } from "@/lib/supabase/server";
import { VERIFICATION_DOCUMENT_STORAGE_BUCKET } from "@/lib/verification-document";

export type PendingVerification = {
  id: string;
  fullName: string;
  documentType: string;
  createdAt: string;
  documentUrl: string | null;
};

export async function getPendingVerificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("doctor_verification_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(`Bekleyen başvuru sayısı alınamadı: ${error.message}`);
  return count ?? 0;
}

export async function getAdminDashboardData() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: rows, error }, { data: signupCount, error: signupError }] =
    await Promise.all([
      supabase
        .from("doctor_verification_requests")
        .select("id, full_name, document_type, document_path, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true }),
      supabase.rpc("admin_signup_count_since", { p_since: since }),
    ]);

  if (error) throw new Error(`Bekleyen başvurular alınamadı: ${error.message}`);
  if (signupError) throw new Error(`Üyelik özeti alınamadı: ${signupError.message}`);

  const pending: PendingVerification[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      let documentUrl: string | null = null;
      if (row.document_path) {
        const { data } = await supabase.storage
          .from(VERIFICATION_DOCUMENT_STORAGE_BUCKET)
          .createSignedUrl(row.document_path, 5 * 60);
        documentUrl = data?.signedUrl ?? null;
      }

      return {
        id: row.id,
        fullName: row.full_name,
        documentType: row.document_type,
        createdAt: row.created_at,
        documentUrl,
      };
    })
  );

  return {
    pending,
    signupCountLast24Hours: Number(signupCount ?? 0),
    pendingOver24Hours: pending.filter(
      (item) => Date.now() - new Date(item.createdAt).getTime() >= 24 * 60 * 60 * 1000
    ).length,
  };
}
