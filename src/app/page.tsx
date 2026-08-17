import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import {
  DashboardSection,
  DashboardRow,
  DashboardEmpty,
} from "@/features/dashboard/components/dashboard-section";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { DashboardRepository } from "@/lib/repositories/dashboard-repository";
import { formatScore } from "@/lib/format-score";
import { safeQuery } from "@/lib/safe-query";

// Öne çıkan şehirler verisi sık değişmez (yalnızca yeni hastane
// eklendiğinde) — her istekte yeniden sorgulamak yerine 1 saatte bir
// yenilenen bir önbellek (ISR) kullanmak gereksiz veritabanı yükünü azaltır.
// Not: Sprint 8'deki "bu ay" verileri de günlük bazda değişse yeterli
// olduğu için aynı revalidate süresi korunuyor.
export const revalidate = 3600;

export default async function HomePage() {
  let featuredCities: Awaited<ReturnType<HospitalRepository["listFeaturedCities"]>> = [];
  let topClinics: Awaited<ReturnType<DashboardRepository["topClinicsThisMonth"]>> = [];
  let mostImproved: Awaited<ReturnType<DashboardRepository["mostImprovedClinics"]>> = [];
  let trending: Awaited<ReturnType<DashboardRepository["trendingSpecialties"]>> = [];
  let mostDiscussed: Awaited<ReturnType<DashboardRepository["mostDiscussedHospitals"]>> = [];

  // Bug fix: `createClient()`'ın kendisi Supabase yapılandırılmamışsa
  // fırlatıyor. Bunu (ve altındaki sorguları) tek bir try/catch'e almak,
  // sayfanın hiç çökmeden var olan "henüz veri yok" boş durumlarını
  // göstermesini sağlıyor.
  try {
    const supabase = await createClient();
    const hospitalRepository = new HospitalRepository(supabase);
    const dashboardRepository = new DashboardRepository(supabase);

    [featuredCities, topClinics, mostImproved, trending, mostDiscussed] = await Promise.all([
      safeQuery(() => hospitalRepository.listFeaturedCities(6), []),
      safeQuery(() => dashboardRepository.topClinicsThisMonth(5), []),
      safeQuery(() => dashboardRepository.mostImprovedClinics(5), []),
      safeQuery(() => dashboardRepository.trendingSpecialties(5), []),
      safeQuery(() => dashboardRepository.mostDiscussedHospitals(5), []),
    ]);
  } catch (error) {
    console.error("[HomePage] Supabase istemcisi oluşturulamadı, boş durum gösteriliyor:", error);
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <Container className="flex min-h-[calc(100svh-5rem)] flex-col items-center justify-center gap-7 py-16 text-center sm:gap-8 sm:py-20">
          <LogoMark className="h-16 w-16 text-[color:var(--color-ring)] sm:h-20 sm:w-20" />
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Hekim Pusula
            </h1>
            <p className="mx-auto max-w-xl text-base leading-7 text-primary-foreground/80 sm:text-lg">
              Kura veya atama öncesi, doğru kurumu gerçek hekim deneyimleriyle
              keşfet.
            </p>
          </div>

          <form
            action="/search"
            className="mx-auto flex w-full max-w-2xl items-stretch justify-center"
          >
            <HospitalSuggestSearch
              name="q"
              placeholder="Hastane veya branş adı yaz"
              ariaLabel="Kurum veya klinik ara"
              className="min-w-0 flex-1 [&_input]:rounded-r-none [&_input]:border-r-0"
            />
            <Button
              type="submit"
              size="lg"
              className="h-11 w-24 shrink-0 rounded-l-none border border-primary-foreground/15 bg-primary px-0 text-primary-foreground shadow-none hover:bg-primary/80 sm:w-28"
            >
              Ara
            </Button>
          </form>

          <Link
            href="/career-match"
            className="text-sm text-primary-foreground/80 underline-offset-2 hover:underline"
          >
            Ya da kariyer eşleştirme ile sana uygun klinikleri bul →
          </Link>
        </Container>
      </section>

      {/* Öne çıkan şehirler */}
      <Container className="py-14">
        <h2 className="text-lg font-semibold tracking-tight">
          Öne çıkan şehirler
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          En çok kurum kayıtlı olan şehirlerden başla.
        </p>

        {featuredCities.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Henüz kayıtlı şehir yok.
          </p>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            {featuredCities.map((c) => (
              <Link
                key={c.city}
                href={`/search?city=${encodeURIComponent(c.city)}`}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm transition-colors hover:border-primary/40"
              >
                <span className="font-medium">{c.city}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                  {c.hospitalCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Container>

      {/* AI Dashboard — tamamı gerçek, son 30 günlük SQL agregasyonları (LLM kullanılmaz) */}
      <Container className="pb-16">
        <h2 className="text-lg font-semibold tracking-tight">Bu ay öne çıkanlar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Son 30 günün gerçek değerlendirme verilerinden — yapay zeka
          tahmini değil, hesaplanmış istatistik.
        </p>

        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <DashboardSection title="Bu ayın en iyileri">
            {topClinics.length === 0 ? (
              <DashboardEmpty />
            ) : (
              topClinics.map((c) => (
                <DashboardRow
                  key={c.clinicId}
                  href={`/clinic/${c.clinicId}`}
                  primary={c.hospitalName}
                  secondary={`${c.branch} · ${c.hospitalCity}`}
                  value={formatScore(c.avgOverallScore)}
                />
              ))
            )}
          </DashboardSection>

          <DashboardSection title="En çok gelişenler">
            {mostImproved.length === 0 ? (
              <DashboardEmpty />
            ) : (
              mostImproved.map((c) => (
                <DashboardRow
                  key={c.clinicId}
                  href={`/clinic/${c.clinicId}`}
                  primary={c.hospitalName}
                  secondary={`${c.branch} · ${c.hospitalCity}`}
                  value={`+${c.improvement.toFixed(1)}`}
                />
              ))
            )}
          </DashboardSection>

          <DashboardSection title="Trend branşlar">
            {trending.length === 0 ? (
              <DashboardEmpty />
            ) : (
              trending.map((t) => (
                <DashboardRow
                  key={t.branch}
                  href={`/rankings/${encodeURIComponent(t.branch)}`}
                  primary={t.branch}
                  value={`${t.recentReviewCount} yorum`}
                />
              ))
            )}
          </DashboardSection>

          <DashboardSection title="En çok konuşulan hastaneler">
            {mostDiscussed.length === 0 ? (
              <DashboardEmpty />
            ) : (
              mostDiscussed.map((h) => (
                <DashboardRow
                  key={h.hospitalId}
                  href={`/hospital/${h.hospitalId}`}
                  primary={h.hospitalName}
                  secondary={h.hospitalCity}
                  value={`${h.recentReviewCount} yorum`}
                />
              ))
            )}
          </DashboardSection>
        </div>
      </Container>
    </>
  );
}
