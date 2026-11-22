import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  getAuthedUser,
  mapDynamicPinRow,
  recordAdminAuditLog,
  requireAdminAal2
} from "@/lib/supabase/server";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const upsertPinSchema = z.object({
  id: z.string().trim().regex(ID_PATTERN).optional(),
  tier: z.enum(["free", "street", "kingpin"]).optional().default("street"),
  type: z.enum(["Money", "ATM", "RareCar", "Fence", "EasterEgg", "Collectible"]),
  region: z.string().max(100),
  icon: z.string().max(24),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
  nameEn: z.string().max(200),
  nameEs: z.string().max(200),
  noteEn: z.string().max(600).optional().default(""),
  noteEs: z.string().max(600).optional().default("")
});

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

    const rl = checkRateLimit(`admin-pins:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many admin actions; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = upsertPinSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid map pin payload.");
    }

    const input = parsed.data;
    const textValues = [
      input.region,
      input.icon,
      input.nameEn,
      input.nameEs,
      input.noteEn,
      input.noteEs
    ];
    if (textValues.some((val) => containsDisallowedMarkup(val))) {
      return apiError("INVALID_INPUT", 400, "Pin fields may not contain HTML or script markup.");
    }

    const region = sanitizePlainText(input.region, 60);
    const icon = sanitizePlainText(input.icon, 16);
    const nameEn = sanitizePlainText(input.nameEn, 140);
    const nameEs = sanitizePlainText(input.nameEs, 140);

    if (region.length < 2 || icon.length < 1 || nameEn.length < 2 || nameEs.length < 2) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Region, icon, and bilingual EN/ES names (2+ chars) are required."
      );
    }

    const id = input.id || `dyn_${crypto.randomUUID().slice(0, 8)}`;
    const coordX = Math.round(input.x * 100) / 100;
    const coordY = Math.round(input.y * 100) / 100;

    const { data, error } = await supabase
      .from("vicelink_dynamic_map_pins")
      .upsert(
        {
          id,
          tier: input.tier,
          pin_type: input.type,
          region,
          icon,
          coord_x: coordX,
          coord_y: coordY,
          name_en: nameEn,
          name_es: nameEs,
          note_en: sanitizePlainText(input.noteEn, 500),
          note_es: sanitizePlainText(input.noteEs, 500)
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: "MAP_PIN_UPSERTED",
      targetId: id,
      details: {
        nameEn,
        region,
        type: input.type,
        tier: input.tier,
        x: coordX,
        y: coordY
      }
    });

    return apiJson({ pin: mapDynamicPinRow(data) });
  } catch (err) {
    return apiError(
      "ADMIN_PIN_SAVE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to save dynamic map pin"
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const rl = checkRateLimit(`admin-pins:${user.id}`, 120, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many admin actions; please wait a moment.");
    }

    const pinId = (request.nextUrl.searchParams.get("id") ?? "").trim();
    if (!pinId || !ID_PATTERN.test(pinId)) {
      return apiError("INVALID_INPUT", 400, "Valid pin id query parameter is required.");
    }

    const { data, error } = await supabase
      .from("vicelink_dynamic_map_pins")
      .delete()
      .eq("id", pinId)
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return apiError("PIN_NOT_FOUND", 404, "Dynamic map pin not found.");
    }

    await recordAdminAuditLog(supabase, {
      adminId: user.id,
      adminEmail: admin.profile.email,
      actionType: "MAP_PIN_DELETED",
      targetId: data.id,
      details: { pinId: data.id }
    });

    return apiJson({ ok: true, id: data.id });
  } catch (err) {
    return apiError(
      "ADMIN_PIN_DELETE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to delete dynamic map pin"
    );
  }
}
