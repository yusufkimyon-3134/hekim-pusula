import { z } from "zod";

export const REPORT_REASONS = [
  "spam",
  "offensive_language",
  "false_information",
  "duplicate",
  "other",
] as const;

export const REPORT_REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  spam: "Spam",
  offensive_language: "Uygunsuz dil",
  false_information: "Yanlış bilgi",
  duplicate: "Tekrarlanan içerik",
  other: "Diğer",
};

export const reportSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS, { message: "Geçerli bir sebep seç" }),
});
