import { Container } from "@/components/layout/container";
import Link from "next/link";
import { CompareCard } from "@/features/clinic/components/compare-card";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";

function normalizeClinicIds(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ clinicId?: string | string[] }>;
}) {
  const { clinicId } = await searchParams;
  const clinicIds = normalizeClinicIds(clinicId);

  if (clinicIds.length !== 2) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Karşılaştır</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          Karşılaştırma için tam olarak iki klinik seçmelisin. Bir{" "}
          <Link href="/rankings" className="underline underline-offset-2">
            sıralama sayfasından
          </Link>{" "}
          iki klinik işaretleyip &ldquo;Seçilenleri karşılaştır&rdquo;a
          basabilirsin.
        </p>
      </Container>
    );
  }

  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);

  const [clinicA, clinicB] = await Promise.all(
    clinicIds.map((id) => clinicRepository.findByIdWithHospital(id))
  );

  if (!clinicA || !clinicB) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Karşılaştır</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Seçilen kliniklerden biri bulunamadı.
        </p>
      </Container>
    );
  }

  const [statsA, statsB] = await Promise.all([
    clinicRepository.getStats(clinicA.id),
    clinicRepository.getStats(clinicB.id),
  ]);

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Klinik karşılaştırması</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {clinicA.branch} — {clinicA.hospital.name} vs. {clinicB.branch} —{" "}
        {clinicB.hospital.name}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <CompareCard clinic={clinicA} stats={statsA} />
        <CompareCard clinic={clinicB} stats={statsB} />
      </div>
    </Container>
  );
}
