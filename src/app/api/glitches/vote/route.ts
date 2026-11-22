import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { hasAccess } from "@/lib/security/tier";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import { GLITCHES_DATA } from "@/server/data/glitches";
import type { GlitchItem } from "@/types/vicelink";

const voteSchema = z.object({
  glitchId: z.string().trim().min(1).max(64)
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const { profile } = await ensureProfileAndProgress(supabase, user);
    if (!hasAccess(profile.access_tier, "street")) {
      return apiError(
        "TIER_REQUIRED",
        403,
        "Street Pass ($1.99) is required to vote on active glitches."
      );
    }

    const rl = checkRateLimit(`glitch-vote:${user.id}`, 30, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many vote actions; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = voteSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Valid glitchId is required.");
    }

    const glitch = GLITCHES_DATA.find((g: GlitchItem) => g.id === parsed.data.glitchId);
    if (!glitch) {
      return apiError("GLITCH_NOT_FOUND", 404, "Unknown glitch id.");
    }

    const { data: existing, error: findErr } = await supabase
      .from("vicelink_glitch_votes")
      .select("glitch_id")
      .eq("glitch_id", glitch.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (findErr) throw findErr;

    let voted = false;
    if (existing) {
      const { error: delErr } = await supabase
        .from("vicelink_glitch_votes")
        .delete()
        .eq("glitch_id", glitch.id)
        .eq("user_id", user.id);
      if (delErr) throw delErr;
      voted = false;
    } else {
      const { error: insErr } = await supabase
        .from("vicelink_glitch_votes")
        .insert({ glitch_id: glitch.id, user_id: user.id });
      if (insErr) throw insErr;
      voted = true;
    }

    const { count, error: countErr } = await supabase
      .from("vicelink_glitch_votes")
      .select("*", { count: "exact", head: true })
      .eq("glitch_id", glitch.id);
    if (countErr) throw countErr;

    return apiJson({
      glitchId: glitch.id,
      votes: glitch.votes + (count ?? 0),
      voted
    });
  } catch (err) {
    return apiError(
      "GLITCH_VOTE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to toggle glitch vote"
    );
  }
}
