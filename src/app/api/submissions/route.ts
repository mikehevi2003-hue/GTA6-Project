import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  buildCommunitySubmissions,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";

const createSubmissionSchema = z.object({
  submissionType: z.enum([
    "money_spot",
    "glitch_report",
    "easter_egg",
    "cheat_combo",
    "site_feedback"
  ]),
  regionOrCategory: z.string().max(120).optional().default(""),
  title: z.string().max(200),
  details: z.string().max(3000)
});

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const submissions = await buildCommunitySubmissions(supabase, user.id, {
      onlyPublicOrMine: true
    });
    return apiJson({ submissions });
  } catch (err) {
    return apiError(
      "SUBMISSIONS_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load community submissions"
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`submission-post:${user.id}`, 10, 5 * 60_000);
    if (!rl.allowed) {
      return apiError(
        "RATE_LIMITED",
        429,
        "You are submitting intel too quickly; please wait a few minutes."
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = createSubmissionSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid community submission payload.");
    }

    const {
      submissionType,
      regionOrCategory: rawRegion,
      title: rawTitle,
      details: rawDetails
    } = parsed.data;

    if (
      containsDisallowedMarkup(rawTitle) ||
      containsDisallowedMarkup(rawDetails) ||
      containsDisallowedMarkup(rawRegion)
    ) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Submissions may not contain HTML or script markup."
      );
    }

    const regionOrCategory = sanitizePlainText(rawRegion, 80);
    const title = sanitizePlainText(rawTitle, 140);
    const details = sanitizePlainText(rawDetails, 2000);

    if (title.length < 2 || details.length < 5) {
      return apiError(
        "INVALID_INPUT",
        400,
        "Title (2+ chars) and details (5+ chars) are required."
      );
    }

    const { profile } = await ensureProfileAndProgress(supabase, user);

    const { data: inserted, error: insertErr } = await supabase
      .from("vicelink_community_submissions")
      .insert({
        user_id: user.id,
        author_handle: profile.handle,
        submission_type: submissionType,
        region_or_category: regionOrCategory,
        title,
        details,
        status: "pending",
        admin_notes: ""
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    const loaded = await buildCommunitySubmissions(supabase, user.id, {
      onlySubmissionId: inserted.id
    });
    const submission = loaded[0];
    if (!submission) {
      return apiError("SUBMISSION_CREATE_FAILED", 500, "Submitted entry could not be reloaded.");
    }

    return apiJson({ submission }, 201);
  } catch (err) {
    return apiError(
      "SUBMISSION_CREATE_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to submit community intel"
    );
  }
}
