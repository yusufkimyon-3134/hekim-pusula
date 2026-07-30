import { createClient } from "@/lib/supabase/server";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import type { Doctor } from "@/types";

/** Giriş yapmış kullanıcının auth bilgisini döner, yoksa null. */
export async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Giriş yapmış kullanıcının hekim profilini döner. Kullanıcı giriş
 * yapmamışsa ya da profilini henüz tamamlamamışsa (auth hesabı var ama
 * `doctors` satırı yok) null döner — bu iki durum çağıran tarafından
 * ayrıştırılmak istenirse `getAuthUserId` ayrıca kullanılabilir.
 */
export async function getCurrentDoctor(): Promise<Doctor | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;

  const doctorRepository = new DoctorRepository(supabase);
  return doctorRepository.findById(data.user.id);
}
