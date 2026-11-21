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

const manualApprovalSchema = z.object({
  doctorId: requestIdSchema,
  email: z.string().max(320).email(),
});

export async function approveDoctorWithoutDocument(formData: FormData) {
  if (!(await getCurrentAdmin())) redirect("/login?redirectTo=/admin");

  const parsed = manualApprovalSchema.safeParse({
    doctorId: formData.get("doctorId"),
    email: formData.get("email"),
  });
  if (!parsed.success) redirect("/admin?error=manual-approval");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_manually_verify_doctor", {
    p_doctor_id: parsed.data.doctorId,
    p_email: parsed.data.email,
  });
  if (error || !data) redirect("/admin?error=manual-approval");

  revalidatePath("/admin");
  revalidatePath("/profile");
  redirect("/admin?updated=manual-approval");
}
