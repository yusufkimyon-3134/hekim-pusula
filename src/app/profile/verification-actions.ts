"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DoctorVerificationRepository } from "@/lib/repositories/doctor-verification-repository";
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  verificationRequestSchema,
} from "@/lib/validations/verification";

export async function submitVerificationRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const parsed = verificationRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    documentType: formData.get("documentType"),
  });

  if (!parsed.success) {
    redirect(`/profile?verificationError=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/profile?verificationError=${encodeURIComponent("Lütfen bir belge seç.")}`);
  }

  if (!ACCEPTED_DOCUMENT_MIME_TYPES.includes(file.type)) {
    redirect(
      `/profile?verificationError=${encodeURIComponent(
        "Yalnızca PDF, JPG veya PNG dosyası yükleyebilirsin."
      )}`
    );
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    redirect(
      `/profile?verificationError=${encodeURIComponent("Dosya boyutu en fazla 10 MB olabilir.")}`
    );
  }

  const verificationRepository = new DoctorVerificationRepository(supabase);

  let errorMessage: string | null = null;
  try {
    const documentPath = await verificationRepository.uploadDocument(userData.user.id, file);
    await verificationRepository.createRequest(userData.user.id, {
      fullName: parsed.data.fullName,
      documentType: parsed.data.documentType,
      documentPath,
    });
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Bilinmeyen hata";
  }

  if (errorMessage) {
    redirect(`/profile?verificationError=${encodeURIComponent(errorMessage)}`);
  }

  redirect("/profile?verificationSubmitted=1");
}
