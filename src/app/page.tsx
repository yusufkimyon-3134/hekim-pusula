import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { safeQuery } from "@/lib/safe-query";

export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };
export const dynamic = "force-dynamic";

const reviewCountFormat = new Intl.NumberFormat("tr-TR");
const reviewDateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

async function getHomeReviewSummary(supabase: Awaited<ReturnType<typeof createClient>>) {
  const pageSize = 100;
  let count = 0;
  let lastVerifiedAt: string | null = null;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("public_clinic_review_summaries")
      .select("review_count, last_verified_at")
      .order("clinic_id")
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    for (const row of data) {
      count += row.review_count;
      if (row.last_verified_at && (!lastVerifiedAt || Date.parse(row.last_verified_at) > Date.parse(lastVerifiedAt))) {
        lastVerifiedAt = row.last_verified_at;
      }
    }

    if (data.length < pageSize) return { count, lastVerifiedAt };
  }
}

async function getRecentlyReviewedClinics(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: summaries, error: summaryError } = await supabase
    .from("public_clinic_review_summaries")
    .select("clinic_id, review_count, last_verified_at")
    .gt("review_count", 0)
    .order("last_verified_at", { ascending: false, nullsFirst: false })
    .order("clinic_id")
    .limit(5);

  if (summaryError) throw summaryError;
  if (!summaries.length) return [];

  const { data: clinics, error: clinicError } = await supabase
    .from("clinics")
    .select("id, branch, hospitals(name, city)")
    .in("id", summaries.map((summary) => summary.clinic_id))
    .is("merged_into_id", null);

  if (clinicError) throw clinicError;
  const clinicsById = new Map(clinics.map((clinic) => [clinic.id, clinic]));

  return summaries.flatMap((summary) => {
    const clinic = clinicsById.get(summary.clinic_id);
    if (!clinic?.hospitals) return [];

    return [{
      id: clinic.id,
      branch: clinic.branch,
      hospitalName: clinic.hospitals.name,
      hospitalCity: clinic.hospitals.city,
      reviewCount: summary.review_count,
      lastVerifiedAt: summary.last_verified_at,
    }];
  });
}

export default async function HomePage() {
  let featuredCities: Awaited<ReturnType<HospitalRepository["listFeaturedCities"]>> = [];
  let recentClinics: Awaited<ReturnType<typeof getRecentlyReviewedClinics>> = [];
  let isVerified = false;
  let reviewSummary: Awaited<ReturnType<typeof getHomeReviewSummary>> | null = null;
  try {
    const supabase = await createClient();
    const hospitalRepository = new HospitalRepository(supabase);
    const [cities, { data: userData }, publicReviewSummary, reviewedClinics] = await Promise.all([
      safeQuery(() => hospitalRepository.listFeaturedCities(6), []),
      supabase.auth.getUser(),
      safeQuery(() => getHomeReviewSummary(supabase), null),
      safeQuery(() => getRecentlyReviewedClinics(supabase), []),
    ]);
    featuredCities = cities;
    reviewSummary = publicReviewSummary;
    recentClinics = reviewedClinics;
    if (userData.user) {
      const doctor = await new DoctorRepository(supabase).findById(userData.user.id);
      isVerified = doctor?.isVerified === true;
    }
  } catch (error) { console.error("[HomePage] Veriler alınamadı:", error); }

  return <>
    <section className="bg-primary text-primary-foreground">
      <Container className="flex flex-col items-center gap-5 py-12 text-center sm:py-16">
        <div className="space-y-3"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Çalışacağın hastaneyi araştır</h1><p className="mx-auto max-w-md text-base text-primary-foreground/80">Kura ve atama öncesi hekimlerin deneyimlerini keşfet.</p></div>
        <form action="/search" className="mx-auto flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-start">
          <HospitalSuggestSearch name="q" placeholder="Hastane veya branş adı yaz" ariaLabel="Kurum veya klinik ara" className="min-w-0 sm:flex-1" />
          <Button type="submit" size="lg" className="h-11 bg-[color:var(--color-ring)] text-primary hover:bg-[color:var(--color-ring)]/90 sm:w-auto">Ara</Button>
        </form>
        {reviewSummary && reviewSummary.count > 0 && (
          <p className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-sm text-primary-foreground/80">
            <span className="font-semibold text-primary-foreground">
              {reviewCountFormat.format(reviewSummary.count)} hekim değerlendirmesi
            </span>
            {reviewSummary.lastVerifiedAt && (
              <span>
                Son yorum teyidi:{" "}
                <time dateTime={reviewSummary.lastVerifiedAt}>
                  {reviewDateFormat.format(new Date(reviewSummary.lastVerifiedAt))}
                </time>
              </span>
            )}
          </p>
        )}
      </Container>
    </section>
    <Container className="space-y-9 py-10">
      {isVerified && (
        <Link prefetch={false} href="/career-match" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Kariyer eşleştirme <span aria-hidden="true">→</span>
        </Link>
      )}

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Şehre göre hastane bul</h2>
        {featuredCities.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Şehir listesi şu anda yüklenemedi. Yukarıdaki arama alanını kullanabilirsin.</p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {featuredCities.map(({ city }) => (
              <li key={city}>
                <Link prefetch={false} href={`/sehir/${encodeURIComponent(city)}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:border-primary/40">
                  {city}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recentClinics.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Son değerlendirilen klinikler</h2>
          <ul className="mt-4 space-y-2">
            {recentClinics.map((clinic) => (
              <li key={clinic.id}>
                <Link prefetch={false} href={`/clinic/${clinic.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40">
                  <div className="min-w-0">
                    <p className="font-medium">{clinic.hospitalName}</p>
                    <p className="text-sm text-muted-foreground">{clinic.branch} · {clinic.hospitalCity}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {reviewCountFormat.format(clinic.reviewCount)} yorum
                      {clinic.lastVerifiedAt && (
                        <>
                          {" · Son teyit "}
                          <time dateTime={clinic.lastVerifiedAt}>
                            {reviewDateFormat.format(new Date(clinic.lastVerifiedAt))}
                          </time>
                        </>
                      )}
                    </p>
                  </div>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-lg border bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Çalıştığın kurumu meslektaşlarına anlat</h2>
          <Button asChild className="mt-4">
            <Link prefetch={false} href="/search">Hastanemi bul</Link>
          </Button>
        </section>
      )}
    </Container>
  </>;
}
