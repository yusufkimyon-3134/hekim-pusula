import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { answerReviewQuestion } from "./actions";

type QuestionContext = { hospitalName: string; branch: string };

function contextLabel(context: QuestionContext | undefined): string {
  return context ? `${context.hospitalName} · ${context.branch}` : "İlgili değerlendirme";
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; answered?: string; error?: string }>;
}) {
  const { sent, answered, error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/questions");

  const { data: questions, error: questionsError } = await supabase
    .from("review_questions")
    .select("*")
    .or(`asker_doctor_id.eq.${auth.user.id},author_doctor_id.eq.${auth.user.id}`)
    .order("created_at", { ascending: false });

  if (questionsError) throw new Error("Özel sorular getirilemedi.");

  const reviewIds = Array.from(new Set((questions ?? []).map((question) => question.review_id)));
  const contextByReview = new Map<string, QuestionContext>();

  if (reviewIds.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, clinic_id")
      .in("id", reviewIds);
    const clinicIds = Array.from(new Set((reviews ?? []).map((review) => review.clinic_id)));

    if (clinicIds.length > 0) {
      const { data: clinics } = await supabase
        .from("clinics")
        .select("id, branch, hospital_id")
        .in("id", clinicIds);
      const hospitalIds = Array.from(new Set((clinics ?? []).map((clinic) => clinic.hospital_id)));
      const { data: hospitals } = hospitalIds.length
        ? await supabase.from("hospitals").select("id, name").in("id", hospitalIds)
        : { data: [] };
      const hospitalNameById = new Map((hospitals ?? []).map((hospital) => [hospital.id, hospital.name]));
      const clinicById = new Map(
        (clinics ?? []).map((clinic) => [
          clinic.id,
          { hospitalName: hospitalNameById.get(clinic.hospital_id) ?? "Hastane", branch: clinic.branch },
        ])
      );
      for (const review of reviews ?? []) {
        const context = clinicById.get(review.clinic_id);
        if (context) contextByReview.set(review.id, context);
      }
    }
  }

  const incoming = (questions ?? []).filter((question) => question.author_doctor_id === auth.user.id);
  const outgoing = (questions ?? []).filter((question) => question.asker_doctor_id === auth.user.id);

  return (
    <Container className="py-12 sm:py-16">
      <main className="mx-auto max-w-2xl space-y-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Sorularım</h1>
          <p className="text-sm text-muted-foreground">
            Buradaki tüm soru ve yanıtlar yalnızca ilgili iki hekim tarafından görülebilir.
          </p>
        </div>

        {(sent || answered || error) && (
          <p className={`rounded-md px-3 py-2 text-sm ${error ? "border border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>
            {error ?? (sent ? "Sorunuz gönderildi." : "Yanıtınız gönderildi.")}
          </p>
        )}

        <section className="space-y-4">
          <h2 className="text-base font-semibold">Gelen sorular ({incoming.length})</h2>
          {incoming.length === 0 ? (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">Henüz size gönderilmiş bir soru yok.</p>
          ) : incoming.map((question) => (
            <article key={question.id} className="space-y-4 rounded-lg border bg-card p-5 shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground">{contextLabel(contextByReview.get(question.review_id))}</p>
                <p className="mt-2 text-sm leading-relaxed">{question.question}</p>
              </div>
              {question.answer ? (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground">Yanıtınız</p>
                  <p className="mt-1 text-sm leading-relaxed">{question.answer}</p>
                </div>
              ) : (
                <form action={answerReviewQuestion} className="space-y-3">
                  <input type="hidden" name="questionId" value={question.id} />
                  <Textarea name="answer" minLength={10} maxLength={1500} required placeholder="Yanıtınızı yazın..." />
                  <Button type="submit" size="sm">Yanıtı gönder</Button>
                </form>
              )}
            </article>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-base font-semibold">Gönderdiğin sorular ({outgoing.length})</h2>
          {outgoing.length === 0 ? (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              Bir değerlendirme altındaki “Özel soru sor” düğmesini kullanarak soru gönderebilirsin.
            </p>
          ) : outgoing.map((question) => (
            <article key={question.id} className="space-y-3 rounded-lg border bg-card p-5 shadow-sm">
              <p className="text-xs text-muted-foreground">{contextLabel(contextByReview.get(question.review_id))}</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Sorun</p>
                <p className="mt-1 text-sm leading-relaxed">{question.question}</p>
              </div>
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">Yanıt</p>
                <p className="mt-1 text-sm leading-relaxed">
                  {question.answer ?? "Yazar henüz yanıt vermedi."}
                </p>
              </div>
            </article>
          ))}
        </section>

        <Button asChild variant="outline"><Link href="/search">Kurum ara</Link></Button>
      </main>
    </Container>
  );
}
