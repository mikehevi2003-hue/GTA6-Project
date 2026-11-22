import { ImageResponse } from "next/og";

export const runtime = "edge";

const VIEW_META: Record<string, { badge: string; title: string; subtitle: string }> = {
  map: {
    badge: "LEONIDA TACTICAL MAP",
    title: "Interactive Money Spots, ATMs & Rare Cars",
    subtitle: "32+ verified Leonida coordinates, Fence buyers, and $250K+/hr first-hour speedrun route."
  },
  cheats: {
    badge: "CHEATS & D-PAD UNLOCKS",
    title: "19 Verified Leonida Cheats & Combos",
    subtitle: "Interactive PS5 & Xbox D-Pad sequences, unlock triggers, and favorites sync."
  },
  glitches: {
    badge: "GLITCHES & EXPLOITS",
    title: "Patch 01.002.001 Live Glitch Tracker",
    subtitle: "Community-voted money loops, camera bypasses, and real-time patch status."
  },
  forum: {
    badge: "EASTER EGGS & THEORIES",
    title: "Leonida Lore & Mystery Intelligence",
    subtitle: "Verified player discoveries, GPS sightings, and deep-lore debates."
  },
  database: {
    badge: "VEHICLES & ECONOMY",
    title: "Leonida Garage & Property Planner",
    subtitle: "Calculate empire net worth, top-speed tiers, and free rare car spawns."
  },
  trophies: {
    badge: "PLATINUM & TROPHIES",
    title: "55-Trophy 100% Completion Tracker",
    subtitle: "Cloud-synced checklist for every hidden story, heist, and collectible trophy."
  },
  ai: {
    badge: "AI MISSION ADVISOR",
    title: "Live Leonida Tactical AI Co-Pilot",
    subtitle: "Instant bilingual mission strats, heist loadouts, and cash route coaching."
  }
};

function cleanParam(value: string | null, maxLen: number): string {
  if (!value) return "";
  return value.replace(/[<>]/g, "").trim().slice(0, maxLen);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawView = cleanParam(searchParams.get("view"), 24).toLowerCase();
  const pin = cleanParam(searchParams.get("pin"), 32);
  const customTitle = cleanParam(searchParams.get("title"), 88);

  const effectiveView = pin ? "map" : rawView || "hub";
  const preset = VIEW_META[effectiveView] ?? {
    badge: "LEONIDA COMPANION HUB",
    title: "ViceLink // Tactical Intel, Map & Glitches",
    subtitle: "Private member hub for Leonida cheat codes, interactive map, economy planner, and AI advisor."
  };

  const heading = customTitle
    ? customTitle
    : pin
      ? `Shared Tactical Pin: ${pin.toUpperCase()}`
      : preset.title;

  const subtitle = pin
    ? `Direct coordinate deep-link (/?view=map&pin=${pin}) — inspect GPS details, mark found, and sync cloud progress.`
    : preset.subtitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: "linear-gradient(135deg, #05070e 0%, #0b1326 52%, #1d0928 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          position: "relative"
        }}
      >
        {/* Top Row: Brand & Dynamic Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "54px",
                height: "54px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #00e5ff, #ff2a85)",
                color: "#05070e",
                fontSize: "24px",
                fontWeight: 900
              }}
            >
              VL
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  color: "#ffffff"
                }}
              >
                VICELINK
              </span>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "3px",
                  color: "#00e5ff"
                }}
              >
                VICELINK.APP // STAGE 15
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 20px",
              borderRadius: "999px",
              background: "rgba(255, 42, 133, 0.16)",
              border: "2px solid rgba(255, 42, 133, 0.65)",
              color: "#fda4af",
              fontSize: "16px",
              fontWeight: 800,
              letterSpacing: "1.5px"
            }}
          >
            <span>{preset.badge}</span>
          </div>
        </div>

        {/* Center Neo-Glass Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            padding: "40px 44px",
            borderRadius: "28px",
            background: "rgba(9, 15, 30, 0.84)",
            border: "2px solid rgba(0, 229, 255, 0.42)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                display: "flex",
                padding: "6px 14px",
                borderRadius: "999px",
                background: "rgba(0, 229, 255, 0.14)",
                border: "1px solid rgba(0, 229, 255, 0.55)",
                color: "#00e5ff",
                fontSize: "15px",
                fontWeight: 800
              }}
            >
              {pin ? `GPS PIN // ${pin.toUpperCase()}` : `VIEW // ${effectiveView.toUpperCase()}`}
            </div>
            <div
              style={{
                display: "flex",
                padding: "6px 14px",
                borderRadius: "999px",
                background: "rgba(255, 42, 133, 0.16)",
                border: "1px solid rgba(255, 42, 133, 0.55)",
                color: "#ff7ab6",
                fontSize: "15px",
                fontWeight: 800
              }}
            >
              EN • ES BILINGUAL HUB
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "52px",
              fontWeight: 900,
              lineHeight: 1.1,
              color: "#ffffff",
              letterSpacing: "-0.5px"
            }}
          >
            {heading}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "24px",
              lineHeight: 1.4,
              color: "#cbd5e1"
            }}
          >
            {subtitle}
          </div>
        </div>

        {/* Footer Telemetry Strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            fontSize: "18px",
            color: "#94a3b8"
          }}
        >
          <div style={{ display: "flex", gap: "28px" }}>
            <span style={{ color: "#00e5ff", fontWeight: 800 }}>● 32+ TACTICAL PINS</span>
            <span style={{ color: "#ff2a85", fontWeight: 800 }}>● 19 D-PAD CHEATS</span>
            <span style={{ color: "#4ade80", fontWeight: 800 }}>● ZERO-TRUST AAL2</span>
          </div>
          <div style={{ display: "flex", fontWeight: 800, color: "#e2e8f0" }}>
            GTA VI LEONIDA INTEL
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630
    }
  );
}
