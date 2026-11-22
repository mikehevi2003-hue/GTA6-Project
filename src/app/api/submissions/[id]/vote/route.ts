import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { apiError, apiJson, createClient, getAuthedUser } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const parsedId = uuidSchema.safeParse(rawId);
    if (!parsedId.success) {
      return apiError("INVALID_INPUT", 400, "Invalid submission id.");
    }
    const submissionId = parsedId.data;

    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`submission-vote:${user.id}`, 60, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many vote actions; please wait a moment.");
    }

    const { data: subRow, error: subErr } = await supabase
      .from("vicelink_community_submissions")
      .select("id, status")
      .eq("id", submissionId)
      .maybeSingle();

    if (subErr) throw subErr;
    if (!subRow) {
      return apiError("SUBMISSION_NOT_FOUND", 404, "Submission not found.");
    }
    if (subRow.status === "rejected") {
      return apiError("INVALID_STATUS", 400, "Rejected submissions cannot be upvoted.");
    }

    const { data: existing, error: findErr } = await supabase
      .from("vicelink_submission_votes")
      .select("submission_id")
      .eq("submission_id", submissionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findErr) throw findErr;

    let upvoted = false;
    if (existing) {
      const { error: delErr } = await supabase
        .from("vicelink_submission_votes")
        .delete()
        .eq("submission_id", submissionId)
        .eq("user_id", user.id);
      if (delErr) throw delErr;
      upvoted = false;
    } else {
      const { error: insErr } = await supabase
        .from("vicelink_submission_votes")
        .insert({ submission_id: submissionId, user_id: user.id });
      if (insErr) throw insErr;
      upvoted = true;
    }

    const { count, error: countErr } = await supabase
      .from("vicelink_submission_votes")
      .select("*", { count: "exact", head: true })
      .eq("submission_id", submissionId);

    if (countErr) throw countErr;

    return apiJson({
      id: submissionId,
      votes: count ?? 0,
      upvoted
    });
  } catch (err) {
    return apiError(
      "SUBMISSION_VOTE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to toggle submission vote"
    );
  }
}
