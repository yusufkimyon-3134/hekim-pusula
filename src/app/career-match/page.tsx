import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CareerMatchForm } from "@/features/career-match/components/career-match-form";
import { CareerMatchResultCard } from "@/features/career-match/components/career-match-result-card";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { isHospitalType } from "@/lib/hospital-type";
import { matchCareerPreferences, type CareerGoal } from "@/lib/ai/services/career-match-service";
import { safeQuery } from "@/lib/safe-query";

function parseScore(value: string | undefined, fallback = 3): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : fallback;
}

export default async function CareerMatchPage({
  searchParams,
}: {
  searchParams: Promise<{
    specialty?: string;
    careerGoal?: string;
    academicInterest?: string;
    workloadTolerance?: string;
    nightShiftTolerance?: string;
    city?: string;
    hospitalType?: string;
  }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const hospitalRepository = new HospitalRepository(supabase);

  // Bug fix: Supabase erişilemezse sayfa çökmesin — form yine de
  // render edilir (branş/şehir listeleri boş görünür).
  const [branches, cities] = await Promise.all([
    safeQuery(() => clinicRepository.listBranches(), []),
    safeQuery(() => hospitalRepository.listAllCities(), []),
  ]);

  const hasSubmitted = Boolean(params.specialty);

  const results = hasSubmitted
    ? matchCareerPreferences(
        {
          specialty: params.specialty!,
          careerGoal: (params.careerGoal as CareerGoal) ?? "balanced",
          academicInterest: parseScore(params.academicInterest),
          workloadTolerance: parseScore(params.workloadTolerance),
          nightShiftTolerance: parseScore(params.nightShiftTolerance),
          city: params.city || undefined,
          hospitalType:
            params.hospitalType && isHospitalType(params.hospitalType)
              ? params.hospitalType
              : undefined,
        },
        await safeQuery(() => clinicRepository.rankByBranch(params.specialty!, "overall"), [])
      )
    : [];

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kariyer Eşleştirme</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Birkaç soruya cevap ver, tercihlerine en uygun klinikleri gerçek
            hekim değerlendirmelerine dayanarak bulalım.
          </p>
        </div>

        {!hasSubmitted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tercihlerin</CardTitle>
            </CardHeader>
            <CardContent>
              <CareerMatchForm branches={branches} cities={cities} />
            </CardContent>
          </Card>
        )}

        {hasSubmitted && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {params.specialty} için {results.length} öneri
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/career-match">Yeniden doldur</Link>
              </Button>
            </div>

            {results.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Bu branşta/filtrelerde henüz yeterli değerlendirmesi olan bir
                klinik bulunamadı. Farklı bir şehir/branş deneyebilirsin.
              </p>
            ) : (
              <div className="space-y-3">
                {results.map((result, i) => (
                  <CareerMatchResultCard key={result.clinic.clinicId} result={result} rank={i + 1} />
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Uyum puanı, tercihlerinin klinik istatistikleriyle (eğitim,
              akademik, iş yükü, nöbet, genel puan) ne kadar örtüştüğünü
              gösteren hesaplanmış bir değerdir — bir yapay zekanın tahmini
              değildir.
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
