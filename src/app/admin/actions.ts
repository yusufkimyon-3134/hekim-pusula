"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const requestIdSchema = z.string().uuid();

async function decideRequest(formData: FormData, status: "approved" | "rejected") {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) redirect("/login?redirectTo=/admin");

  const parsedId = requestIdSchema.safeParse(formData.get("requestId"));
  if (!parsedId.success) redirect("/admin?error=invalid-request");

  const rejectionReason = String(formData.get("rejectionReason") ?? "").trim();
  if (status === "rejected" && (rejectionReason.length < 3 || rejectionReason.length > 300)) {
    redirect("/admin?error=rejection-reason");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("doctor_verification_requests")
    .update({
      status,
      rejection_reason: status === "rejected" ? rejectionReason : null,
    })
    .eq("id", parsedId.data)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/admin?error=decision-failed");

  revalidatePath("/admin");
  revalidatePath("/profile");
  redirect(`/admin?updated=${status}`);
}

export async function approveVerificationRequest(formData: FormData) {
  await decideRequest(formData, "approved");
}

export async function rejectVerificationRequest(formData: FormData) {
  await decideRequest(formData, "rejected");
}
