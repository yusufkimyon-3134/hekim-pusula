import Link from "next/link";
import { Info, MessageCircle, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { createReviewQuestion } from "./actions";

export default async function AskReviewAuthorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; reviewId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: clinicId, reviewId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${clinicId}/question/${reviewId}`)}`);
  }

  const [{ data: review }, clinic] = await Promise.all([
    supabase.from("reviews").select("id, comment, monthly_shifts, daily_patients, service_patients").eq("id", reviewId).eq("clinic_id", clinicId).maybeSingle(),
    new ClinicRepository(supabase).findByIdWithHospital(clinicId),
  ]);

  if (!review || !clinic) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <main className="mx-auto max-w-xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{clinic.hospital.name} · {clinic.branch}</p>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><MessageCircle className="size-6" />Bu deneyim hakkında sor</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Nöbet, hasta yükü, eğitim, teşvik veya çalışma düzeni gibi bu deneyimle ilgili merak ettiğin bir ayrıntıyı doğrudan deneyimi paylaşan hekime sor.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/35 p-4">
          <p className="text-xs font-medium text-muted-foreground">Sorunun bağlı olduğu deneyim</p>
          {review.comment && <p className="mt-2 line-clamp-3 text-sm leading-relaxed">“{review.comment}”</p>}
          <p className="mt-2 text-xs text-muted-foreground">Aylık {review.monthly_shifts} nöbet · Günlük {review.daily_patients} hasta · Servis {review.service_patients} hasta</p>
        </div>

        <div className="flex gap-3 rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="font-medium">Hekim mahremiyeti korunur</p>
            <p className="text-xs leading-relaxed text-muted-foreground">Gerçek isim, e-posta ve telefon bilgileri paylaşılmaz. Bu alan kişisel mesajlaşma için değil, hekimlerin tercih kararına yardımcı olacak mesleki sorular içindir.</p>
          </div>
        </div>

        {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <form action={createReviewQuestion} className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
          <input type="hidden" name="clinicId" value={clinicId} />
          <input type="hidden" name="reviewId" value={reviewId} />
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium">Sorun</label>
            <Textarea id="question" name="question" minLength={10} maxLength={600} required placeholder="Örn. Aylık nöbetlerin kaçı acil, kaçı servis nöbeti oluyor?" className="min-h-32" />
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" /><p>Tek ve net bir soru sorman daha faydalı yanıt almanı sağlar. En fazla 600 karakter.</p></div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Soruyu gönder</Button>
            <Button asChild type="button" variant="outline"><Link href={`/clinic/${clinicId}`}>Vazgeç</Link></Button>
          </div>
        </form>
      </main>
    </Container>
  );
}
