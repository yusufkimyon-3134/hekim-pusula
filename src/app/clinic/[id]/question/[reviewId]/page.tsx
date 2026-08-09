import Link from "next/link";
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
    supabase
      .from("reviews")
      .select("id")
      .eq("id", reviewId)
      .eq("clinic_id", clinicId)
      .maybeSingle(),
    new ClinicRepository(supabase).findByIdWithHospital(clinicId),
  ]);

  if (!review || !clinic) notFound();

  return (
    <Container className="py-12 sm:py-16">
      <main className="mx-auto max-w-xl space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {clinic.hospital.name} · {clinic.branch}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Yazarına özel soru sor</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Sorun yalnızca seninle bu yorumu yazan doğrulanmış hekim tarafından
            görülür. E-posta, telefon ve gerçek isim paylaşılmaz.
          </p>
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form action={createReviewQuestion} className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
          <input type="hidden" name="clinicId" value={clinicId} />
          <input type="hidden" name="reviewId" value={reviewId} />
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium">
              Sorun
            </label>
            <Textarea
              id="question"
              name="question"
              minLength={10}
              maxLength={1000}
              required
              placeholder="Örneğin: Nöbet sonrası izin uygulaması şu an nasıl?"
              className="min-h-32"
            />
            <p className="text-xs text-muted-foreground">En az 10, en fazla 1000 karakter.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit">Soruyu gönder</Button>
            <Button asChild type="button" variant="outline">
              <Link href={`/clinic/${clinicId}`}>Vazgeç</Link>
            </Button>
          </div>
        </form>
      </main>
    </Container>
  );
}
