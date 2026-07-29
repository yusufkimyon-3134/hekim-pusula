import { Container } from "@/components/layout/container";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
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
      <DetailPageHeader
        title="Hastane detayı"
        subtitle={
          <>
            Kurum kimliği: <span className="font-mono">{id}</span>
          </>
        }
        badgeLabel="Sprint 1 — placeholder"
      />

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
