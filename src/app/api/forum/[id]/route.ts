import type { NextRequest } from "next/server";
import { z } from "zod";
import { ANIMATED_GIFS, REACTION_EMOJIS } from "@/lib/constants/forum";
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
import type { AnimatedGif, TheoryComment, TheoryPost } from "@/types/vicelink";

const ALLOWED_EMOJIS = new Set<string>(REACTION_EMOJIS);
const ALLOWED_GIFS = new Set<string>(ANIMATED_GIFS.map((g: AnimatedGif) => g.id));
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("vote") }),
  z.object({ action: z.literal("react"), emoji: z.string().min(1).max(16) }),
  z.object({
    action: z.literal("comment"),
    text: z.string().max(800).optional().default(""),
    gifId: z.string().max(32).optional().default("")
  }),
  z.object({
    action: z.literal("likeComment"),
    commentId: z.string().trim().regex(ID_PATTERN)
  })
]);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: theoryId } = await context.params;
    if (!theoryId || !ID_PATTERN.test(theoryId)) {
      return apiError("INVALID_INPUT", 400, "Invalid theory id.");
    }

    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`forum-act:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many community actions; please slow down.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = actionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid forum action payload.");
    }

    // Confirm the theory exists (either seeded default or user-created in DB).
    const defaultTheory = DEFAULT_THEORIES.find((t: TheoryPost) => t.id === theoryId);
    if (!defaultTheory) {
      const { data: dbTheory, error: lookupErr } = await supabase
        .from("vicelink_theories")
        .select("id")
        .eq("id", theoryId)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (!dbTheory) {
        return apiError("THEORY_NOT_FOUND", 404, "Theory post not found.");
      }
    }

    const act = parsed.data;

    if (act.action === "vote") {
      const { data: existing, error: findErr } = await supabase
        .from("vicelink_theory_votes")
        .select("theory_id")
        .eq("theory_id", theoryId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existing) {
        const { error: delErr } = await supabase
          .from("vicelink_theory_votes")
          .delete()
          .eq("theory_id", theoryId)
          .eq("user_id", user.id);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase
          .from("vicelink_theory_votes")
          .insert({ theory_id: theoryId, user_id: user.id });
        if (insErr) throw insErr;
      }
    } else if (act.action === "react") {
      if (!ALLOWED_EMOJIS.has(act.emoji)) {
        return apiError("INVALID_INPUT", 400, "Unsupported reaction emoji.");
      }

      const { data: existing, error: findErr } = await supabase
        .from("vicelink_theory_reactions")
        .select("emoji")
        .eq("theory_id", theoryId)
        .eq("user_id", user.id)
        .eq("emoji", act.emoji)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existing) {
        const { error: delErr } = await supabase
          .from("vicelink_theory_reactions")
          .delete()
          .eq("theory_id", theoryId)
          .eq("user_id", user.id)
          .eq("emoji", act.emoji);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase
          .from("vicelink_theory_reactions")
          .insert({ theory_id: theoryId, user_id: user.id, emoji: act.emoji });
        if (insErr) throw insErr;
      }
    } else if (act.action === "comment") {
      if (containsDisallowedMarkup(act.text)) {
        return apiError("INVALID_INPUT", 400, "Comments may not contain HTML or script markup.");
      }
      const cleanText = sanitizePlainText(act.text, 500);
      const gifId = act.gifId.trim();
      if (gifId && !ALLOWED_GIFS.has(gifId)) {
        return apiError("INVALID_INPUT", 400, "Unsupported GIF sticker.");
      }
      if (!cleanText && !gifId) {
        return apiError("EMPTY_COMMENT", 400, "Comment text or a GIF sticker is required.");
      }

      const { profile } = await ensureProfileAndProgress(supabase, user);
      const { error: insErr } = await supabase.from("vicelink_comments").insert({
        theory_id: theoryId,
        user_id: user.id,
        author_handle: profile.handle,
        body: cleanText,
        gif_id: gifId
      });
      if (insErr) throw insErr;
    } else if (act.action === "likeComment") {
      const isSeedComment = Boolean(
        defaultTheory?.comments.some((c: TheoryComment) => c.id === act.commentId)
      );
      if (!isSeedComment) {
        const { data: dbComment, error: commentErr } = await supabase
          .from("vicelink_comments")
          .select("id")
          .eq("id", act.commentId)
          .eq("theory_id", theoryId)
          .maybeSingle();
        if (commentErr) throw commentErr;
        if (!dbComment) {
          return apiError("COMMENT_NOT_FOUND", 404, "Comment not found on this theory.");
        }
      }

      const { data: existing, error: findErr } = await supabase
        .from("vicelink_comment_likes")
        .select("comment_id")
        .eq("comment_id", act.commentId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (findErr) throw findErr;

      if (existing) {
        const { error: delErr } = await supabase
          .from("vicelink_comment_likes")
          .delete()
          .eq("comment_id", act.commentId)
          .eq("user_id", user.id);
        if (delErr) throw delErr;
      } else {
        const { error: insErr } = await supabase
          .from("vicelink_comment_likes")
          .insert({ comment_id: act.commentId, user_id: user.id });
        if (insErr) throw insErr;
      }
    }

    const updated = await buildMergedTheoryPosts(
      supabase,
      user.id,
      DEFAULT_THEORIES,
      REACTION_EMOJIS,
      theoryId
    );
    const theory = updated[0];
    if (!theory) {
      return apiError("THEORY_NOT_FOUND", 404, "Theory post not found.");
    }

    return apiJson({ theory });
  } catch (err) {
    return apiError(
      "FORUM_ACTION_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to update theory"
    );
  }
}
