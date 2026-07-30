import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi gir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi gir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});
