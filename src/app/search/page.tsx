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

// Sprint 1: statik placeholder veri. Gerçek arama/sıralama sonraki
// sprintlerde Supabase sorgularıyla değiştirilecek.
const placeholderResults = [
  { id: "1", name: "Devlet Hastanesi", il: "Ağrı", ilce: "Merkez" },
  { id: "2", name: "Eğitim ve Araştırma Hastanesi", il: "Kocaeli", ilce: "İzmit" },
  { id: "3", name: "Devlet Hastanesi", il: "Muş", ilce: "Bulanık" },
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

      <form className="mt-6 flex items-center gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Örn. Reyhanlı, Hatay…"
          aria-label="Kurum ara"
        />
        <Button type="submit">Ara</Button>
      </form>

      <div className="mt-8 space-y-3">
        {placeholderResults.map((k) => (
          <Card key={k.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{k.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {k.ilce}, {k.il}
                </p>
              </div>
              <Badge variant="secondary">Placeholder</Badge>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <a href={`/hospital/${k.id}`}>Detayı gör</a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
