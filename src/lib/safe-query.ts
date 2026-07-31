/**
 * Bug fix yardımcısı: Supabase yapılandırılmamış/erişilemez olduğunda
 * bir sayfanın TAMAMEN çökmesi yerine (zaten var olan) boş duruma
 * düşmesini sağlar. Bir "özellik" değil — var olan hata yönetimi
 * davranışını (repository'ler zaten anlamlı hatalar fırlatıyor) sayfa
 * seviyesinde tamamlayan bir dayanıklılık katmanı.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("[safeQuery] Sorgu başarısız, boş duruma düşülüyor:", error);
    return fallback;
  }
}
