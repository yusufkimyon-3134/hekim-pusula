import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SearchSuggestionRepository } from "@/lib/repositories/search-suggestion-repository";

/**
 * Ana sayfadaki gerçek zamanlı öneri kutusu bu route'u çağırır (debounce'lu,
 * istemciden). Server Action değil, sıradan bir GET route — çünkü istemci
 * tarafında `fetch` + `AbortController` ile önceki (artık geçersiz) isteği
 * iptal edebilmek gerekiyor; bu, hızlı yazarken eski bir yanıtın yeni
 * yazılan harflerin üzerine geç gelip öneri listesini "geri sarmasını"
 * (race condition) engelliyor.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  // İstemci zaten 2 karakter altında istek atmıyor (debounce mantığında),
  // ama route doğrudan çağrılırsa diye burada da aynı kural uygulanıyor —
  // SQL fonksiyonu da (savunma katmanı) aynı kontrolü kendi içinde yapıyor.
  if (query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const supabase = await createClient();
    const repository = new SearchSuggestionRepository(supabase);
    const suggestions = await repository.search(query, 8);

    return NextResponse.json({
      suggestions: suggestions.map((s) => ({
        ...s,
        href: s.type === "hospital" ? `/hospital/${s.id}` : `/clinic/${s.id}`,
      })),
    });
  } catch (error) {
    console.error("[api/search-suggestions] Öneriler getirilemedi:", error);
    // Öneri kutusu, arama deneyiminin tamamlayıcısı — başarısız olursa
    // sessizce boş liste dönüyoruz, kullanıcı yine de "Ara" ile normal
    // aramaya devam edebilsin diye hata sayfası göstermiyoruz.
    return NextResponse.json({ suggestions: [] });
  }
}
