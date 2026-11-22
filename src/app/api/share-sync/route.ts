import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimitAsync } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import { runProgressScreenshotSync } from "@/lib/sync/progress-ocr";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function buildRedirectUrl(request: NextRequest, pathWithQuery: string): URL {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto") ||
      request.nextUrl.protocol.replace(":", "") ||
      "https";
    return new URL(pathWithQuery, `${proto}://${host}`);
  }
  return new URL(pathWithQuery, request.url);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) {
      return NextResponse.redirect(buildRedirectUrl(request, "/login?next=account"), 303);
    }

    const rl = await checkRateLimitAsync(`share-sync:${user.id}`, 20, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many share sync uploads; please wait a moment.");
    }

    const { profile, progress } = await ensureProfileAndProgress(supabase, user);
    if (profile.is_banned) {
      return apiError(
        "ACCOUNT_BANNED",
        403,
        "Your ViceLink account has been suspended by an administrator."
      );
    }

    const formData = await request.formData();
    const rawTitle = typeof formData.get("title") === "string" ? String(formData.get("title")) : "";
    const rawText = typeof formData.get("text") === "string" ? String(formData.get("text")) : "";
    const combinedRaw = `${rawTitle} ${rawText}`.trim();

    if (containsDisallowedMarkup(combinedRaw)) {
      return apiError("INVALID_INPUT", 400, "Shared metadata contains disallowed markup.");
    }

    let imageBase64: string | undefined;
    let mimeType: string | undefined;
    const maybeFile = formData.get("image");
    if (maybeFile && typeof maybeFile === "object" && "arrayBuffer" in maybeFile) {
      const file = maybeFile as File;
      if (file.size > MAX_UPLOAD_BYTES) {
        return apiError("PAYLOAD_TOO_LARGE", 413, "Screenshot exceeds 5 MB limit.");
      }
      if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
        return apiError("INVALID_MEDIA_TYPE", 415, "Only PNG, JPEG, or WEBP screenshots are supported.");
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString("base64");
      mimeType = file.type || "image/png";
    }

    const cleanNotes =
      sanitizePlainText(combinedRaw, 1000) ||
      "Vice City, Leonida Keys, Port Gellhorn, Trophy Share Sync";

    const result = await runProgressScreenshotSync({
      supabase,
      userId: user.id,
      profile,
      progress,
      imageBase64,
      mimeType,
      detectedText: cleanNotes,
      platform: "auto"
    });

    const target = `/?view=account&synced=1&pins=${result.syncedPinIds.length}&trophies=${result.syncedTrophyIds.length}`;
    return NextResponse.redirect(buildRedirectUrl(request, target), 303);
  } catch (err) {
    return apiError(
      "SHARE_SYNC_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to process PWA Share Target screenshot"
    );
  }
}
