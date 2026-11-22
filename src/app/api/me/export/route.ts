import { NextResponse } from "next/server";
import {
  apiError,
  buildMePayload,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";

/**
 * Panama Law 81 (Ley 81 de 2019) personal data portability export.
 * Returns a downloadable JSON archive containing all user-owned ViceLink records.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const ensured = await ensureProfileAndProgress(supabase, user);
    const me = await buildMePayload(supabase, user, ensured);

    const [aiUsageRes, glitchVotesRes, theoriesRes, commentsRes, theoryVotesRes, reactionsRes, likesRes] =
      await Promise.all([
        supabase
          .from("vicelink_ai_usage")
          .select("usage_date, count")
          .eq("user_id", user.id)
          .order("usage_date", { ascending: false }),
        supabase
          .from("vicelink_glitch_votes")
          .select("glitch_id, created_at")
          .eq("user_id", user.id),
        supabase
          .from("vicelink_theories")
          .select("id, author_handle, title, tag, coords, body, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("vicelink_comments")
          .select("id, theory_id, author_handle, body, gif_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("vicelink_theory_votes").select("theory_id").eq("user_id", user.id),
        supabase
          .from("vicelink_theory_reactions")
          .select("theory_id, emoji")
          .eq("user_id", user.id),
        supabase.from("vicelink_comment_likes").select("comment_id").eq("user_id", user.id)
      ]);

    const errors = [
      aiUsageRes.error,
      glitchVotesRes.error,
      theoriesRes.error,
      commentsRes.error,
      theoryVotesRes.error,
      reactionsRes.error,
      likesRes.error
    ].filter(Boolean);
    if (errors.length > 0) throw errors[0];

    const exportPayload = {
      schema: "vicelink-law81-export/v1",
      exportedAt: new Date().toISOString(),
      legalNotice:
        "Personal data portability export issued under Panama Law 81 of 2019 (Protección de Datos Personales).",
      account: {
        ...me.profile,
        updatedAt: ensured.profile.updated_at
      },
      progress: {
        ...me.progress,
        updatedAt: ensured.progress.updated_at
      },
      payments: me.payments,
      aiUsage: aiUsageRes.data ?? [],
      communityActivity: {
        authoredTheories: theoriesRes.data ?? [],
        authoredComments: commentsRes.data ?? [],
        glitchVotes: glitchVotesRes.data ?? [],
        theoryVotes: theoryVotesRes.data ?? [],
        theoryReactions: reactionsRes.data ?? [],
        commentLikes: likesRes.data ?? []
      }
    };

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vicelink-law81-export.json"',
        "Cache-Control": "private, no-store"
      }
    });
  } catch (err) {
    return apiError(
      "EXPORT_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to generate data export"
    );
  }
}
