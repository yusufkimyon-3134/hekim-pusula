export const VERIFICATION_DOCUMENT_TYPES = ["diploma", "specialty_certificate"] as const;

export const VERIFICATION_DOCUMENT_TYPE_LABELS: Record<
  (typeof VERIFICATION_DOCUMENT_TYPES)[number],
  string
> = {
  diploma: "Diploma",
  specialty_certificate: "Uzmanlık Belgesi",
};

export const ACCEPTED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;

export type AcceptedDocumentMimeType = (typeof ACCEPTED_DOCUMENT_MIME_TYPES)[number];

export const VERIFICATION_DOCUMENT_STORAGE_BUCKET = "doctor-verification-documents";

export const DOCUMENT_EXTENSION_BY_MIME_TYPE: Record<AcceptedDocumentMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export const ACCEPTED_DOCUMENT_FILE_TYPES = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ...ACCEPTED_DOCUMENT_MIME_TYPES,
].join(",");

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Tarayıcıların bildirdiği `File.type` değeri platforma göre boş veya
 * standart dışı (`image/jpg`) olabilir. Dosyanın gerçek türünü sihirli
 * baytlarından belirleyerek hem JPG uyumluluğunu hem güvenliği koruruz.
 */
export async function detectDocumentMimeType(
  file: Blob
): Promise<AcceptedDocumentMimeType | null> {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  const startsWith = (signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }

  return null;
}
