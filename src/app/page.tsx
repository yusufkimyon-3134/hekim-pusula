import Link from "next/link";
import { Container } from "@/components/layout/container";
import { LogoMark } from "@/components/logo-mark";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";

// Öne çıkan şehirler verisi sık değişmez (yalnızca yeni hastane
// eklendiğinde) — her istekte yeniden sorgulamak yerine 1 saatte bir
// yenilenen bir önbellek (ISR) kullanmak gereksiz veritabanı yükünü azaltır.
export const revalidate = 3600;

export default async function HomePage() {
  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const featuredCities = await hospitalRepository.listFeaturedCities(6);

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
    </>
  );
}
