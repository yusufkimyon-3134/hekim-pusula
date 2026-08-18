import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi gir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});

export const registerSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi gir"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
});


export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Geçerli bir e-posta adresi gir"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Yeni şifre en az 8 karakter olmalı"),
    confirmPassword: z.string().min(1, "Şifreni tekrar gir"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });
