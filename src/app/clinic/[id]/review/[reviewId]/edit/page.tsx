import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewFormFields } from "@/features/review/components/review-form-fields";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { ReviewRepository } from "@/lib/repositories/review-repository";
import { editReview } from "./actions";

export default async function EditReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; reviewId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id, reviewId } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/clinic/${id}/review/${reviewId}/edit`)}`);
  }

  const clinicRepository = new ClinicRepository(supabase);
  const reviewRepository = new ReviewRepository(supabase);

  const [clinic, review] = await Promise.all([
    clinicRepository.findByIdWithHospital(id),
    reviewRepository.findById(reviewId),
  ]);

  if (!clinic || !review || review.clinicId !== id) {
    notFound();
  }

  // RLS zaten yalnızca sahibinin bu review'ı bulabilmesini/düzenleyebilmesini
  // sağlıyor (update_review de ayrıca kontrol ediyor); burada da erken ve
  // net bir yönlendirme yapıyoruz.
  if (!review.isMine) {
    redirect(`/clinic/${id}`);
  }

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Değerlendirmeni düzenle
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
            <form action={editReview} className="space-y-6">
              <input type="hidden" name="reviewId" value={reviewId} />
              <input type="hidden" name="clinicId" value={id} />

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <ReviewFormFields defaults={review} />

              <Button type="submit" className="w-full">
                Kaydet
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
