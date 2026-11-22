import { hasAccess } from "@/lib/security/tier";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAiQuotaInfo,
  getAuthedUser
} from "@/lib/supabase/server";
import { CHEATS_DATA } from "@/server/data/cheats";
import { GLITCHES_DATA } from "@/server/data/glitches";
import { LEONIDA_PINS } from "@/server/data/pins";
import { MECHANICS_DATA, PROPERTIES_DATA, VEHICLES_DATA } from "@/server/data/vehicles";
import type { ContentPayload, GlitchItem, MapPin } from "@/types/vicelink";

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const { profile } = await ensureProfileAndProgress(supabase, user);
    const tier = profile.access_tier;
    const isStreetPlus = hasAccess(tier, "street");
    const isKingpin = hasAccess(tier, "kingpin");

    // 1. Pins: free unlocks 10 starter pins and masks the remaining 22.
    const pins: MapPin[] = LEONIDA_PINS.map((pin: MapPin) => {
      if (isStreetPlus || pin.tier === "free") {
        return { ...pin, locked: false };
      }
      return {
        ...pin,
        name: {
          en: "Locked Location (Street Pass)",
          es: "Ubicación Bloqueada (Street Pass)"
        },
        note: {
          en: "Unlock Street Pass ($1.99) to reveal intel.",
          es: "Desbloquea Street Pass ($1.99) para ver detalles."
        },
        icon: "🔒",
        locked: true
      };
    });

    // 2. Glitches: completely gated behind Street Pass+.
    let glitches: GlitchItem[] = [];
    if (isStreetPlus) {
      const { data: voteRows, error: voteErr } = await supabase
        .from("vicelink_glitch_votes")
        .select("glitch_id, user_id");
      if (voteErr) throw voteErr;

      const voteCounts = new Map<string, number>();
      const userVoted = new Set<string>();
      for (const row of voteRows ?? []) {
        voteCounts.set(row.glitch_id, (voteCounts.get(row.glitch_id) ?? 0) + 1);
        if (row.user_id === user.id) userVoted.add(row.glitch_id);
      }

      glitches = GLITCHES_DATA.map((g: GlitchItem) => ({
        ...g,
        votes: g.votes + (voteCounts.get(g.id) ?? 0),
        voted: userVoted.has(g.id)
      }));
    }

    // 3. Vehicles & Properties.
    const totalVehiclesCount = VEHICLES_DATA.length;
    const vehicles = isStreetPlus ? VEHICLES_DATA : VEHICLES_DATA.slice(0, 6);
    const properties = isStreetPlus ? PROPERTIES_DATA : [];

    // 4. AI Quota.
    const aiQuota = await getAiQuotaInfo(supabase, user.id, tier);

    const payload: ContentPayload = {
      tier,
      cheats: CHEATS_DATA,
      pins,
      glitches,
      glitchesLocked: !isStreetPlus,
      vehicles,
      vehiclesLocked: !isStreetPlus,
      totalVehiclesCount,
      properties,
      propertiesLocked: !isStreetPlus,
      socialStudioLocked: !isKingpin,
      mechanics: MECHANICS_DATA,
      aiQuota
    };

    return apiJson(payload);
  } catch (err) {
    return apiError(
      "CONTENT_LOAD_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to load tactical content"
    );
  }
}
