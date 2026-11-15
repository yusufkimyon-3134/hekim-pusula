import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";
import { safeQuery } from "@/lib/safe-query";

export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featuredCities = await safeQuery(async () => {
    const supabase = await createClient();
    return new HospitalRepository(supabase).listFeaturedCities(6);
  }, []);

  return (
    <section className="bg-primary text-primary-foreground">
      <Container className="flex flex-col items-center gap-5 py-16 text-center sm:py-24">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">Hekim Pusula</h1>
          <p className="text-base text-primary-foreground/80">
            Hastaneyi, orada çalışan hekimlerden öğren.
          </p>
        </div>
        <form action="/search" className="mx-auto flex w-full max-w-xl items-start gap-2">
          <HospitalSuggestSearch name="q" placeholder="Hastane veya branş ara" ariaLabel="Hastane veya branş ara" className="min-w-0 flex-1" />
          <Button type="submit" size="lg" className="h-11 bg-[color:var(--color-ring)] text-primary hover:bg-[color:var(--color-ring)]/90">Ara</Button>
        </form>
        {featuredCities.length > 0 && (
          <details className="-mt-3 w-full max-w-xl">
            <summary className="mx-auto flex min-h-11 w-fit cursor-pointer list-none items-center text-sm text-primary-foreground/80 underline underline-offset-4 hover:text-primary-foreground [&::-webkit-details-marker]:hidden">
              Şehre göre keşfet
            </summary>
            <ul className="flex flex-wrap justify-center gap-x-5 text-sm">
              {featuredCities.map(({ city }) => (
                <li key={city}>
                  <Link prefetch={false} href={`/sehir/${encodeURIComponent(city)}`} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </Container>
    </section>
  );
}
