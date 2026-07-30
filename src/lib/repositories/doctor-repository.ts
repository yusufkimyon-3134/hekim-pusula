import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Doctor, DoctorProfileInput } from "@/types";

type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];

function toDoctor(row: DoctorRow): Doctor {
  return {
    id: row.id,
    nickname: row.nickname,
    role: row.role,
    specialty: row.specialty,
    isVerified: row.is_verified,
    avatarUrl: row.avatar_url,
    city: row.city,
    currentHospital: row.current_hospital,
    experienceYear: row.experience_year,
    bio: row.bio,
  };
}

/**
 * `doctors` tablosuna erişim katmanı. RLS, bir kullanıcının yalnızca
 * kendi satırını görebilmesini zaten zorluyor — bu repository ekstra bir
 * yetki kontrolü yapmıyor, sadece sorgu/eşleme mantığını topluyor.
 */
export class DoctorRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(id: string): Promise<Doctor | null> {
    const { data, error } = await this.client
      .from("doctors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Profil getirilemedi: ${error.message}`);
    }
    return data ? toDoctor(data) : null;
  }

  /** Profil ilk kez oluşturuluyorsa ekler, varsa günceller. */
  async upsert(id: string, input: DoctorProfileInput): Promise<Doctor> {
    const { data, error } = await this.client
      .from("doctors")
      .upsert(
        {
          id,
          nickname: input.nickname,
          role: input.role,
          specialty: input.specialty,
          city: input.city ?? null,
          current_hospital: input.currentHospital ?? null,
          experience_year: input.experienceYear ?? null,
          bio: input.bio ?? null,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) {
      throw new Error(`Profil kaydedilemedi: ${error.message}`);
    }
    return toDoctor(data);
  }
}
