import {
  apiError,
  apiJson,
  buildCommunitySubmissions,
  createClient,
  getAuthedUser,
  loadGlitchVotes,
  mapDynamicPinRow,
  mergeDynamicCheats,
  mergeDynamicGlitches,
  requireAdminUser
} from "@/lib/supabase/server";
import { CHEATS_DATA } from "@/server/data/cheats";
import { GLITCHES_DATA } from "@/server/data/glitches";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const admin = await requireAdminUser(supabase, user);
    if (!admin) return apiError("FORBIDDEN", 403, "Admin privileges required.");

    const [cheatsRes, glitchesRes, pinsRes, votesData, submissions] = await Promise.all([
      supabase
        .from("vicelink_dynamic_cheats")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("vicelink_dynamic_glitches")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase
        .from("vicelink_dynamic_map_pins")
        .select("*")
        .order("created_at", { ascending: false }),
      loadGlitchVotes(supabase, user.id),
      buildCommunitySubmissions(supabase, user.id)
    ]);

    if (cheatsRes.error) throw cheatsRes.error;
    if (glitchesRes.error) throw glitchesRes.error;
    if (pinsRes.error) throw pinsRes.error;

    const cheats = mergeDynamicCheats(CHEATS_DATA, cheatsRes.data ?? []);
    const glitches = mergeDynamicGlitches(
      GLITCHES_DATA,
      glitchesRes.data ?? [],
      votesData.voteCounts,
      votesData.userVoted
    );
    const dynamicPins = (pinsRes.data ?? []).map(mapDynamicPinRow);

    return apiJson({
      cheats,
      glitches,
      dynamicPins,
      submissions
    });
  } catch (err) {
    return apiError(
      "ADMIN_OVERVIEW_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load admin overview"
    );
  }
}
