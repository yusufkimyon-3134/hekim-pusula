// Supabase Edge Function (Deno runtime) — bu proje Next.js/Node içindir,
// bu dosya AYRI bir çalışma zamanında (Deno, Supabase Edge Functions
// platformu) çalışır. Kurulum adımları için bkz.
// docs/verification-document-retention.md.
//
// GÜVENLİK:
// - Bu fonksiyon herkese açık DEĞİLDİR — her istek, `x-cron-secret`
//   başlığındaki bir sırrı, yalnızca bu fonksiyona tanımlı
//   `CLEANUP_CRON_SECRET` ortam değişkeniyle karşılaştırarak doğrular.
//   Eşleşmezse (ya da hiç yoksa) istek reddedilir.
// - `SUPABASE_SERVICE_ROLE_KEY`, YALNIZCA burada, Edge Function'ın kendi
//   ortam değişkeni olarak kullanılıyor — hiçbir migration dosyasına,
//   Next.js koduna veya Git'e yazılmıyor. Supabase, Edge Function'lara
//   bu anahtarı ve `SUPABASE_URL`'i otomatik olarak sağlar.
//
// DAVRANIŞ:
// - Yalnızca `document_deleted_at IS NULL AND document_path IS NOT NULL
//   AND document_delete_after < now()` olan kayıtları işler (pending
//   başvurular document_delete_after=NULL olduğu için hiç seçilmez).
// - Her çalıştırmada en fazla BATCH_SIZE kayıt işler.
// - Storage'dan silme BAŞARISIZ olursa o kaydın document_path'i
//   DEĞİŞTİRİLMEZ — bir sonraki çalıştırmada tekrar denenir (idempotent).
// - Storage'dan silme BAŞARILI olduktan SONRA document_deleted_at
//   doldurulur ve document_path null'a çekilir. Başvuru satırının
//   kendisi hiçbir zaman silinmez.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "doctor-verification-documents";
const BATCH_SIZE = 20;

Deno.serve(async (req: Request) => {
  const expectedSecret = Deno.env.get("CLEANUP_CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Sunucu yapılandırması eksik (SUPABASE_URL / SERVICE_ROLE_KEY)." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: dueRequests, error: fetchError } = await supabase
    .from("doctor_verification_requests")
    .select("id, document_path")
    .is("document_deleted_at", null)
    .not("document_path", "is", null)
    .not("document_delete_after", "is", null)
    .lt("document_delete_after", new Date().toISOString())
    .limit(BATCH_SIZE);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const summary = { processed: 0, deleted: 0, failed: 0, errors: [] as string[] };

  for (const request of dueRequests ?? []) {
    summary.processed++;
    const documentPath = request.document_path as string | null;
    if (!documentPath) continue;

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([documentPath]);

    if (removeError) {
      // Storage silme başarısız — document_path'e DOKUNULMUYOR, bir
      // sonraki çalıştırmada tekrar denenecek.
      summary.failed++;
      summary.errors.push(`${request.id}: storage silme başarısız — ${removeError.message}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("doctor_verification_requests")
      .update({ document_deleted_at: new Date().toISOString(), document_path: null })
      .eq("id", request.id);

    if (updateError) {
      // Dosya Storage'dan silindi ama DB güncellenemedi — bu, elle
      // müdahale gerektiren nadir bir durum (loglanıyor, kayıt bir
      // sonraki çalıştırmada tekrar "silinmiş dosya, dolu path"
      // durumunda bulunamayabilir — bu yüzden hata olarak işaretleniyor).
      summary.failed++;
      summary.errors.push(`${request.id}: DB güncelleme başarısız — ${updateError.message}`);
      continue;
    }

    summary.deleted++;
  }

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
