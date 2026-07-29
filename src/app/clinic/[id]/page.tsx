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
export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Container className="py-10">
      <DetailPageHeader
        title="Klinik detayı"
        subtitle={
          <>
            Klinik kimliği: <span className="font-mono">{id}</span>
          </>
        }
        badgeLabel="Sprint 1 — placeholder"
      />

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branşa özel deneyimler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bu kliniğe (branşa) özel nöbet yükü, yönetim ve iş yükü
              puanlamaları sonraki sprintte eklenecek.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
