import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { VerificationDocumentType, VerificationRequest } from "@/types";
import { VERIFICATION_DOCUMENT_STORAGE_BUCKET } from "@/lib/verification-document";

type VerificationRequestRow = Database["public"]["Tables"]["doctor_verification_requests"]["Row"];

function toVerificationRequest(row: VerificationRequestRow): VerificationRequest {
  return {
    id: row.id,
    status: row.status,
    documentType: row.document_type,
    fullName: row.full_name,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

/**
 * Hekim Doğrulaması v1 — `doctor_verification_requests` tablosuna ve
 * özel (private) `doctor-verification-documents` storage bucket'ına
 * erişim katmanı. RLS zaten "yalnızca kendi başvurun" kuralını
 * zorluyor; burada ekstra bir yetki kontrolü yapılmıyor.
 */
export class DoctorVerificationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /** Bir hekimin EN SON başvurusu (varsa) — reddedilip yeniden başvurulmuşsa en yenisi. */
  async findLatestRequest(doctorId: string): Promise<VerificationRequest | null> {
    const { data, error } = await this.client
      .from("doctor_verification_requests")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Doğrulama başvurusu getirilemedi: ${error.message}`);
    }
    return data ? toVerificationRequest(data) : null;
  }

  /** Private bucket'taki kullanıcıya ait belgeyi sunucuda doğrulamak için indirir. */
  async downloadOwnDocument(doctorId: string, documentPath: string): Promise<Blob> {
    if (!documentPath.startsWith(`${doctorId}/`)) {
      throw new Error("Belge yolu kullanıcı hesabıyla eşleşmiyor.");
    }

    const fileName = documentPath.slice(doctorId.length + 1);
    if (!/^[a-zA-Z0-9._-]+\.(pdf|jpg|png)$/.test(fileName)) {
      throw new Error("Belge yolu geçersiz.");
    }

    const { data, error } = await this.client.storage
      .from(VERIFICATION_DOCUMENT_STORAGE_BUCKET)
      .download(documentPath);

    if (error || !data) {
      throw new Error(`Belge doğrulanamadı: ${error?.message ?? "Dosya bulunamadı"}`);
    }
    return data;
  }

  /** Yeni bir doğrulama başvurusu oluşturur (her zaman 'pending' — bkz. RLS with check). */
  async createRequest(
    doctorId: string,
    input: { fullName: string; documentType: VerificationDocumentType; documentPath: string }
  ): Promise<string> {
    const { data, error } = await this.client
      .from("doctor_verification_requests")
      .insert({
        doctor_id: doctorId,
        full_name: input.fullName,
        document_type: input.documentType,
        document_path: input.documentPath,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(`Doğrulama başvurusu oluşturulamadı: ${error.message}`);
    }
    return data.id;
  }
}
