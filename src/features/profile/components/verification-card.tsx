"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, ShieldCheck, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  ACCEPTED_DOCUMENT_FILE_TYPES,
  detectDocumentMimeType,
  DOCUMENT_EXTENSION_BY_MIME_TYPE,
  MAX_DOCUMENT_SIZE_BYTES,
  VERIFICATION_DOCUMENT_STORAGE_BUCKET,
  VERIFICATION_DOCUMENT_TYPE_LABELS,
} from "@/lib/verification-document";
import { submitVerificationRequest } from "@/app/profile/verification-actions";
import { createClient } from "@/lib/supabase/client";
import type { VerificationRequest } from "@/types";

/**
 * "Belge ile hekim doğrulaması" (Hekim Doğrulaması v1). Bu bir e-Devlet
 * entegrasyonu DEĞİL — kullanıcı e-Devlet'ten kendi indirdiği belgeyi
 * buraya yüklüyor, bir admin Supabase Dashboard'dan manuel onaylıyor.
 */
export function VerificationCard({
  isVerified,
  latestRequest,
}: {
  isVerified: boolean;
  latestRequest: VerificationRequest | null;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const fullName = String(formData.get("fullName") ?? "").trim();
      const documentType = String(formData.get("documentType") ?? "");
      if (fullName.length < 2 || fullName.length > 120) {
        setUploadError("Ad soyad 2–120 karakter arasında olmalı.");
        return;
      }

      const file = formData.get("document");
      if (!(file instanceof File) || file.size === 0) {
        setUploadError("Lütfen bir belge seç.");
        return;
      }
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        setUploadError("Dosya boyutu en fazla 10 MB olabilir.");
        return;
      }

      const detectedMimeType = await detectDocumentMimeType(file);
      if (!detectedMimeType) {
        setUploadError("Dosya geçerli bir PDF, JPG veya PNG belgesi değil.");
        return;
      }

      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setUploadError("Oturumun sona ermiş. Lütfen tekrar giriş yap.");
        return;
      }

      const extension = DOCUMENT_EXTENSION_BY_MIME_TYPE[detectedMimeType];
      const documentPath = `${userData.user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: storageError } = await supabase.storage
        .from(VERIFICATION_DOCUMENT_STORAGE_BUCKET)
        .upload(documentPath, file, { contentType: detectedMimeType, upsert: false });

      if (storageError) {
        setUploadError(`Belge yüklenemedi: ${storageError.message}`);
        return;
      }

      const result = await submitVerificationRequest({
        fullName,
        documentType,
        documentPath,
      });

      if (!result.success) {
        setUploadError(result.error);
        return;
      }

      router.replace("/profile?verificationSubmitted=1");
      router.refresh();
    } catch {
      setUploadError("Belge yüklenirken beklenmeyen bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hekim Doğrulaması</CardTitle>
      </CardHeader>
      <CardContent>
        {isVerified ? (
          <div className="flex items-center gap-2">
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="size-3.5" />
              Doğrulanmış Hekim
            </Badge>
          </div>
        ) : latestRequest?.status === "pending" ? (
          <div className="flex items-center gap-3 rounded-md bg-accent px-3 py-2.5 text-sm text-accent-foreground">
            <Clock className="size-4 shrink-0" />
            <p>Başvurunuz inceleniyor.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {latestRequest?.status === "rejected" && (
              <div className="flex items-start gap-3 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">Başvurun reddedildi</p>
                  {latestRequest.rejectionReason && (
                    <p className="mt-0.5 text-destructive/90">
                      {latestRequest.rejectionReason}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-destructive/80">
                    Yeni bir belge yükleyerek tekrar başvurabilirsin.
                  </p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {uploadError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {uploadError}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Belgendeki adınla birebir aynı olmalı"
                  maxLength={120}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="documentType">Belge türü</Label>
                <NativeSelect id="documentType" name="documentType" defaultValue="diploma" required>
                  {Object.entries(VERIFICATION_DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="document">Belge (PDF, JPG veya PNG — en fazla 10 MB)</Label>
                <Input
                  id="document"
                  name="document"
                  type="file"
                  accept={ACCEPTED_DOCUMENT_FILE_TYPES}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Belgende TC kimlik numarasının görünmesini istemiyorsan, yüklemeden
                önce o kısmı karartabilir/maskeleyebilirsin.
              </p>

              <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                <Upload className="size-4" />
                {isSubmitting ? "Belge yükleniyor..." : "Belge yükle ve başvur"}
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
