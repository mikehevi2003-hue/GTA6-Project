import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import { apiError, apiJson, createClient } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_REGEX = /^[A-Za-z0-9_-]{0,128}$/;

async function performUnsubscribe(uid: string, token: string): Promise<boolean> {
  const cleanUid = uid.trim();
  const cleanToken = token.trim();

  if (!UUID_REGEX.test(cleanUid) || !TOKEN_REGEX.test(cleanToken)) {
    return false;
  }

  if (isAdminConfigured()) {
    try {
      const admin = getSupabaseAdmin();
      const rpcRes = await admin.rpc("vicelink_unsubscribe_email", {
        p_uid: cleanUid,
        p_token: cleanToken
      });
      if (!rpcRes.error && rpcRes.data === true) {
        return true;
      }

      let query = admin
        .from("vicelink_profiles")
        .update({ marketing_opt_in: false })
        .eq("user_id", cleanUid);

      if (cleanToken.length > 0) {
        query = query.eq("unsubscribe_token", cleanToken);
      }

      const { error } = await query;
      if (!error) return true;
    } catch {
      // Fall through to request-scoped client
    }
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("vicelink_unsubscribe_email", {
      p_uid: cleanUid,
      p_token: cleanToken
    });
    if (!error && Boolean(data)) return true;

    const { error: updateErr } = await supabase
      .from("vicelink_profiles")
      .update({ marketing_opt_in: false })
      .eq("user_id", cleanUid);

    return !updateErr;
  } catch {
    return false;
  }
}

function renderUnsubscribeHtml(params: { ok: boolean; uid: string }): string {
  const { ok } = params;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ViceLink — Law 81 Email Preferences / Preferencias de Correo</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: radial-gradient(circle at 20% 10%, rgba(255, 42, 133, 0.16), transparent 45%),
                  radial-gradient(circle at 80% 90%, rgba(0, 240, 255, 0.14), transparent 45%),
                  #05070e;
      color: #f4f7ff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .card {
      width: 100%;
      max-width: 540px;
      padding: 32px;
      border-radius: 18px;
      background: rgba(11, 15, 28, 0.88);
      border: 1px solid rgba(0, 240, 255, 0.28);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(18px);
    }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      background: ${ok ? "rgba(0, 245, 160, 0.14)" : "rgba(255, 179, 0, 0.15)"};
      color: ${ok ? "#00f5a0" : "#ffd166"};
      border: 1px solid ${ok ? "rgba(0, 245, 160, 0.38)" : "rgba(255, 179, 0, 0.4)"};
      margin-bottom: 16px;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 22px;
      line-height: 1.3;
      color: #ffffff;
    }
    p {
      margin: 0 0 14px;
      font-size: 14px;
      line-height: 1.6;
      color: #b7c2df;
    }
    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 18px 0;
    }
    .legal {
      font-size: 12px;
      color: #7e8bb0;
    }
    .btn {
      display: inline-block;
      margin-top: 14px;
      padding: 11px 20px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ff2a85, #00f0ff);
      color: #05070e;
      font-weight: 800;
      font-size: 13px;
      text-decoration: none;
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>
  <main class="card">
    <span class="badge">${ok ? "✓ Unsubscribed / Baja Confirmada" : "⚠ Invalid Link / Enlace Inválido"}</span>
    <h1>${
      ok
        ? "Promotional Emails Disabled"
        : "Unable to Verify Unsubscribe Link"
    }</h1>
    <p>${
      ok
        ? "Your ViceLink email preference has been updated (marketing_opt_in = false). You will no longer receive promotional broadcasts or discount alerts."
        : "The unsubscribe link is missing a valid account identifier (uid). You can also toggle promotional emails anytime inside your ViceLink Account & Security view."
    }</p>
    <div class="divider"></div>
    <h1>${
      ok
        ? "Correos Promocionales Desactivados"
        : "No se pudo verificar el enlace de baja"
    }</h1>
    <p>${
      ok
        ? "Tu preferencia de correo en ViceLink ha sido actualizada (marketing_opt_in = false). Ya no recibirás boletines promocionales ni alertas de descuentos."
        : "Al enlace le falta un identificador de cuenta válido (uid). También puedes desactivar los correos promocionales en cualquier momento desde tu pestaña Cuenta y Seguridad."
    }</p>
    <p class="legal">
      Panama Law 81 of 2019 (Ley 81 de 2019 sobre Protección de Datos Personales) &amp; RFC 8058 One-Click Unsubscribe Compliance.
    </p>
    <a class="btn" href="/">Return to ViceLink Hub / Volver al Hub</a>
  </main>
</body>
</html>`;
}

/**
 * Panama Law 81 (Ley 81 de 2019) & RFC 8058 1-Click Unsubscribe Route.
 */
export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid")?.trim() ?? "";
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (!UUID_REGEX.test(uid)) {
    return new NextResponse(renderUnsubscribeHtml({ ok: false, uid }), {
      status: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store"
      }
    });
  }

  await performUnsubscribe(uid, token);

  return new NextResponse(renderUnsubscribeHtml({ ok: true, uid }), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store"
    }
  });
}

export async function POST(request: NextRequest) {
  let uid = request.nextUrl.searchParams.get("uid")?.trim() ?? "";
  let token = request.nextUrl.searchParams.get("token")?.trim() ?? "";

  if (!uid) {
    try {
      const contentType = request.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await request.json()) as Record<string, unknown>;
        if (typeof body.uid === "string") uid = body.uid.trim();
        if (typeof body.token === "string") token = body.token.trim();
      } else {
        const formText = await request.text();
        const params = new URLSearchParams(formText);
        uid = params.get("uid")?.trim() ?? uid;
        token = params.get("token")?.trim() ?? token;
      }
    } catch {
      // Use query params
    }
  }

  if (!UUID_REGEX.test(uid)) {
    return apiError("INVALID_UID", 400, "Valid account UUID is required to unsubscribe.");
  }

  const unsubscribed = await performUnsubscribe(uid, token);
  return apiJson({
    ok: true,
    unsubscribed,
    uid
  });
}
