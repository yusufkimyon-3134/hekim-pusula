/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { ArrowLeft, LockKeyhole, MessageCircle, ShieldCheck } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { sendThreadMessage, setContactConsent } from "./actions";

type ThreadMessage = {
  id: string;
  sender_doctor_id: string;
  body: string;
  created_at: string;
};

type ReviewQuestionThread = {
  id: string;
  review_id: string;
  asker_doctor_id: string;
  author_doctor_id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
  asker_contact_consent: boolean;
  author_contact_consent: boolean;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export default async function QuestionThreadPage({ params, searchParams }: { params: Promise<{ questionId: string }>; searchParams: Promise<{ error?: string }> }) {
  const { questionId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?redirectTo=${encodeURIComponent(`/questions/${questionId}`)}`);

  const { data: rawQuestion } = await (supabase as any)
    .from("review_questions")
    .select("id, review_id, asker_doctor_id, author_doctor_id, question, answer, created_at, answered_at, asker_contact_consent, author_contact_consent")
    .eq("id", questionId)
    .maybeSingle();
  const question = rawQuestion as ReviewQuestionThread | null;
  if (!question || ![question.asker_doctor_id, question.author_doctor_id].includes(auth.user.id)) notFound();

  const { data: review } = await supabase.from("reviews").select("clinic_id").eq("id", question.review_id).maybeSingle();
  let context = "İlgili deneyim";
  if (review) {
    const { data: clinic } = await supabase.from("clinics").select("branch, hospital_id").eq("id", review.clinic_id).maybeSingle();
    if (clinic) {
      const { data: hospital } = await supabase.from("hospitals").select("name").eq("id", clinic.hospital_id).maybeSingle();
      context = `${hospital?.name ?? "Hastane"} · ${clinic.branch}`;
    }
  }

  const { data: rawMessages } = await (supabase as any)
    .from("review_question_messages")
    .select("id, sender_doctor_id, body, created_at")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });
  const messages = (rawMessages ?? []) as ThreadMessage[];

  const isAsker = auth.user.id === question.asker_doctor_id;
  const myConsent = isAsker ? question.asker_contact_consent : question.author_contact_consent;
  const otherConsent = isAsker ? question.author_contact_consent : question.asker_contact_consent;
  const bothConsent = question.asker_contact_consent && question.author_contact_consent;

  const timeline = [
    { id: "question", mine: isAsker, body: question.question, label: "İlk soru", createdAt: question.created_at },
    ...(question.answer ? [{ id: "answer", mine: !isAsker, body: question.answer, label: "İlk yanıt", createdAt: question.answered_at ?? question.created_at }] : []),
    ...messages.map((message) => ({ id: message.id, mine: message.sender_doctor_id === auth.user.id, body: message.body, label: null, createdAt: message.created_at })),
  ];

  return <Container className="py-10 sm:py-14"><main className="mx-auto max-w-2xl space-y-5">
    <div><Link href="/questions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Deneyim sorularına dön</Link><p className="mt-5 text-sm text-muted-foreground">{context}</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold"><MessageCircle className="size-6" />Mini konuşma</h1></div>

    <div className="flex gap-3 rounded-lg border border-primary/15 bg-primary/5 p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p className="text-xs leading-relaxed text-muted-foreground">Konuşma yalnızca soruyu soran hekim ile deneyimi paylaşan hekim arasında görünür. Kimlik bilgileri otomatik olarak karşı tarafa açılmaz.</p></div>
    {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

    <section className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
      {timeline.map((item) => <div key={item.id} className={`flex ${item.mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-4 py-3 ${item.mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{item.label && <p className={`mb-1 text-[11px] font-medium ${item.mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{item.label}</p>}<p className="whitespace-pre-wrap text-sm leading-relaxed">{item.body}</p><p className={`mt-1 text-[10px] ${item.mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{formatTime(item.createdAt)}</p></div></div>)}
      {!question.answer && <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">Deneyimi paylaşan hekim ilk yanıtı verdiğinde mini konuşma açılacak.</p>}
    </section>

    {question.answer && <form action={sendThreadMessage} className="space-y-3 rounded-xl border bg-card p-4"><input type="hidden" name="questionId" value={questionId} /><Textarea name="body" maxLength={1200} required placeholder="Takip sorunuzu veya yanıtınızı yazın..." className="min-h-24" /><div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">En fazla 1200 karakter.</p><Button type="submit">Gönder</Button></div></form>}

    <section className="space-y-3 rounded-xl border p-4"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-muted-foreground" /><div><h2 className="text-sm font-semibold">İletişim bilgisi paylaşımı</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Telefon, WhatsApp veya sosyal medya bilgisi ancak iki taraf da açıkça izin verirse bu konuşmada paylaşılabilir. İzninizi istediğiniz zaman geri çekebilirsiniz.</p></div></div>
      <div className="flex flex-wrap items-center gap-3"><form action={setContactConsent}><input type="hidden" name="questionId" value={questionId} /><input type="hidden" name="consent" value={myConsent ? "false" : "true"} /><Button type="submit" size="sm" variant={myConsent ? "outline" : "default"}>{myConsent ? "İznimi geri çek" : "İletişim paylaşımına izin ver"}</Button></form><span className="text-xs text-muted-foreground">{bothConsent ? "✓ İki taraf da izin verdi. İletişim bilgisi paylaşabilirsiniz." : myConsent && !otherConsent ? "Sizin izniniz var · Karşı tarafın onayı bekleniyor." : !myConsent && otherConsent ? "Karşı taraf izin verdi · Sizin onayınız bekleniyor." : "Henüz iki taraflı izin yok."}</span></div>
    </section>
  </main></Container>;
}
