import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";

export const revalidate = 3600;

export default async function RankingsIndexPage() {
  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  const branches = await clinicRepository.listBranches();

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Klinik sıralamaları</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bir branş seç, o branştaki klinikleri gerçek hekim değerlendirmelerine
        göre karşılaştır.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <Link key={branch} href={`/rankings/${encodeURIComponent(branch)}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="py-4">
                <p className="font-medium">En iyi {branch} klinikleri</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </Container>
  );
}
