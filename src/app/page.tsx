import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { Input } from "@/components/ui/input";
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

// Öne çıkan şehirler verisi sık değişmez (yalnızca yeni hastane
// eklendiğinde) — her istekte yeniden sorgulamak yerine 1 saatte bir
// yenilenen bir önbellek (ISR) kullanmak gereksiz veritabanı yükünü azaltır.
// Not: Sprint 8'deki "bu ay" verileri de günlük bazda değişse yeterli
// olduğu için aynı revalidate süresi korunuyor.
export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const dashboardRepository = new DashboardRepository(supabase);

  const [featuredCities, topClinics, mostImproved, trending, mostDiscussed] = await Promise.all([
    hospitalRepository.listFeaturedCities(6),
    dashboardRepository.topClinicsThisMonth(5),
    dashboardRepository.mostImprovedClinics(5),
    dashboardRepository.trendingSpecialties(5),
    dashboardRepository.mostDiscussedHospitals(5),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <LogoMark className="h-14 w-14 text-[color:var(--color-ring)] sm:h-16 sm:w-16" />
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Hekim Pusula
            </h1>
            <p className="mx-auto max-w-md text-sm text-primary-foreground/80 sm:text-base">
              Kura veya atama öncesi, doğru kurumu gerçek hekim deneyimleriyle
              keşfet.
            </p>
          </div>

          <form
            action="/search"
            className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
          >
            <Input
              name="q"
              placeholder="Hastane, il, ilçe veya branş ara… (örn. “Konya Göz”)"
              aria-label="Kurum veya klinik ara"
              className="h-11 border-transparent bg-white text-foreground sm:flex-1"
            />
            <Button type="submit" size="lg" className="h-11 sm:w-auto">
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
