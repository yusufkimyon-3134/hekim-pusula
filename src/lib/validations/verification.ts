import { z } from "zod";
import { VERIFICATION_DOCUMENT_TYPES } from "@/lib/verification-document";

export const verificationRequestSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalı")
    .max(120, "Ad soyad en fazla 120 karakter olabilir"),
  documentType: z.enum(VERIFICATION_DOCUMENT_TYPES, { message: "Geçerli bir belge türü seç" }),
});
