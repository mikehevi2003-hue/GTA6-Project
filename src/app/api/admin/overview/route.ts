import {
  apiError,
  apiJson,
  buildCommunitySubmissions,
  createClient,
  getAuthenticatorAssuranceLevel,
  getAuthedUser,
  loadAdminAuditLogs,
  loadAdminTelemetry,
  loadAdminUsersV2,
  loadEmailCampaigns,
  loadGlitchVotes,
  loadPromoCodes,
  loadSiteSettings,
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

    const [
      telemetry,
      siteSettings,
      auditLogs,
      callerAal,
      cheatsRes,
      glitchesRes,
      pinsRes,
      votesData,
      submissions,
      users,
      promoCodes,
      emailCampaigns
    ] = await Promise.all([
      loadAdminTelemetry(supabase),
      loadSiteSettings(supabase),
      loadAdminAuditLogs(supabase, 50),
      getAuthenticatorAssuranceLevel(supabase),
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
      buildCommunitySubmissions(supabase, user.id),
      loadAdminUsersV2(supabase, ""),
      loadPromoCodes(supabase),
      loadEmailCampaigns(supabase, 30)
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
      telemetry,
      siteSettings,
      auditLogs,
      callerAal,
      cheats,
      glitches,
      dynamicPins,
      submissions,
      users,
      promoCodes,
      emailCampaigns
    });
  } catch (err) {
    return apiError(
      "ADMIN_OVERVIEW_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load admin overview"
    );
  }
}
