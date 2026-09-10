import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import { DashboardSection, DashboardRow, DashboardEmpty } from "@/features/dashboard/components/dashboard-section";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { DashboardRepository } from "@/lib/repositories/dashboard-repository";
import { formatScore } from "@/lib/format-score";
import { safeQuery } from "@/lib/safe-query";

export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };
export const revalidate = 3600;

export default async function HomePage() {
  let featuredCities: Awaited<ReturnType<HospitalRepository["listFeaturedCities"]>> = [];
  let topClinics: Awaited<ReturnType<DashboardRepository["topClinicsThisMonth"]>> = [];
  let mostImproved: Awaited<ReturnType<DashboardRepository["mostImprovedClinics"]>> = [];
  let trending: Awaited<ReturnType<DashboardRepository["trendingSpecialties"]>> = [];
  let mostDiscussed: Awaited<ReturnType<DashboardRepository["mostDiscussedHospitals"]>> = [];

  try {
    const supabase = await createClient();
    const hospitalRepository = new HospitalRepository(supabase);
    const dashboardRepository = new DashboardRepository(supabase);
    [featuredCities, topClinics, mostImproved, trending, mostDiscussed] = await Promise.all([
      safeQuery("home.featuredCities", () => hospitalRepository.listFeaturedCities(8), []),
      safeQuery("home.topClinics", () => dashboardRepository.topClinicsThisMonth(5), []),
      safeQuery("home.mostImproved", () => dashboardRepository.mostImprovedClinics(5), []),
      safeQuery("home.trending", () => dashboardRepository.trendingSpecialties(5), []),
      safeQuery("home.mostDiscussed", () => dashboardRepository.mostDiscussedHospitals(5), []),
    ]);
  } catch (error) { console.error("[home] Supabase başlatılamadı:", error); }

  return <>
    <section className="border-b bg-muted/20"><Container className="py-14 text-center sm:py-20"><div className="mx-auto max-w-2xl space-y-5"><div className="flex justify-center"><LogoMark className="size-12" /></div><div className="space-y-2"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Hekimlerin kurum deneyimi, hekimlerden.</h1><p className="text-muted-foreground">Hastane ve klinik çalışma koşullarını keşfet. Nöbet, eğitim, yönetim ve teşvik deneyimlerini doğrulanmış hekimlerden öğren.</p></div><HospitalSuggestSearch /><div className="flex flex-wrap justify-center gap-2"><Button asChild><Link href="/search">Hastane ve klinik ara</Link></Button><Button asChild variant="outline"><Link href="/register">Deneyimini paylaş</Link></Button></div></div></Container></section>
    <Container className="space-y-12 py-10">
      <section className="space-y-4"><h2 className="text-lg font-semibold">Öne çıkan şehirler</h2>{featuredCities.length ? <div className="flex flex-wrap gap-2">{featuredCities.map((city) => <Button key={city.city} asChild variant="outline" size="sm"><Link href={`/search?city=${encodeURIComponent(city.city)}`}>{city.city} ({city.hospitalCount})</Link></Button>)}</div> : <p className="text-sm text-muted-foreground">Şehirler yükleniyor.</p>}</section>
      <DashboardSection title="Bu ay öne çıkan klinikler">{topClinics.length ? topClinics.map((item) => <DashboardRow key={item.clinicId} title={item.branch} subtitle={item.hospitalName} value={formatScore(item.score)} href={`/clinic/${item.clinicId}`} />) : <DashboardEmpty />}</DashboardSection>
      <DashboardSection title="En çok gelişen klinikler">{mostImproved.length ? mostImproved.map((item) => <DashboardRow key={item.clinicId} title={item.branch} subtitle={item.hospitalName} value={`+${formatScore(item.delta)}`} href={`/clinic/${item.clinicId}`} />) : <DashboardEmpty />}</DashboardSection>
      <DashboardSection title="Gündemdeki branşlar">{trending.length ? trending.map((item) => <DashboardRow key={item.specialty} title={item.specialty} subtitle="Son dönem hekim deneyimleri" value={`${item.reviewCount} deneyim`} href={`/search?q=${encodeURIComponent(item.specialty)}`} />) : <DashboardEmpty />}</DashboardSection>
      <DashboardSection title="En çok konuşulan hastaneler">{mostDiscussed.length ? mostDiscussed.map((item) => <DashboardRow key={item.hospitalId} title={item.hospitalName} subtitle={item.city} value={`${item.reviewCount} deneyim`} href={`/hospital/${item.hospitalId}`} />) : <DashboardEmpty />}</DashboardSection>
    </Container>
  </>;
}
