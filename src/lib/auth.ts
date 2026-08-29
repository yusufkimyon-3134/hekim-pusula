import { createClient } from "@/lib/supabase/server";
import { isEnvConfigured } from "@/lib/env";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import type { Doctor } from "@/types";
import type { User } from "@supabase/supabase-js";

/**
 * Giriş yapmış kullanıcının auth bilgisini döner, yoksa null.
 *
 * ÖNEMLİ (bug fix): Supabase ortam değişkenleri tanımlı değilse (örn.
 * yeni klonlanmış bir projede `.env.local` henüz oluşturulmadıysa) bu
 * fonksiyon eskiden `createClient()` üzerinden fırlatılan bir hatayla
 * TÜM sayfaları (bu fonksiyon kök layout'taki `SiteHeader`'da her
 * sayfada çağrıldığı için) çökertiyordu. Artık böyle bir durumda
 * sessizce "giriş yapılmamış" (`null`) kabul ediyor — sayfa yine de
 * render edilir, yalnızca "Giriş yap" bağlantısı görünür.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!isEnvConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getAuthUser(): Promise<User | null> {
  if (!isEnvConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/**
 * Giriş yapmış kullanıcının hekim profilini döner. Kullanıcı giriş
 * yapmamışsa ya da profilini henüz tamamlamamışsa (auth hesabı var ama
 * `doctors` satırı yok) null döner — bu iki durum çağıran tarafından
 * ayrıştırılmak istenirse `getAuthUserId` ayrıca kullanılabilir.
 */
export async function getCurrentDoctor(): Promise<Doctor | null> {
  if (!isEnvConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const doctorRepository = new DoctorRepository(supabase);
  return doctorRepository.findById(data.user.id);
}
