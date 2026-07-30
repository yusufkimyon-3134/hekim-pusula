import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/section-label";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { SearchForm } from "@/features/search/components/search-form";
import { HospitalCard } from "@/features/hospital/components/hospital-card";
import { ClinicCard } from "@/features/clinic/components/clinic-card";
import { isHospitalType } from "@/lib/hospital-type";

function parseNumberParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    city?: string;
    hospitalType?: string;
    minOverall?: string;
    minEducation?: string;
    minAcademic?: string;
    maxMonthlyShifts?: string;
  }>;
}) {
  const {
    q,
    city,
    hospitalType: rawHospitalType,
    minOverall,
    minEducation,
    minAcademic,
    maxMonthlyShifts,
  } = await searchParams;
  const hospitalType =
    rawHospitalType && isHospitalType(rawHospitalType) ? rawHospitalType : undefined;

  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const clinicRepository = new ClinicRepository(supabase);

  const hasAdvancedFilters = Boolean(
    minOverall || minEducation || minAcademic || maxMonthlyShifts
  );

  const hospitalSearchArgs = { query: q, city, hospitalType };
  // Gelişmiş (puan tabanlı) filtreler yalnızca klinik aramasında anlamlı —
  // hastanelerin kendisinin bir "puanı" yok, puanlar kliniğe ait.
  const clinicSearchArgs = {
    ...hospitalSearchArgs,
    minOverall: parseNumberParam(minOverall),
    minEducation: parseNumberParam(minEducation),
    minAcademic: parseNumberParam(minAcademic),
    maxMonthlyShifts: parseNumberParam(maxMonthlyShifts),
  };

  // Gelişmiş filtre varsa hastane sonuçlarını göstermenin anlamı yok
  // (o filtreler hastane düzeyinde uygulanamıyor) — yalnızca klinik
  // sonuçlarına odaklanılır.
  const [cities, hospitals, clinics] = await Promise.all([
    hospitalRepository.listAllCities(),
    hasAdvancedFilters
      ? Promise.resolve([])
      : hospitalRepository.search(hospitalSearchArgs),
    clinicRepository.search(clinicSearchArgs),
  ]);

  const hasAnyFilter = Boolean(q || city || hospitalType || hasAdvancedFilters);
  const totalResults = hospitals.length + clinics.length;

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Kurum ara</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Hastane adı, il, ilçe veya branşa göre ara.
      </p>

      <div className="mt-6">
        <SearchForm
          defaultQuery={q}
          defaultCity={city}
          defaultHospitalType={hospitalType}
          defaultMinOverall={minOverall}
          defaultMinEducation={minEducation}
          defaultMinAcademic={minAcademic}
          defaultMaxMonthlyShifts={maxMonthlyShifts}
          cities={cities}
        />
      </div>

      {hasAnyFilter && (
        <p className="mt-6 text-xs text-muted-foreground">
          {totalResults} sonuç
        </p>
      )}

      {hasAnyFilter && totalResults === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Sonuç bulunamadı. Farklı bir arama terimi veya filtre deneyebilirsin.
        </p>
      )}

      {hospitals.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Hastaneler ({hospitals.length})</SectionLabel>
          <div className="mt-3 space-y-3">
            {hospitals.map((hospital) => (
              <HospitalCard key={hospital.id} hospital={hospital} />
            ))}
          </div>
        </div>
      )}

      {clinics.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Klinikler ({clinics.length})</SectionLabel>
          <div className="mt-3 space-y-3">
            {clinics.map((clinic) => (
              <ClinicCard
                key={clinic.clinicId}
                branch={clinic.branch}
                href={`/clinic/${clinic.clinicId}`}
                subtitle={`${clinic.hospitalName} — ${clinic.hospitalDistrict}, ${clinic.hospitalCity}`}
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
