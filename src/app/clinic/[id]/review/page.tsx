import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreField } from "@/features/review/components/score-field";
import { createClient } from "@/lib/supabase/server";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
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

  const clinicRepository = new ClinicRepository(supabase);
  const clinic = await clinicRepository.findByIdWithHospital(id);
  if (!clinic) {
    notFound();
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

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="monthlyShifts">Aylık nöbet</Label>
                  <Input
                    id="monthlyShifts"
                    name="monthlyShifts"
                    type="number"
                    min={0}
                    max={60}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dailyPatients">Günlük hasta</Label>
                  <Input
                    id="dailyPatients"
                    name="dailyPatients"
                    type="number"
                    min={0}
                    max={500}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="servicePatients">Servis hasta</Label>
                  <Input
                    id="servicePatients"
                    name="servicePatients"
                    type="number"
                    min={0}
                    max={500}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tekrar tercih eder misin?</Label>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="wouldChooseAgain" value="true" required />
                    Evet
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="wouldChooseAgain" value="false" />
                    Hayır
                  </label>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <ScoreField name="incentiveScore" label="Döner sermaye / ek ödeme (finansal memnuniyet)" />
                <ScoreField name="colleagueScore" label="Meslektaş ilişkileri / sosyal ortam" />
                <ScoreField name="managementScore" label="Yönetim desteği" />
                <ScoreField name="cityScore" label="Şehir / yaşam kalitesi" />
                <ScoreField name="educationScore" label="Eğitim kalitesi" />
                <ScoreField name="academicScore" label="Akademik fırsatlar" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="comment">Yorumun (opsiyonel)</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  maxLength={2000}
                  rows={4}
                  placeholder="Nöbet düzeni, yönetim, çalışma ortamı… aklına geleni yaz."
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Kimliğin gösterilmez — yalnızca unvan/branşın görünür.
              </p>

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
