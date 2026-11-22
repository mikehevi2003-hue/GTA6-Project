import { hasAccess } from "@/lib/security/tier";
import { getSupabaseAdmin, isAdminConfigured } from "@/lib/supabase/admin";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAiQuotaInfo,
  getAuthedUser,
  loadGlitchVotes,
  mergeDynamicCheats,
  mergeDynamicGlitches,
  mergeDynamicPins
} from "@/lib/supabase/server";
import { CHEATS_DATA } from "@/server/data/cheats";
import { HIDDEN_CONTROLS_DATA } from "@/server/data/controls";
import { GLITCHES_DATA } from "@/server/data/glitches";
import { LEONIDA_PINS } from "@/server/data/pins";
import { RADIO_STATIONS_DATA } from "@/server/data/radio";
import { CRIMINAL_PROFILE_TIERS, TROPHIES_DATA } from "@/server/data/trophies";
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

    // Read dynamic CMS rows (pins use admin client if available so locked dynamic
    // pins still render as masked stubs on Free accounts without relaxing RLS).
    const pinsClient = isAdminConfigured() ? getSupabaseAdmin() : supabase;

    const [cheatsRes, pinsRes] = await Promise.all([
      supabase
        .from("vicelink_dynamic_cheats")
        .select("*")
        .order("updated_at", { ascending: false }),
      pinsClient
        .from("vicelink_dynamic_map_pins")
        .select("*")
        .order("created_at", { ascending: false })
    ]);

    if (cheatsRes.error) throw cheatsRes.error;
    if (pinsRes.error) throw pinsRes.error;

    // 1. Cheats: free for all signed-in users, with live CMS overrides/additions.
    const cheats = mergeDynamicCheats(CHEATS_DATA, cheatsRes.data ?? []);

    // 2. Pins: merge dynamic pins on top of seed pins and mask locked pins.
    const mergedPins = mergeDynamicPins(LEONIDA_PINS, pinsRes.data ?? []);
    const pins: MapPin[] = mergedPins.map((pin: MapPin) => {
      if (hasAccess(tier, pin.tier)) {
        return { ...pin, locked: false };
      }
      const needsKingpin = pin.tier === "kingpin";
      return {
        ...pin,
        name: needsKingpin
          ? { en: "Locked Location (Kingpin VIP)", es: "Ubicación Bloqueada (Kingpin VIP)" }
          : { en: "Locked Location (Street Pass)", es: "Ubicación Bloqueada (Street Pass)" },
        note: needsKingpin
          ? {
              en: "Unlock Kingpin VIP ($4.99) to reveal intel.",
              es: "Desbloquea Kingpin VIP ($4.99) para ver detalles."
            }
          : {
              en: "Unlock Street Pass ($1.99) to reveal intel.",
              es: "Desbloquea Street Pass ($1.99) para ver detalles."
            },
        icon: "🔒",
        locked: true
      };
    });

    // 3. Glitches: completely gated behind Street Pass+, merged with live CMS status/items.
    let glitches: GlitchItem[] = [];
    if (isStreetPlus) {
      const [dynamicGlitchesRes, votesData] = await Promise.all([
        supabase
          .from("vicelink_dynamic_glitches")
          .select("*")
          .order("updated_at", { ascending: false }),
        loadGlitchVotes(supabase, user.id)
      ]);

      if (dynamicGlitchesRes.error) throw dynamicGlitchesRes.error;

      glitches = mergeDynamicGlitches(
        GLITCHES_DATA,
        dynamicGlitchesRes.data ?? [],
        votesData.voteCounts,
        votesData.userVoted
      );
    }

    // 4. Vehicles & Properties.
    const totalVehiclesCount = VEHICLES_DATA.length;
    const vehicles = isStreetPlus ? VEHICLES_DATA : VEHICLES_DATA.slice(0, 6);
    const properties = isStreetPlus ? PROPERTIES_DATA : [];

    // 5. AI Quota.
    const aiQuota = await getAiQuotaInfo(supabase, user.id, tier);

    // 6. Stages 6–8: Controls (Free), Leonida Radio (Free), Trophies & Criminal Profile (Street+).
    const totalTrophiesCount = TROPHIES_DATA.length;

    const payload: ContentPayload = {
      tier,
      cheats,
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
      aiQuota,
      controls: HIDDEN_CONTROLS_DATA,
      radioStations: RADIO_STATIONS_DATA,
      trophies: isStreetPlus ? TROPHIES_DATA : [],
      trophiesLocked: !isStreetPlus,
      totalTrophiesCount,
      criminalProfileTiers: isStreetPlus ? CRIMINAL_PROFILE_TIERS : []
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
