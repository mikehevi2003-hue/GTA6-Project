import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimitAsync } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import { runProgressScreenshotSync } from "@/lib/sync/progress-ocr";

const syncProgressSchema = z.object({
  imageBase64: z.string().max(5_500_000).optional(),
  mimeType: z.string().max(64).optional(),
  detectedText: z.string().max(1500).optional(),
  platform: z.enum(["ps5", "xbox", "pc", "auto"]).optional().default("auto")
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = await checkRateLimitAsync(`sync-progress:${user.id}`, 25, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many progress sync scans; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = syncProgressSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid progress sync payload.");
    }

    const rawText = parsed.data.detectedText ?? "";
    if (containsDisallowedMarkup(rawText)) {
      return apiError("INVALID_INPUT", 400, "Detected text contains disallowed markup.");
    }
    const cleanText = sanitizePlainText(rawText, 1000);

    const { profile, progress } = await ensureProfileAndProgress(supabase, user);
    if (profile.is_banned) {
      return apiError(
        "ACCOUNT_BANNED",
        403,
        "Your ViceLink account has been suspended by an administrator."
      );
    }

    const result = await runProgressScreenshotSync({
      supabase,
      userId: user.id,
      profile,
      progress,
      imageBase64: parsed.data.imageBase64,
      mimeType: parsed.data.mimeType,
      detectedText: cleanText,
      platform: parsed.data.platform
    });

    return apiJson(result);
  } catch (err) {
    return apiError(
      "SYNC_PROGRESS_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to sync screenshot progress"
    );
  }
}
