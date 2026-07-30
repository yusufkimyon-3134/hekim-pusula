/**
 * Bir arama sorgusunu boşluklara göre kelimelere (token) ayırır, boş
 * girdileri eler. HospitalRepository.search ve ClinicRepository.search
 * aynı "her kelime eşleşmeli" mantığını kullandığı için ortak.
 */
export function tokenize(query: string | undefined): string[] {
  if (!query) return [];
  return query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}
