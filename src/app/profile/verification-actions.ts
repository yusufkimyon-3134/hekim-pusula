"use server";

import { createClient } from "@/lib/supabase/server";
import { DoctorVerificationRepository } from "@/lib/repositories/doctor-verification-repository";
import {
  detectDocumentMimeType,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/verification-document";
import { verificationRequestSchema } from "@/lib/validations/verification";

type VerificationSubmission = {
  fullName: string;
  documentType: string;
  documentPath: string;
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

    await verificationRepository.createRequest(userData.user.id, {
      fullName: parsed.data.fullName,
      documentType: parsed.data.documentType,
      documentPath: input.documentPath,
    });
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Başvuru kaydedilemedi.",
    };
  }

  return { success: true };
}
