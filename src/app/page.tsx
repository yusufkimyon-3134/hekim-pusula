import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };

export default function HomePage() {
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
      </Container>
    </section>
  );
}
