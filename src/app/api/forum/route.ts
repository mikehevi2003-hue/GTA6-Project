import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { REACTION_EMOJIS, THEORY_TAGS } from "@/lib/constants/forum";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  buildMergedTheoryPosts,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import { DEFAULT_THEORIES } from "@/server/data/theories";

const ALLOWED_TAGS = new Set(THEORY_TAGS.map((t: { value: string }) => t.value));

const createTheorySchema = z.object({
  title: z.string().max(200),
  tag: z.string().trim().min(1).max(60),
  coords: z.string().max(200).optional(),
  body: z.string().max(3000)
});

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const theories = await buildMergedTheoryPosts(
      supabase,
      user.id,
      DEFAULT_THEORIES,
      REACTION_EMOJIS
    );
    return apiJson({ theories });
  } catch (err) {
    return apiError(
      "FORUM_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load community board"
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`forum-post:${user.id}`, 10, 5 * 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "You are posting too quickly; please wait a few minutes.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = createTheorySchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid theory post payload.");
    }

    const { title: rawTitle, tag, coords: rawCoords, body: rawText } = parsed.data;

    if (!ALLOWED_TAGS.has(tag)) {
      return apiError("INVALID_INPUT", 400, "Unsupported theory tag.");
    }
    if (
      containsDisallowedMarkup(rawTitle) ||
      containsDisallowedMarkup(rawText) ||
      (rawCoords && containsDisallowedMarkup(rawCoords))
    ) {
      return apiError("INVALID_INPUT", 400, "Posts may not contain HTML or script markup.");
    }

    const title = sanitizePlainText(rawTitle, 140);
    const coords = rawCoords ? sanitizePlainText(rawCoords, 140) : "";
    const body = sanitizePlainText(rawText, 2000);

    if (title.length < 3 || body.length < 5) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Title (3+ chars) and evidence body (5+ chars) are required."
      );
    }

    const { profile } = await ensureProfileAndProgress(supabase, user);
    const id = `th_${crypto.randomUUID()}`;

    const { error: insertErr } = await supabase.from("vicelink_theories").insert({
      id,
      user_id: user.id,
      author_handle: profile.handle,
      title,
      tag,
      coords,
      body
    });
    if (insertErr) throw insertErr;

    const merged = await buildMergedTheoryPosts(
      supabase,
      user.id,
      DEFAULT_THEORIES,
      REACTION_EMOJIS,
      id
    );
    const theory = merged[0];
    if (!theory) {
      return apiError("FORUM_POST_FAILED", 500, "Created theory could not be reloaded.");
    }

    return apiJson({ theory }, 201);
  } catch (err) {
    return apiError(
      "FORUM_POST_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to publish theory"
    );
  }
}
