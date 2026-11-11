"use server";

import { cookies } from "next/headers";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";
import { DoctorVerificationRepository } from "@/lib/repositories/doctor-verification-repository";
import {
  detectDocumentMimeType,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/verification-document";
import { verificationRequestSchema } from "@/lib/validations/verification";
import { notifyNewVerificationRequest } from "@/lib/email/admin-notifications";

type VerificationSubmission = {
  fullName: string;
  documentType: string;
  documentPath: string;
  returnTo?: string;
};

type VerificationSubmissionResult = { success: true } | { success: false; error: string };

export async function submitVerificationRequest(
  input: VerificationSubmission
): Promise<VerificationSubmissionResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return { success: false, error: "Oturumun sona ermiş. Lütfen tekrar giriş yap." };
  }

  const parsed = verificationRequestSchema.safeParse({
    fullName: input.fullName,
    documentType: input.documentType,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const verificationRepository = new DoctorVerificationRepository(supabase);

  try {
    const document = await verificationRepository.downloadOwnDocument(
      userData.user.id,
      input.documentPath
    );
    if (document.size > MAX_DOCUMENT_SIZE_BYTES) {
      return { success: false, error: "Dosya boyutu en fazla 10 MB olabilir." };
    }

    const detectedMimeType = await detectDocumentMimeType(document);

    if (!detectedMimeType) {
      return { success: false, error: "Dosya geçerli bir PDF, JPG veya PNG belgesi değil." };
    }

    const requestId = await verificationRepository.createRequest(userData.user.id, {
      fullName: parsed.data.fullName,
      documentType: parsed.data.documentType,
      documentPath: input.documentPath,
    });
    await notifyNewVerificationRequest(requestId);
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Başvuru kaydedilemedi.",
    };
  }

  const returnTo = safeRedirectPath(input.returnTo, "");
  if (/^\/(clinic|hospital)\//.test(returnTo) && returnTo.length <= 512) {
    (await cookies()).set("verification-return", `${userData.user.id}:${returnTo}`, {
      path: "/profile",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return { success: true };
}
