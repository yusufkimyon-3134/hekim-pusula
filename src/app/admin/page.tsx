import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, ExternalLink, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/data";
import { VERIFICATION_DOCUMENT_TYPE_LABELS } from "@/lib/verification-document";
import { approveVerificationRequest, rejectVerificationRequest } from "./actions";

export const metadata: Metadata = {
  title: "Yönetim",
  robots: { index: false, follow: false },
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; error?: string }>;
}) {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) redirect("/login?redirectTo=/admin");

  const [{ updated, error }, dashboard] = await Promise.all([
    searchParams,
    getAdminDashboardData(),
  ]);

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-emerald-700" />
            <h1 className="text-2xl font-semibold tracking-tight">Yönetim</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Üyelik hareketlerini izle ve hekim doğrulama başvurularını sonuçlandır.
          </p>
        </div>

        {updated && (
          <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Başvuru {updated === "approved" ? "onaylandı" : "reddedildi"}; yüklenen belge otomatik silme kuyruğuna alındı.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            İşlem tamamlanamadı. Alanları kontrol edip yeniden dene.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock3 className="size-5 text-amber-700" />
              <div><p className="text-2xl font-semibold">{dashboard.pending.length}</p><p className="text-xs text-muted-foreground">Bekleyen başvuru</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <UserPlus className="size-5 text-blue-700" />
              <div><p className="text-2xl font-semibold">{dashboard.signupCountLast24Hours}</p><p className="text-xs text-muted-foreground">Son 24 saat yeni üye</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock3 className="size-5 text-red-700" />
              <div><p className="text-2xl font-semibold">{dashboard.pendingOver24Hours}</p><p className="text-xs text-muted-foreground">24 saati aşan</p></div>
            </CardContent>
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bekleyen doğrulamalar</h2>
            {dashboard.pending.length > 0 && <Badge variant="soft">{dashboard.pending.length} işlem</Badge>}
          </div>

          {dashboard.pending.length === 0 ? (
            <Card><CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground"><CheckCircle2 className="size-5 text-emerald-700" /> Bekleyen doğrulama başvurusu yok.</CardContent></Card>
          ) : (
            dashboard.pending.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                    <span>{request.fullName}</span>
                    <Badge variant="soft">{VERIFICATION_DOCUMENT_TYPE_LABELS[request.documentType as keyof typeof VERIFICATION_DOCUMENT_TYPE_LABELS]}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">Yüklenme: {formatDate(request.createdAt)}</span>
                    {request.documentUrl ? (
                      <Button asChild variant="outline" size="sm"><Link href={request.documentUrl} target="_blank" rel="noreferrer">Belgeyi güvenli aç <ExternalLink /></Link></Button>
                    ) : (
                      <span className="text-destructive">Belge bulunamadı</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Belge bağlantısı 5 dakika geçerlidir. Belgeyi indirme veya cihazında saklama.</p>
                  <div className="grid gap-3 border-t pt-4 md:grid-cols-2">
                    <form action={approveVerificationRequest}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800"><CheckCircle2 /> Onayla</Button>
                    </form>
                    <form action={rejectVerificationRequest} className="space-y-2">
                      <input type="hidden" name="requestId" value={request.id} />
                      <Textarea name="rejectionReason" rows={2} minLength={3} maxLength={300} required placeholder="Ret nedenini yaz" />
                      <Button type="submit" variant="destructive" className="w-full"><XCircle /> Reddet</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      </div>
    </Container>
  );
}
