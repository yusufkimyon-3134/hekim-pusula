import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = Reflect.get(process.env, "ANTHROPIC_API_KEY");
  const apiKey = typeof raw === "string" ? raw.trim() : "";

  return NextResponse.json(
    {
      ok: true,
      anthropicConfigured: apiKey.length > 0,
      keyLooksLikeAnthropic: apiKey.startsWith("sk-ant-"),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      targetEnv: process.env.VERCEL_TARGET_ENV ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
