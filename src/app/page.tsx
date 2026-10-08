import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import { DashboardSection, DashboardRow } from "@/features/dashboard/components/dashboard-section";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { DashboardRepository } from "@/lib/repositories/dashboard-repository";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";
import { formatScore } from "@/lib/format-score";
import { safeQuery } from "@/lib/safe-query";

export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featuredCities: Awaited<ReturnType<HospitalRepository["listFeaturedCities"]>> = [];
  let topClinics: Awaited<ReturnType<DashboardRepository["topClinicsThisMonth"]>> = [];
  let mostImproved: Awaited<ReturnType<DashboardRepository["mostImprovedClinics"]>> = [];
  let trending: Awaited<ReturnType<DashboardRepository["trendingSpecialties"]>> = [];
  let mostDiscussed: Awaited<ReturnType<DashboardRepository["mostDiscussedHospitals"]>> = [];
  let isVerified = false;
  try {
    const supabase = await createClient();
    const hospitalRepository = new HospitalRepository(supabase);
    const [cities, { data: userData }] = await Promise.all([
      safeQuery(() => hospitalRepository.listFeaturedCities(6), []),
      supabase.auth.getUser(),
    ]);
    featuredCities = cities;
    if (userData.user) {
      const doctor = await new DoctorRepository(supabase).findById(userData.user.id);
      isVerified = doctor?.isVerified === true;
    }
    // Review statistics are private. Do not query them for guests or unverified accounts.
    if (isVerified) {
      const dashboard = new DashboardRepository(supabase);
      [topClinics, mostImproved, trending, mostDiscussed] = await Promise.all([
        safeQuery(() => dashboard.topClinicsThisMonth(5), []),
        safeQuery(() => dashboard.mostImprovedClinics(5), []),
        safeQuery(() => dashboard.trendingSpecialties(5), []),
        safeQuery(() => dashboard.mostDiscussedHospitals(5), []),
      ]);
    }
  } catch (error) { console.error("[HomePage] Veriler alınamadı:", error); }
  const hasDashboard = [topClinics, mostImproved, trending, mostDiscussed].some((items) => items.length > 0);

  return <>
    <section className="bg-primary text-primary-foreground">
      <Container className="flex flex-col items-center gap-5 py-12 text-center sm:py-16">
        <LogoMark className="h-12 w-12 text-[color:var(--color-ring)]" />
        <div className="space-y-3"><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Hekim Pusula</h1><p className="mx-auto max-w-md text-base text-primary-foreground/80">Kura veya atama öncesi, doğru kurumu gerçek hekim deneyimleriyle keşfet.</p></div>
        <form action="/search" className="mx-auto flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-start">
          <HospitalSuggestSearch name="q" placeholder="Hastane veya branş adı yaz" ariaLabel="Kurum veya klinik ara" className="min-w-0 sm:flex-1" />
          <Button type="submit" size="lg" className="h-11 bg-[color:var(--color-ring)] text-primary hover:bg-[color:var(--color-ring)]/90 sm:w-auto">Ara</Button>
        </form>
        {isVerified ? <Link href="/career-match" className="text-sm text-primary-foreground/80 underline-offset-2 hover:underline">Kariyer eşleştirme ile sana uygun klinikleri bul</Link> : <p className="text-sm text-primary-foreground/80">Kurumları ücretsiz keşfet. Hekim deneyimleri için hesabını doğrula.</p>}
      </Container>
    </section>
    <Container className="py-10"><h2 className="text-lg font-semibold tracking-tight">Öne çıkan şehirler</h2><p className="mt-1 text-sm text-muted-foreground">Şehirdeki hastaneleri ve branş kayıtlarını keşfet.</p>{featuredCities.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Şehir listesi şu anda yüklenemedi. Yukarıdaki arama alanını kullanabilirsin.</p> : <div className="mt-5 flex flex-wrap gap-3">{featuredCities.map((city) => <Link key={city.city} href={`/sehir/${encodeURIComponent(city.city)}`} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm transition-colors hover:border-primary/40"><span className="font-medium">{city.city}</span><span className="rounded-full bg-accent px-2 py-0.5 text-sm font-semibold text-accent-foreground">{city.hospitalCount} kurum</span></Link>)}</div>}</Container>
    {hasDashboard ? <Container className="pb-12"><h2 className="text-lg font-semibold tracking-tight">Bu ay öne çıkanlar</h2><p className="mt-1 text-sm text-muted-foreground">Son 30 günün hekim değerlendirmelerinden hesaplanan istatistikler.</p><div className="mt-6 grid gap-8 sm:grid-cols-2">
      {topClinics.length > 0 && <DashboardSection title="Bu ayın en iyileri">{topClinics.map((clinic) => <DashboardRow key={clinic.clinicId} href={`/clinic/${clinic.clinicId}`} primary={clinic.hospitalName} secondary={`${clinic.branch} · ${clinic.hospitalCity}`} value={formatScore(clinic.avgOverallScore)} />)}</DashboardSection>}
      {mostImproved.length > 0 && <DashboardSection title="En çok gelişenler">{mostImproved.map((clinic) => <DashboardRow key={clinic.clinicId} href={`/clinic/${clinic.clinicId}`} primary={clinic.hospitalName} secondary={`${clinic.branch} · ${clinic.hospitalCity}`} value={`+${clinic.improvement.toFixed(1)}`} />)}</DashboardSection>}
      {trending.length > 0 && <DashboardSection title="Trend branşlar">{trending.map((item) => <DashboardRow key={item.branch} href={`/brans/${encodeURIComponent(item.branch)}`} primary={item.branch} value={`${item.recentReviewCount} yorum`} />)}</DashboardSection>}
      {mostDiscussed.length > 0 && <DashboardSection title="En çok konuşulan hastaneler">{mostDiscussed.map((hospital) => <DashboardRow key={hospital.hospitalId} href={`/hospital/${hospital.hospitalId}`} primary={hospital.hospitalName} secondary={hospital.hospitalCity} value={`${hospital.recentReviewCount} yorum`} />)}</DashboardSection>}
    </div></Container> : <Container className="pb-12"><section className="rounded-lg border bg-card p-6 sm:p-8"><h2 className="text-lg font-semibold">Çalıştığın kurumu meslektaşlarına anlat</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Nöbet, hasta yükü, eğitim ve teşvik hakkındaki deneyimin, tercih yapan bir hekime yol gösterebilir. Hastaneni ara, ilgili branşı seç ve deneyimini paylaş.</p><Button asChild className="mt-4"><Link href="/search">Hastanemi bul</Link></Button></section></Container>}
  </>;
}
