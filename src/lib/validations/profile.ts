import { z } from "zod";

export const DOCTOR_ROLES = [
  "general_practitioner",
  "specialist",
  "subspecialist",
] as const;

export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "Rumuz en az 2 karakter olmalı")
    .max(40, "Rumuz en fazla 40 karakter olabilir"),
  role: z.enum(DOCTOR_ROLES, { message: "Geçerli bir unvan seç" }),
  specialty: z
    .string()
    .trim()
    .min(2, "Branş gerekli")
    .max(80, "Branş en fazla 80 karakter olabilir"),
  city: z.string().trim().max(60).optional(),
  currentHospital: z.string().trim().max(160).optional(),
  experienceYear: z.coerce
    .number()
    .int()
    .min(0, "0'dan küçük olamaz")
    .max(60, "60'tan büyük olamaz")
    .optional(),
  bio: z.string().trim().max(500, "En fazla 500 karakter").optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
