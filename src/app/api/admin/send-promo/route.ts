import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  loadEmailCampaigns,
  mapEmailCampaignRow,
  recordAdminAuditLog,
  requireAdminAal2
} from "@/lib/supabase/server";
import type { EmailCampaignItem } from "@/types/vicelink";

const sendPromoSchema = z.object({
  audience: z.enum(["all_opted_in", "free_only", "street_only"]).default("all_opted_in"),
  subjectEn: z.string().trim().min(2).max(180),
  subjectEs: z.string().trim().min(2).max(180),
  bodyEn: z.string().trim().min(5).max(4000),
  bodyEs: z.string().trim().min(5).max(4000),
  promoCode: z.string().trim().max(24).optional().default(""),
  testEmailOnly: z.string().trim().max(180).optional().default("")
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPromotionalEmailHtml(params: {
  lang: "en" | "es";
  handle: string;
  subject: string;
  body: string;
  promoCode: string;
  origin: string;
  unsubscribeUrl: string;
}): string {
  const { lang, handle, subject, body, promoCode, origin, unsubscribeUrl } = params;
  const paragraphs = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#cfd8f0;">${escapeHtml(line)}</p>`
    )
    .join("");

  const promoBlock = promoCode
    ? `<div style="margin:22px 0;padding:18px;border-radius:14px;background:rgba(0,240,255,0.08);border:1px dashed #00f0ff;text-align:center;">
        <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#00f0ff;font-weight:700;margin-bottom:6px;">
          ${lang === "es" ? "CÓDIGO PROMOCIONAL VIP ACTIVO" : "ACTIVE VIP PROMO CODE"}
        </div>
        <div style="font-size:24px;font-weight:900;letter-spacing:0.12em;color:#ffffff;font-family:monospace;">
          ${escapeHtml(promoCode)}
        </div>
        <div style="font-size:12px;color:#9fb0d9;margin-top:6px;">
          ${
            lang === "es"
              ? "Aplícalo en el modal de Acceso VIP en ViceLink Hub (Pago único • Sin suscripción)"
              : "Apply inside the ViceLink Hub VIP Access modal (One-time pass • No subscription)"
          }
        </div>
      </div>`
    : "";

  const ctaLabel =
    lang === "es"
      ? "Abrir ViceLink Leonida Hub →"
      : "Launch ViceLink Leonida Hub →";

  const footerLegal =
    lang === "es"
      ? "Enviado conforme a la Ley 81 de 2019 de la República de Panamá (Protección de Datos Personales). Recibes este mensaje porque tu cuenta tiene activadas las comunicaciones promocionales."
      : "Sent in compliance with Republic of Panama Law 81 of 2019 (Personal Data Protection). You received this message because promotional updates are enabled on your ViceLink account.";

  const unsubLabel =
    lang === "es"
      ? "Darse de baja en 1 clic (/api/unsubscribe)"
      : "1-Click Unsubscribe (/api/unsubscribe)";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:28px 16px;background-color:#05070e;color:#f4f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:30px 26px;border-radius:18px;background-color:#0b0f1c;border:1px solid rgba(0,240,255,0.28);">
    <div style="font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#ff2a85;margin-bottom:10px;">
      VICELINK • LEONIDA COMMAND DISPATCH
    </div>
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#ffffff;">
      ${escapeHtml(subject)}
    </h1>
    <p style="margin:0 0 14px;font-size:14px;color:#00f0ff;font-weight:700;">
      ${lang === "es" ? `Hola ${escapeHtml(handle)},` : `Greetings ${escapeHtml(handle)},`}
    </p>
    ${paragraphs}
    ${promoBlock}
    <div style="margin:24px 0 10px;">
      <a href="${escapeHtml(origin)}/" style="display:inline-block;padding:13px 24px;border-radius:10px;background:linear-gradient(135deg,#ff2a85,#00f0ff);color:#05070e;font-weight:900;font-size:14px;text-decoration:none;">
        ${ctaLabel}
      </a>
    </div>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:26px 0 16px;" />
    <p style="margin:0 0 10px;font-size:11px;line-height:1.5;color:#7e8bb0;">
      ${footerLegal}
    </p>
    <p style="margin:0;font-size:12px;">
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#00f0ff;text-decoration:underline;">
        ${unsubLabel}
      </a>
    </p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const adminCheck = await requireAdminAal2(supabase, user);
    if (!adminCheck.ok) {
      return apiError(adminCheck.error, adminCheck.status, adminCheck.message, {
        aal: adminCheck.aal,
        setupUrl: adminCheck.setupUrl
      });
    }
    const admin = adminCheck;

    const rl = checkRateLimit(`admin-send-promo:${user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many email broadcasts; please wait a minute.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = sendPromoSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError(
        "INVALID_INPUT",
        400,
        parsed.error.issues[0]?.message ?? "Invalid email campaign payload."
      );
    }

    const input = parsed.data;
    if (
      containsDisallowedMarkup(input.subjectEn) ||
      containsDisallowedMarkup(input.subjectEs) ||
      containsDisallowedMarkup(input.bodyEn) ||
      containsDisallowedMarkup(input.bodyEs)
    ) {
      return apiError("INVALID_INPUT", 400, "Campaign subject or body contains disallowed HTML/script markup.");
    }

    const cleanSubjectEn = sanitizePlainText(input.subjectEn, 180);
    const cleanSubjectEs = sanitizePlainText(input.subjectEs, 180);
    const cleanBodyEn = sanitizePlainText(input.bodyEn, 4000);
    const cleanBodyEs = sanitizePlainText(input.bodyEs, 4000);
    const cleanPromoCode = input.promoCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 24);
    const cleanTestEmail = input.testEmailOnly.trim().toLowerCase();

    const origin = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/+$/, "");

    const recipientsRes = await supabase.rpc("vicelink_admin_campaign_recipients", {
      p_audience: input.audience,
      p_test_email: cleanTestEmail
    });

    type RecipientRow = {
      user_id: string;
      email: string;
      handle: string;
      preferred_lang: "en" | "es";
      unsubscribe_token: string;
      access_tier: "free" | "street" | "kingpin";
    };

    let recipients: RecipientRow[] = [];
    if (!recipientsRes.error && recipientsRes.data && recipientsRes.data.length > 0) {
      recipients = recipientsRes.data;
    } else {
      // Ensure at least the target test email or admin preview recipient is included
      recipients = [
        {
          user_id: user.id,
          email: cleanTestEmail || admin.profile.email || user.email || "mikehevi2003@gmail.com",
          handle: admin.profile.handle || "@founder",
          preferred_lang: admin.profile.preferred_lang || "en",
          unsubscribe_token: admin.profile.unsubscribe_token || "law81-preview-token",
          access_tier: admin.profile.access_tier
        }
      ];
    }

    const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() || "ViceLink Leonida Hub <intel@vicelink.app>";
    const deliveryMode: "resend_live" | "dry_run_logged" =
      resendApiKey.length > 0 ? "resend_live" : "dry_run_logged";

    let deliveredCount = 0;
    let samplePreviewHtml = "";

    for (const recipient of recipients) {
      const lang: "en" | "es" = recipient.preferred_lang === "es" ? "es" : "en";
      const subject = lang === "es" ? cleanSubjectEs : cleanSubjectEn;
      const body = lang === "es" ? cleanBodyEs : cleanBodyEn;
      const unsubscribeUrl = `${origin}/api/unsubscribe?uid=${encodeURIComponent(
        recipient.user_id
      )}&token=${encodeURIComponent(recipient.unsubscribe_token || "")}`;

      const html = buildPromotionalEmailHtml({
        lang,
        handle: recipient.handle || "@agent",
        subject,
        body,
        promoCode: cleanPromoCode,
        origin,
        unsubscribeUrl
      });

      if (!samplePreviewHtml) {
        samplePreviewHtml = html;
      }

      if (deliveryMode === "resend_live") {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [recipient.email],
              subject,
              html,
              headers: {
                "List-Unsubscribe": `<${unsubscribeUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
              }
            })
          });
          if (res.ok) {
            deliveredCount += 1;
          }
        } catch {
          // Continue sending remaining recipients
        }
      } else {
        deliveredCount += 1;
      }
    }

    const adminEmail = admin.profile.email || user.email || "admin";
    let savedCampaign: EmailCampaignItem = {
      id: `camp_${Date.now()}`,
      adminEmail,
      audience: input.audience,
      subjectEn: cleanSubjectEn,
      subjectEs: cleanSubjectEs,
      bodyEn: cleanBodyEn,
      bodyEs: cleanBodyEs,
      promoCode: cleanPromoCode,
      recipientsCount: recipients.length,
      deliveredCount,
      deliveryMode,
      createdAt: new Date().toISOString()
    };

    const insertRes = await supabase
      .from("vicelink_email_campaigns")
      .insert({
        admin_id: user.id,
        admin_email: adminEmail,
        audience: input.audience,
        subject_en: cleanSubjectEn,
        subject_es: cleanSubjectEs,
        body_en: cleanBodyEn,
        body_es: cleanBodyEs,
        promo_code: cleanPromoCode,
        recipients_count: recipients.length,
        delivered_count: deliveredCount,
        delivery_mode: deliveryMode
      })
      .select("*")
      .maybeSingle();

    if (!insertRes.error && insertRes.data) {
      savedCampaign = mapEmailCampaignRow(insertRes.data);
    }

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail,
      actionType: "PROMO_CAMPAIGN_SENT",
      targetId: cleanPromoCode || input.audience,
      details: {
        audience: input.audience,
        promoCode: cleanPromoCode,
        testEmailOnly: cleanTestEmail || null,
        recipientsCount: recipients.length,
        deliveredCount,
        deliveryMode
      }
    });

    const emailCampaigns = await loadEmailCampaigns(supabase, 30);

    return apiJson({
      ok: true,
      campaign: savedCampaign,
      emailCampaigns: emailCampaigns.length > 0 ? emailCampaigns : [savedCampaign],
      recipientsCount: recipients.length,
      deliveredCount,
      deliveryMode,
      samplePreviewHtml
    });
  } catch (err) {
    return apiError(
      "ADMIN_SEND_PROMO_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to dispatch promotional campaign"
    );
  }
}
