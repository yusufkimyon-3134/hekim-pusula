import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  if (body.confirmation !== "SİL") {
    return jsonResponse({ error: "Confirmation required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const bucket = adminClient.storage.from("doctor-verification-documents");
  const documentPaths: string[] = [];
  let offset = 0;

  while (true) {
    const { data: files, error: listError } = await bucket.list(user.id, {
      limit: 1000,
      offset,
    });
    if (listError) {
      return jsonResponse({ error: "Documents could not be listed" }, 500);
    }

    documentPaths.push(...files.map((file) => `${user.id}/${file.name}`));
    if (files.length < 1000) break;
    offset += files.length;
  }

  if (documentPaths.length > 0) {
    const { error: removeError } = await bucket.remove(documentPaths);
    if (removeError) {
      return jsonResponse({ error: "Documents could not be deleted" }, 500);
    }
  }

  await userClient.auth.signOut({ scope: "global" });

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return jsonResponse({ error: "Account could not be deleted" }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
