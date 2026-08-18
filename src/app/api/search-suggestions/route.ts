import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SearchSuggestionRepository } from "@/lib/repositories/search-suggestion-repository";
import { DoctorRepository } from "@/lib/repositories/doctor-repository";

type ReviewAccess = "verified" | "anonymous" | "unverified";

/**
 * Ana sayfadaki gerçek zamanlı kurum/klinik önerileri.
 *
 * Kurum/klinik keşfi herkese açıktır. Değerlendirme sayısı ve içeriği
 * yalnızca doğrulanmış hekime gösterilir. Bu route middleware allowlist'inde
 * public'tir; asıl değerlendirme verileri RLS ile korunmaya devam eder.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [], reviewAccess: "anonymous" });
  }

  try {
    const supabase = await createClient();
    const repository = new SearchSuggestionRepository(supabase);

    // Aramayı auth kontrolünden bağımsız çalıştırıyoruz. Böylece bozuk/eski
    // bir oturum çerezi kurum keşfini engellemez.
    const suggestions = await repository.search(query, 8);

    let reviewAccess: ReviewAccess = "anonymous";
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (!authError && authData.user) {
      reviewAccess = "unverified";
      try {
        const doctorRepository = new DoctorRepository(supabase);
        const doctor = await doctorRepository.findById(authData.user.id);
        if (doctor?.isVerified === true) reviewAccess = "verified";
      } catch {
        // Profil sorgusu başarısız olsa bile keşif sonucunu kaybetme.
        reviewAccess = "unverified";
      }
    }

    return NextResponse.json({
      reviewAccess,
      suggestions: suggestions.map((s) => ({
        ...s,
        reviewCount: reviewAccess === "verified" ? s.reviewCount : null,
        href: s.type === "hospital" ? `/hospital/${s.id}` : `/clinic/${s.id}`,
      })),
    });
  } catch (error) {
    console.error("[api/search-suggestions] Öneriler getirilemedi:", error);
    return NextResponse.json(
      { suggestions: [], reviewAccess: "anonymous" },
      { status: 200 }
    );
  }
}
