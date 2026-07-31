import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { RankingRow } from "@/features/ranking/components/ranking-row";
import { createClient } from "@/lib/supabase/server";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { safeQuery } from "@/lib/safe-query";
import type { RankingSortBy } from "@/types";

const SORT_OPTIONS: { value: RankingSortBy; label: string }[] = [
  { value: "overall", label: "Genel puan" },
  { value: "education", label: "Eğitim kalitesi" },
  { value: "academic", label: "Akademik fırsatlar" },
  { value: "workload", label: "İş yükü (az → çok)" },
  { value: "night_shifts", label: "Nöbet sayısı (az → çok)" },
];

const VALID_SORTS = new Set(SORT_OPTIONS.map((o) => o.value));

export const revalidate = 3600;

export default async function BranchRankingPage({
  params,
  searchParams,
}: {
  params: Promise<{ branch: string }>;
  searchParams: Promise<{ sortBy?: string }>;
}) {
  const { branch: encodedBranch } = await params;
  const branch = decodeURIComponent(encodedBranch);
  const { sortBy: rawSortBy } = await searchParams;
  const sortBy: RankingSortBy = VALID_SORTS.has(rawSortBy as RankingSortBy)
    ? (rawSortBy as RankingSortBy)
    : "overall";

  const supabase = await createClient();
  const clinicRepository = new ClinicRepository(supabase);
  // Bug fix: Supabase erişilemezse sayfa çökmesin — boş sonuç normal
  // "bulunamadı" (404) akışına düşer.
  const rankings = await safeQuery(() => clinicRepository.rankByBranch(branch, sortBy), []);

  if (rankings.length === 0) {
    notFound();
  }

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-semibold tracking-tight">
        En iyi {branch} klinikleri
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {rankings.length} klinik listeleniyor. Karşılaştırmak için iki tane
        seç.
      </p>

      <form
        action={`/rankings/${encodeURIComponent(branch)}`}
        className="mt-4 flex items-center gap-2"
      >
        <NativeSelect name="sortBy" defaultValue={sortBy} className="w-auto">
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" size="sm">
          Sırala
        </Button>
      </form>

      <form action="/compare" className="mt-6 space-y-2">
        {rankings.map((ranking, index) => (
          <RankingRow key={ranking.clinicId} ranking={ranking} position={index + 1} />
        ))}
        <Button type="submit" className="mt-4">
          Seçilenleri karşılaştır
        </Button>
      </form>
    </Container>
  );
}
