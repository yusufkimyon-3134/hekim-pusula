/**
 * Login/profil sonrası "nereye dön" (`redirectTo`) parametresini doğrular.
 * Yalnızca site içi göreli path'lere izin verir — aksi halde bir saldırgan
 * `redirectTo=https://kotu-site.com` ile açık yönlendirme (open redirect)
 * yapabilir.
 */
export function safeRedirectPath(
  path: string | null | undefined,
  fallback: string
): string {
  if (!path) return fallback;
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}
