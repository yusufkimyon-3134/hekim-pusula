import { z } from "zod";

export const VERIFICATION_DOCUMENT_TYPES = ["diploma", "specialty_certificate"] as const;

export const VERIFICATION_DOCUMENT_TYPE_LABELS: Record<
  (typeof VERIFICATION_DOCUMENT_TYPES)[number],
  string
> = {
  diploma: "Diploma",
  specialty_certificate: "Uzmanlık Belgesi",
};

export const ACCEPTED_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const verificationRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalı")
    .max(120, "Ad soyad en fazla 120 karakter olabilir"),
  documentType: z.enum(VERIFICATION_DOCUMENT_TYPES, { message: "Geçerli bir belge türü seç" }),
});
