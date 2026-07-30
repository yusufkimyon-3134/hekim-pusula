import { z } from "zod";

export const reviewSchema = z.object({
  clinicId: z.string().uuid(),
  monthlyShifts: z.coerce.number().int().min(0).max(60),
  dailyPatients: z.coerce.number().int().min(0).max(500),
  servicePatients: z.coerce.number().int().min(0).max(500),
  wouldChooseAgain: z
    .enum(["true", "false"])
    .transform((v) => v === "true"),
  comment: z.string().trim().max(2000).optional(),
  incentiveScore: z.coerce.number().int().min(1).max(5),
  colleagueScore: z.coerce.number().int().min(1).max(5),
  managementScore: z.coerce.number().int().min(1).max(5),
  cityScore: z.coerce.number().int().min(1).max(5),
  educationScore: z.coerce.number().int().min(1).max(5),
  academicScore: z.coerce.number().int().min(1).max(5),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
