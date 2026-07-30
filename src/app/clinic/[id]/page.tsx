import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { DetailPageHeader } from "@/components/layout/detail-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";

// Şimdilik klinik+hastane bilgisi nadiren değişiyor — 1 saatlik ISR.
// Sprint 4'te bu sayfaya yorumlar eklenince (sık değişen veri), bu süre
// kısaltılmalı veya on-demand revalidation'a geçilmeli.
export const revalidate = 3600;

export default async function ClinicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const clinic = await clinicRepository.findByIdWithHospital(id);

  if (!clinic) {
    notFound();
  }

  return (
    <Container className="py-10">
      <DetailPageHeader
        title={clinic.branch}
        subtitle={
          <>
            <Link
              href={`/hospital/${clinic.hospital.id}`}
              className="underline-offset-2 hover:underline"
            >
              {clinic.hospital.name}
            </Link>
            {" — "}
            {clinic.hospital.district}, {clinic.hospital.city}
          </>
        }
      />

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Deneyim paylaşımları
        </h2>
        <Card className="mt-3">
          <CardContent>
            <p className="py-6 text-center text-sm text-muted-foreground">
              Henüz değerlendirme yok.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
