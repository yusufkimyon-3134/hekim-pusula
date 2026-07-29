import { z } from "zod";

/**
 * Arama sayfasının query param'ı için asgari doğrulama şeması.
 * Sprint 1 kapsamında yalnızca zod kurulumunu doğrulamak için var;
 * gerçek arama/filtre şemaları ileride genişletilecek.
 */
export const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
