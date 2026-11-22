import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { HospitalSuggestSearch } from "@/components/hospital-suggest-search";
import { Button } from "@/components/ui/button";
import { ClinicRepository } from "@/lib/repositories/clinic-repository";
import { safeQuery } from "@/lib/safe-query";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "https://www.hekimpusula.com.tr/" } };

async function getRecentClinics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_clinic_review_summaries")
    .select("clinic_id")
    .order("last_verified_at", { ascending: false, nullsFirst: false })
    .order("clinic_id")
    .limit(2);

  if (error) throw error;
  const repository = new ClinicRepository(supabase);
  const clinics = await Promise.all(data.map(({ clinic_id }) => repository.findByIdWithHospital(clinic_id)));
  return clinics.filter((clinic) => clinic !== null);
}

export default async function HomePage() {
  const recentClinics = await safeQuery(getRecentClinics, []);
  return (
    <section className="h-full bg-white text-slate-900">
      <Container className="max-w-2xl space-y-8 pb-12 pt-7 sm:space-y-10 sm:pt-14">
        <div className="space-y-5">
          <h1 className="max-w-xl text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-4xl">
            Hastaneyi orada çalışan hekimlerden öğren
          </h1>
          <form action="/search" role="search" className="flex items-start gap-2">
            <HospitalSuggestSearch name="q" placeholder="Hastane veya şehir ara" ariaLabel="Hastane veya şehir ara" className="min-w-0 flex-1 [&>input]:border-slate-300" />
            <Button type="submit" size="icon" aria-label="Ara" className="size-11 shrink-0 bg-teal-700 text-white hover:bg-teal-800">
              <Search aria-hidden="true" className="size-5" />
            </Button>
          </form>
        </div>
        {recentClinics.length > 0 && (
          <section aria-labelledby="recent-clinics" className="space-y-3">
            <h2 id="recent-clinics" className="text-lg font-semibold tracking-tight sm:text-xl">Son değerlendirilen klinikler</h2>
            <ul className="space-y-2">
              {recentClinics.map((clinic) => (
                <li key={clinic.id}>
                  <Link prefetch={false} href={`/clinic/${clinic.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 sm:p-4">
                    <span className="min-w-0">
                      <span className="block font-semibold leading-snug">{clinic.hospital.name}</span>
                      <span className="mt-0.5 block text-sm text-slate-600">{clinic.branch}</span>
                    </span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-slate-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </Container>
    </section>
  );
}
