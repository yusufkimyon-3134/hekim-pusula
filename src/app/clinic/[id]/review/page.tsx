import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewFormFields } from "@/features/review/components/review-form-fields";
import { createClient } from "@/lib/supabase/server";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { ReviewRepository } from "@/lib/repositories/review-repository";
import { submitReview } from "./actions";

export default async function ReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${id}/review`)}`);
  }

  const doctorRepository = new DoctorRepository(supabase);
  const doctor = await doctorRepository.findById(userData.user.id);
  if (!doctor) {
    redirect(`/profile?redirectTo=${encodeURIComponent(`/clinic/${id}/review`)}`);
  }

  // Hekim Doğrulaması v1: doğrulanmamış hekimler yorum yazamaz — bu
  // kontrol `submit_review` SQL fonksiyonunda da AYRICA var (savunma
  // katmanı), burada yalnızca kullanıcıyı doğru yere (profildeki
  // doğrulama bölümüne) yönlendirmek için erken bir kontrol.
  if (!doctor.isVerified) {
    redirect(`/profile?redirectTo=${encodeURIComponent(`/clinic/${id}/review`)}`);
  }

  const clinicRepository = new ClinicRepository(supabase);
  const reviewRepository = new ReviewRepository(supabase);

  const [clinic, ownReviewId] = await Promise.all([
    clinicRepository.findByIdWithHospital(id),
    reviewRepository.findOwnReviewIdForClinic(id),
  ]);
  if (!clinic) {
    notFound();
  }

  // Sprint 7 — Bölüm 5: aynı klinik için ikinci bir yorum eklemeyi
  // engellemek yerine (ki bu zaten DB seviyesinde de reddedilirdi),
  // kullanıcıyı doğrudan var olan değerlendirmesini düzenlemeye
  // yönlendiriyoruz — dostane bir "zaten değerlendirdin" deneyimi.
  if (ownReviewId) {
    redirect(`/clinic/${id}/review/${ownReviewId}/edit`);
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deneyimini paylaş
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {clinic.branch} — {clinic.hospital.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Değerlendirme</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={submitReview} className="space-y-6">
              <input type="hidden" name="clinicId" value={clinic.id} />

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <ReviewFormFields />

              <Button type="submit" className="w-full">
                Paylaş
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
