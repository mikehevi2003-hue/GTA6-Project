import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let supabaseStatus: "ok" | "degraded" = "ok";

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      supabaseStatus = "degraded";
    } else {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      if (error) {
        supabaseStatus = "degraded";
      }
    }
  } catch {
    supabaseStatus = "degraded";
  }

  const status = supabaseStatus === "ok" ? "healthy" : "degraded";

  return NextResponse.json(
    {
      ok: status === "healthy",
      status,
      version: "2.6",
      timestamp,
      checks: {
        runtime: "ok",
        supabase: supabaseStatus
      },
      services: {
        resendConfigured: Boolean(process.env.RESEND_API_KEY),
        upstashConfigured: Boolean(
          process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ),
        sentryConfigured: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
      }
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    }
  );
}
