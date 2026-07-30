import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { HospitalRepository } from "@/lib/repositories/hospital-repository";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const supabase = await createClient();
  const hospitalRepository = new HospitalRepository(supabase);
  const results = await hospitalRepository.search(q);

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Kurum ara</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        İl, ilçe veya kurum adına göre ara.
      </p>

      <form action="/search" className="mt-6 flex items-center gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Örn. Reyhanlı, Hatay…"
          aria-label="Kurum ara"
        />
        <Button type="submit">Ara</Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        {results.length} sonuç
      </p>

      <div className="mt-2 space-y-3">
        {results.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sonuç bulunamadı.
          </p>
        )}
        {results.map((hospital) => (
          <Card key={hospital.id}>
            <CardHeader>
              <CardTitle className="text-base">{hospital.name}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {hospital.district}, {hospital.city}
              </p>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={`/hospital/${hospital.id}`}>Detayı gör</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
