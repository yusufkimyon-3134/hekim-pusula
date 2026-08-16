import Link from "next/link";
import { SearchX, Lock, Clock } from "lucide-react";
import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/section-label";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { SearchForm } from "@/features/search/components/search-form";
import { HospitalCard } from "@/features/hospital/components/hospital-card";
import { ClinicCard } from "@/features/clinic/components/clinic-card";
import { isHospitalType } from "@/lib/hospital-type";
import type { HospitalType } from "@/types";

/**
 * Yalnızca bu sayfadaki "daraltılmış" başlık için (örn. "Ankara — Devlet
 * Hastaneleri") — `HOSPITAL_TYPE_LABELS` tekil ("Devlet Hastanesi"),
 * burada çoğul gerekiyor. Türkçe çoğullama genel bir kural olarak
 * güvenli şekilde otomatikleştirilemediği (ünlü uyumu + iyelik eki
 * kaldırma) için, yalnızca 4 gerçek değer için elle yazıldı.
 */
const HOSPITAL_TYPE_PLURAL_LABELS: Record<HospitalType, string> = {
  state_hospital: "Devlet Hastaneleri",
  training_and_research_hospital: "Eğitim ve Araştırma Hastaneleri",
  city_hospital: "Şehir Hastaneleri",
  university_hospital: "Üniversite Hastaneleri",
};

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

  // Auth kontrolü
  const { data: userData } = await supabase.auth.getUser();
  let isVerified = false;
  if (userData.user) {
    const doctorRepository = new DoctorRepository(supabase);
    const doctor = await doctorRepository.findById(userData.user.id);
    isVerified = doctor?.isVerified === true;
  }

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

  // Doğrulanmış hekimler için her klinik'in stats'ını fetch et
  let clinicStatsMap: Record<string, { reviewCount: number; avgScore: number | null }> = {};
  if (isVerified && clinics.length > 0) {
    const statsPromises = clinics.map((clinic) =>
      clinicRepository
        .getStats(clinic.clinicId)
        .then((stats) => ({
          clinicId: clinic.clinicId,
          stats,
        }))
        .catch(() => ({
          clinicId: clinic.clinicId,
          stats: null,
        }))
    );
    const statsResults = await Promise.all(statsPromises);
    clinicStatsMap = Object.fromEntries(
      statsResults
        .filter((r) => r.stats)
        .map((r) => [
          r.clinicId,
          {
            reviewCount: r.stats?.reviewCount ?? 0,
            avgScore: r.stats?.avgOverallScore ?? null,
          },
        ])
    );
  }

  const hasAnyFilter = Boolean(q || city || hospitalType || hasAdvancedFilters);
  const totalResults = hospitals.length + clinics.length;

  // Şehir + hastane türü ikisi de seçilmiş VE serbest metin araması
  // (q) yoksa: "Kurum ara" başlığı/açıklaması/formu yerine daraltılmış,
  // tek satırlık bir başlık gösterilir (örn. "Ankara — Devlet
  // Hastaneleri"). `q` ile normal arama yapıldığında (branş, hastane
  // adı vb.) bu koşul sağlanmaz, mevcut görünüm aynen kalır.
  const showCondensedCityTypeView = Boolean(city && hospitalType && !q);

  // Boş durumda öneri için: YENİ bir sorgu atmadan, sayfanın zaten
  // çektiği `cities` dizisini (şehir filtresi dropdown'ı için) hastane
  // sayısına göre sıralayıp ilk birkaçını "dener misin?" önerisi olarak
  // kullanıyoruz — ekstra veritabanı maliyeti yok.
  const suggestedCities = [...cities]
    .sort((a, b) => b.hospitalCount - a.hospitalCount)
    .slice(0, 5);

  return (
    <Container className="py-10">
      {showCondensedCityTypeView ? (
        <h1 className="text-2xl font-semibold tracking-tight">
          {city} — {HOSPITAL_TYPE_PLURAL_LABELS[hospitalType as HospitalType]}
        </h1>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight">Kurum ara</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hastane veya branş ara.
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
        </>
      )}

      {!userData.user && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3">
          <p className="text-sm font-medium text-yellow-900">
            ⚠️ Yorumları görmek için giriş yapmalısınız
          </p>
          <p className="mt-1 text-xs text-yellow-800">
            Doktor değerlendirmelerini ve çalışma deneyimlerini görmek için lütfen giriş yapın veya kayıt olun.
          </p>
        </div>
      )}

      {userData.user && !isVerified && (
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-sm font-medium text-blue-900">
            ⚠️ Yorumları görmek için doktor doğrulaması gerekli
          </p>
          <p className="mt-1 text-xs text-blue-800">
            Doktor değerlendirmelerini ve çalışma deneyimlerini görmek için hekim doğrulamanız gerekir.
          </p>
        </div>
      )}

      {hasAnyFilter && (
        <p className="mt-6 text-sm text-muted-foreground">
          {q ? (
            <>
              &ldquo;{q}&rdquo; için{" "}
              <span className="font-medium text-foreground">{totalResults}</span>{" "}
              sonuç bulundu.
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{totalResults}</span> sonuç
              bulundu.
            </>
          )}
        </p>
      )}

      {hasAnyFilter && totalResults === 0 && (
        <Card className="mt-6 border-dashed bg-card/50">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Sonuç bulunamadı</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {q ? (
                  <>
                    &ldquo;{q}&rdquo; için eşleşen bir kurum ya da klinik yok.
                  </>
                ) : (
                  "Uyguladığın filtrelere uyan bir sonuç yok."
                )}{" "}
                Farklı bir arama terimi veya filtre deneyebilirsin.
              </p>
            </div>

            {suggestedCities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Bunları dener misin?
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedCities.map((c) => (
                    <Link
                      key={c.city}
                      href={`/search?q=${encodeURIComponent(c.city)}`}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs transition-colors hover:border-primary/40"
                    >
                      {c.city}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hospitals.length > 0 && (
        <div className="mt-6">
          <SectionLabel>Hastaneler ({hospitals.length})</SectionLabel>
          <div className="mt-3 space-y-3">
            {hospitals.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                isVerified={isVerified}
              />
            ))}
          </div>
        </div>
      )}

      {clinics.length > 0 && (
        <div className="mt-8">
          <SectionLabel>Klinikler ({clinics.length})</SectionLabel>
          <div className="mt-3 space-y-3">
            {clinics.map((clinic) => {
              const stats = clinicStatsMap[clinic.clinicId];
              return (
                <ClinicCard
                  key={clinic.clinicId}
                  branch={clinic.branch}
                  href={`/clinic/${clinic.clinicId}`}
                  subtitle={`${clinic.hospitalName} — ${clinic.hospitalDistrict}, ${clinic.hospitalCity}`}
                  reviewCount={stats?.reviewCount}
                  avgScore={stats?.avgScore}
                  isVerified={isVerified}
                />
              );
            })}
          </div>
        </div>
      )}
    </Container>
  );
}
