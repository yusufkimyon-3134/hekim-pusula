import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { PublicReviewSummary } from "@/features/clinic/components/public-review-summary";
import { ChevronRight } from "lucide-react";
import { safeQuery } from "@/lib/safe-query";

export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };
export const dynamic = "force-dynamic";

async function getRecentlyReviewedClinics(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: summaries, error: summaryError } = await supabase
    .from("public_clinic_review_summaries")
    .select("clinic_id, review_count, last_verified_at")
    .gt("review_count", 0)
    .order("last_verified_at", { ascending: false, nullsFirst: false })
    .order("clinic_id")
    .limit(3);

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
  try {
    const supabase = await createClient();
    const hospitalRepository = new HospitalRepository(supabase);
    [featuredCities, recentClinics] = await Promise.all([
      safeQuery(() => hospitalRepository.listFeaturedCities(6), []),
      safeQuery(() => getRecentlyReviewedClinics(supabase), []),
    ]);
  } catch (error) {
    console.error("[HomePage] Veriler alınamadı:", error);
  }

  return <>
    <section className="bg-primary text-primary-foreground">
      <Container className="flex flex-col items-center gap-5 py-9 text-center sm:py-12">
        <h1 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Hastaneyi, orada çalışan hekimlerden öğren.
        </h1>
        <form action="/search" className="mx-auto flex w-full max-w-xl items-start gap-2">
          <HospitalSuggestSearch name="q" placeholder="Hastane veya branş ara" ariaLabel="Hastane veya branş ara" className="min-w-0 flex-1" />
          <Button type="submit" size="lg" className="h-11 bg-[color:var(--color-ring)] text-primary hover:bg-[color:var(--color-ring)]/90">Ara</Button>
        </form>
      </Container>
    </section>
    <Container className="py-7 sm:py-9">
      <div className="mx-auto max-w-2xl space-y-7">
        {recentClinics.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Değerlendirmesi olan klinikler</h2>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {recentClinics.map((clinic) => (
                <li key={clinic.id}>
                  <Link prefetch={false} href={`/clinic/${clinic.id}`} className="flex items-center justify-between gap-3 px-1 py-3 transition-colors hover:bg-accent/50">
                    <div className="min-w-0">
                      <p className="font-semibold">{clinic.branch}</p>
                      <p className="text-sm text-muted-foreground">{clinic.hospitalName} · {clinic.hospitalCity}</p>
                      <PublicReviewSummary summary={{ count: clinic.reviewCount, lastVerifiedAt: clinic.lastVerifiedAt }} />
                    </div>
                    <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {featuredCities.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Şehre göre keşfet</h2>
            <ul className="mt-1 flex flex-wrap gap-x-5">
              {featuredCities.map(({ city }) => (
                <li key={city}>
                  <Link prefetch={false} href={`/sehir/${encodeURIComponent(city)}`} className="inline-flex min-h-11 items-center text-sm font-medium underline decoration-border underline-offset-4 hover:decoration-current">
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {recentClinics.length === 0 && (
          <section>
            <h2 className="text-lg font-semibold tracking-tight">Çalıştığın kurumu meslektaşlarına anlat</h2>
            <Button asChild className="mt-3"><Link prefetch={false} href="/search">Hastanemi bul</Link></Button>
          </section>
        )}
      </div>
    </Container>
  </>;
}
