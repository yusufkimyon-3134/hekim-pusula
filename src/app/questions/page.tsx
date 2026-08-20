import Link from "next/link";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { answerReviewQuestion } from "./actions";

type QuestionContext = { hospitalName: string; branch: string; clinicId: string };
type ReviewQuestion = { id: string; review_id: string; asker_doctor_id: string; author_doctor_id: string; question: string; answer: string | null; created_at: string; answered_at?: string | null; asker_contact_consent?: boolean; author_contact_consent?: boolean };
function contextLabel(context: QuestionContext | undefined): string { return context ? `${context.hospitalName} · ${context.branch}` : "İlgili deneyim"; }

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ sent?: string; answered?: string; error?: string }> }) {
  const { sent, answered, error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?redirectTo=/questions");
  const { data: questions, error: questionsError } = await supabase.from("review_questions").select("*").or(`asker_doctor_id.eq.${auth.user.id},author_doctor_id.eq.${auth.user.id}`).order("created_at", { ascending: false });
  if (questionsError) throw new Error("Deneyim soruları getirilemedi.");
  const typedQuestions = (questions ?? []) as ReviewQuestion[];

  const reviewIds = Array.from(new Set(typedQuestions.map((q) => q.review_id)));
  const contextByReview = new Map<string, QuestionContext>();
  if (reviewIds.length) {
    const { data: reviews } = await supabase.from("reviews").select("id, clinic_id").in("id", reviewIds);
    const clinicIds = Array.from(new Set((reviews ?? []).map((r) => r.clinic_id)));
    if (clinicIds.length) {
      const { data: clinics } = await supabase.from("clinics").select("id, branch, hospital_id").in("id", clinicIds);
      const hospitalIds = Array.from(new Set((clinics ?? []).map((c) => c.hospital_id)));
      const { data: hospitals } = hospitalIds.length ? await supabase.from("hospitals").select("id, name").in("id", hospitalIds) : { data: [] };
      const hospitalNameById = new Map((hospitals ?? []).map((h) => [h.id, h.name]));
      const clinicById = new Map((clinics ?? []).map((c) => [c.id, { hospitalName: hospitalNameById.get(c.hospital_id) ?? "Hastane", branch: c.branch, clinicId: c.id }]));
      for (const review of reviews ?? []) { const context = clinicById.get(review.clinic_id); if (context) contextByReview.set(review.id, context); }
    }
  }

  const incoming = typedQuestions.filter((q) => q.author_doctor_id === auth.user.id);
  const outgoing = typedQuestions.filter((q) => q.asker_doctor_id === auth.user.id);

  const QuestionCard = ({ question, incomingCard }: { question: ReviewQuestion; incomingCard: boolean }) => {
    const context = contextByReview.get(question.review_id);
    return <article className="space-y-4 rounded-lg border bg-card p-5 shadow-sm"><div><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{contextLabel(context)}</p>{context && <Link href={`/clinic/${context.clinicId}`} className="text-xs font-medium text-primary hover:underline">Deneyimi gör</Link>}</div><p className="mt-2 text-sm leading-relaxed">{question.question}</p></div>{incomingCard && !question.answer ? <form action={answerReviewQuestion} className="space-y-3"><input type="hidden" name="questionId" value={question.id} /><Textarea name="answer" minLength={10} maxLength={1500} required placeholder="Deneyiminize dayanarak kısa ve net yanıtlayın..." /><Button type="submit" size="sm">Yanıtı gönder</Button></form> : <><div className="rounded-md bg-muted p-3"><p className="text-xs font-medium text-muted-foreground">{incomingCard ? "Yanıtınız" : "Hekimin yanıtı"}</p><p className="mt-1 text-sm leading-relaxed">{question.answer ?? "Deneyimi paylaşan hekim henüz yanıt vermedi."}</p></div>{question.answer && <Button asChild size="sm" variant="outline"><Link href={`/questions/${question.id}`}><MessageCircle className="size-4" />Mini konuşmayı aç</Link></Button>}</>}</article>;
  };

  return <Container className="py-12 sm:py-16"><main className="mx-auto max-w-2xl space-y-10">
    <div className="space-y-2"><h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><MessageCircle className="size-6" />Deneyim soruları</h1><p className="text-sm text-muted-foreground">Kurum ve klinik tercihinde ihtiyaç duyduğun ayrıntıları, ilgili deneyimi paylaşan hekimden öğren.</p></div>
    <div className="flex gap-3 rounded-lg border border-primary/15 bg-primary/5 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">İlk soru ve yanıtın ardından aynı başlık altında mini konuşma devam edebilir. İletişim bilgileri yalnızca iki taraf da açıkça izin verirse paylaşılabilir.</p></div>
    {(sent || answered || error) && <p className={`rounded-md px-3 py-2 text-sm ${error ? "border border-destructive/30 bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>{error ?? (sent ? "Sorunuz gönderildi." : "Yanıtınız gönderildi.")}</p>}
    <section className="space-y-4"><h2 className="text-base font-semibold">Bana gelen sorular ({incoming.length})</h2>{!incoming.length ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">Henüz deneyimleriniz hakkında gönderilmiş bir soru yok.</p> : incoming.map((q) => <QuestionCard key={q.id} question={q} incomingCard />)}</section>
    <section className="space-y-4"><h2 className="text-base font-semibold">Sorduğum sorular ({outgoing.length})</h2>{!outgoing.length ? <p className="rounded-lg border p-4 text-sm text-muted-foreground">Bir deneyimin altındaki “Bu deneyim hakkında sor” düğmesiyle soru gönderebilirsin.</p> : outgoing.map((q) => <QuestionCard key={q.id} question={q} incomingCard={false} />)}</section>
    <Button asChild variant="outline"><Link href="/search">Kurum ara</Link></Button>
  </main></Container>;
}
