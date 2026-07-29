import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Kurum } from "@/types";

// Sprint 1: statik placeholder veri. Gerçek arama/sıralama sonraki
// sprintlerde Supabase sorgularıyla değiştirilecek. `Kurum` tipini
// kullanmak, gerçek veri bağlandığında şeklin tutarlı kalmasını sağlar.
const placeholderResults: Kurum[] = [
  { id: "1", ad: "Devlet Hastanesi", il: "Ağrı", ilce: "Merkez" },
  { id: "2", ad: "Eğitim ve Araştırma Hastanesi", il: "Kocaeli", ilce: "İzmit" },
  { id: "3", ad: "Devlet Hastanesi", il: "Muş", ilce: "Bulanık" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

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

      <div className="mt-8 space-y-3">
        {placeholderResults.map((kurum) => (
          <Card key={kurum.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{kurum.ad}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {kurum.ilce}, {kurum.il}
                </p>
              </div>
              <Badge variant="secondary">Placeholder</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href={`/hospital/${kurum.id}`}>Detayı gör</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
