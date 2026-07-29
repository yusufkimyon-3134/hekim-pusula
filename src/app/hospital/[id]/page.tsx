import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Sprint 1: statik placeholder. Gerçek veri çekme (Supabase) ve
// puanlama/yorum bileşenleri sonraki sprintlerde eklenecek.
export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container className="py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Hastane detayı
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kurum kimliği: <span className="font-mono">{id}</span>
          </p>
        </div>
        <Badge variant="secondary">Sprint 1 — placeholder</Badge>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Klinikler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bu kuruma bağlı klinik/branş listesi burada görünecek.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deneyim paylaşımları</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Puanlama ve yorumlar sonraki sprintte eklenecek.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
