import { AlertTriangle, Clock, ShieldCheck, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  ACCEPTED_DOCUMENT_MIME_TYPES,
  VERIFICATION_DOCUMENT_TYPE_LABELS,
} from "@/lib/validations/verification";
import { submitVerificationRequest } from "@/app/profile/verification-actions";
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
              action={submitVerificationRequest}
              encType="multipart/form-data"
              className="space-y-4"
            >
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
                  accept={ACCEPTED_DOCUMENT_MIME_TYPES.join(",")}
                  required
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Belgende TC kimlik numarasının görünmesini istemiyorsan, yüklemeden
                önce o kısmı karartabilir/maskeleyebilirsin.
              </p>

              <Button type="submit" className="w-full gap-2">
                <Upload className="size-4" />
                Belge yükle ve başvur
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
