import { NextResponse, type NextRequest } from "next/server";
import { verifyYappyIpnHash } from "@/lib/payments/yappy";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { completePaymentAndUpgrade, getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";

type IpnFields = {
  orderId: string;
  status: string;
  hash: string;
  domain: string;
};

function readField(source: Record<string, unknown>, key: string): string {
  const val = source[key];
  return typeof val === "string" ? val.trim() : "";
}

async function extractIpnFields(request: NextRequest): Promise<IpnFields> {
  const sp = request.nextUrl.searchParams;
  let bodyObj: Record<string, unknown> = {};

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    try {
      if (contentType.includes("application/json")) {
        const parsed = (await request.json()) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          bodyObj = parsed as Record<string, unknown>;
        }
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = new URLSearchParams(await request.text());
        bodyObj = Object.fromEntries(form.entries());
      }
    } catch {
      bodyObj = {};
    }
  }

  return {
    orderId: (readField(bodyObj, "orderId") || sp.get("orderId") || "").trim(),
    status: (readField(bodyObj, "status") || sp.get("status") || "").trim().toUpperCase(),
    hash: (readField(bodyObj, "hash") || sp.get("hash") || "").trim(),
    domain: (readField(bodyObj, "domain") || sp.get("domain") || "").trim()
  };
}

async function handleYappyIpn(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`ipn-yappy:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "RATE_LIMITED" }, { status: 429 });
  }

  const secretKey = process.env.YAPPY_SECRET_KEY;
  if (!secretKey || !isAdminConfigured()) {
    return NextResponse.json(
      { success: false, error: "WEBHOOK_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const params = await extractIpnFields(request);
  if (!params.orderId || !params.status || !params.hash) {
    return NextResponse.json(
      { success: false, error: "MISSING_PARAMS" },
      { status: 400 }
    );
  }

  if (!verifyYappyIpnHash(params, secretKey)) {
    return NextResponse.json(
      { success: false, error: "INVALID_SIGNATURE" },
      { status: 401 }
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: tx, error: txErr } = await admin
      .from("vicelink_transactions")
      .select("user_id, target_tier, amount_usd, status")
      .eq("provider", "yappy")
      .eq("provider_order_id", params.orderId)
      .maybeSingle();

    if (txErr) throw txErr;
    if (!tx) {
      return NextResponse.json(
        { success: false, error: "ORDER_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (params.status === "E") {
      const tier = await completePaymentAndUpgrade({
        provider: "yappy",
        providerOrderId: params.orderId,
        userId: tx.user_id,
        targetTier: tx.target_tier,
        amountUsd: Number(tx.amount_usd),
        rawPayload: params
      });
      return NextResponse.json(
        { success: true, orderId: params.orderId, status: "completed", tier },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (params.status === "R" || params.status === "C" || params.status === "X") {
      if (tx.status === "pending") {
        await admin
          .from("vicelink_transactions")
          .update({ status: "failed", raw_payload: params })
          .eq("provider", "yappy")
          .eq("provider_order_id", params.orderId)
          .eq("status", "pending");
      }
      return NextResponse.json(
        { success: true, orderId: params.orderId, status: "failed" },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      { success: false, error: "UNKNOWN_STATUS" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "IPN_PROCESSING_FAILED",
        message: err instanceof Error ? err.message : "Failed to process Yappy IPN"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleYappyIpn(request);
}

export async function POST(request: NextRequest) {
  return handleYappyIpn(request);
}
