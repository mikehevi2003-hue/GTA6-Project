"use client";

import { useEffect, useMemo, useState } from "react";
import type { ContentPayload, Language, UserProgress } from "@/types/vicelink";
import { tField } from "@/lib/i18n/helpers";

export interface DailyBriefingCardProps {
  lang: Language;
  content: ContentPayload;
  progress: UserProgress;
  onNavigateView: (
    view: "map" | "trophies" | "controls" | "account",
    pinId?: string | null
  ) => void;
}

type StreakRecord = {
  lastDate: string;
  count: number;
};

function getTodayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getYesterdayIsoLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function DailyBriefingCard({
  lang,
  content,
  progress,
  onNavigateView
}: DailyBriefingCardProps) {
  const isEs = lang === "es";
  const [collapsed, setCollapsed] = useState(false);
  const [streakDays, setStreakDays] = useState<number>(1);

  useEffect(() => {
    try {
      const today = getTodayIsoLocal();
      const yesterday = getYesterdayIsoLocal();
      const raw = window.localStorage.getItem("vicelink_streak_v1");
      if (!raw) {
        const next: StreakRecord = { lastDate: today, count: 1 };
        window.localStorage.setItem("vicelink_streak_v1", JSON.stringify(next));
        setStreakDays(1);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<StreakRecord>;
      const prevCount = typeof parsed.count === "number" && parsed.count >= 1 ? parsed.count : 1;

      if (parsed.lastDate === today) {
        setStreakDays(prevCount);
      } else if (parsed.lastDate === yesterday) {
        const nextCount = prevCount + 1;
        window.localStorage.setItem(
          "vicelink_streak_v1",
          JSON.stringify({ lastDate: today, count: nextCount })
        );
        setStreakDays(nextCount);
      } else {
        window.localStorage.setItem(
          "vicelink_streak_v1",
          JSON.stringify({ lastDate: today, count: 1 })
        );
        setStreakDays(1);
      }
    } catch {
      setStreakDays(1);
    }
  }, []);

  const nextPin = useMemo(() => {
    const found = new Set(progress.foundPins ?? []);
    return content.pins.find((p) => !p.locked && !found.has(p.id)) ?? null;
  }, [content.pins, progress.foundPins]);

  const nextTrophy = useMemo(() => {
    const unlocked = new Set(progress.unlockedTrophies ?? []);
    return (
      content.trophies.find((t) => !unlocked.has(t.id) && (t.grade === "bronze" || t.grade === "silver")) ??
      content.trophies.find((t) => !unlocked.has(t.id)) ??
      null
    );
  }, [content.trophies, progress.unlockedTrophies]);

  const dailyControl = useMemo(() => {
    if (!content.controls || content.controls.length === 0) return null;
    return content.controls[getDayOfYear() % content.controls.length] ?? content.controls[0];
  }, [content.controls]);

  return (
    <section
      className="daily-briefing-card"
      aria-label={isEs ? "Resumen Diario de Leonida" : "Daily Leonida Briefing"}
      style={{
        background:
          "linear-gradient(135deg, rgba(15, 22, 42, 0.88), rgba(11, 16, 30, 0.92))",
        border: "1px solid rgba(0, 229, 255, 0.28)",
        borderRadius: 14,
        padding: collapsed ? "10px 14px" : "12px 14px",
        marginBottom: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            className="badge-live"
            style={{
              background: "rgba(255, 42, 133, 0.16)",
              borderColor: "rgba(255, 42, 133, 0.45)",
              color: "#ff7eb6"
            }}
          >
            🔥 {isEs ? `RACHA ${streakDays} DÍAS` : `${streakDays}-DAY STREAK`}
          </span>
          <strong style={{ fontSize: 13.5, color: "#ffffff" }}>
            {isEs ? "Resumen Táctico de Hoy en Leonida" : "Daily Leonida Briefing & Next Objectives"}
          </strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="copy-combo-btn"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
            onClick={() => onNavigateView("account")}
          >
            📸 {isEs ? "Auto-Sincronizar Captura" : "1-Tap Screenshot Sync"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ fontSize: 11.5, padding: "5px 10px" }}
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            {collapsed
              ? isEs
                ? "Mostrar ▼"
                : "Expand ▼"
              : isEs
                ? "Ocultar ▲"
                : "Hide ▲"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 10
          }}
        >
          {/* Objective 1: Next Closest Unfound Pin */}
          <div
            style={{
              background: "rgba(5, 8, 17, 0.72)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 6
            }}
          >
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent-cyan)", letterSpacing: 0.7 }}>
                📍 {isEs ? "PRÓXIMO PIN SIN DESCUBRIR" : "NEXT UNFOUND MAP PIN"}
              </span>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700, color: "#f8fafc" }}>
                {nextPin
                  ? `${nextPin.icon} ${tField(nextPin.name, lang)}`
                  : isEs
                    ? "✓ ¡Todos tus pines disponibles descubiertos!"
                    : "✓ All unlocked map pins discovered!"}
              </p>
              {nextPin && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {nextPin.region} · GPS ({nextPin.x}%, {nextPin.y}%)
                </span>
              )}
            </div>
            {nextPin && (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: 11.5, padding: "5px 10px", alignSelf: "flex-start" }}
                onClick={() => onNavigateView("map", nextPin.id)}
              >
                {isEs ? "Ir al Mapa →" : "Jump to Map →"}
              </button>
            )}
          </div>

          {/* Objective 2: Fastest Next Trophy */}
          <div
            style={{
              background: "rgba(5, 8, 17, 0.72)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 6
            }}
          >
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#facc15", letterSpacing: 0.7 }}>
                🏆 {isEs ? "SIGUIENTE TROFEO RÁPIDO" : "FASTEST NEXT TROPHY"}
              </span>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700, color: "#f8fafc" }}>
                {nextTrophy
                  ? tField(nextTrophy.title, lang)
                  : content.trophiesLocked
                    ? isEs
                      ? "Desbloquea Street Pass ($1.99) para 55 guías de Trofeos"
                      : "Unlock Street Pass ($1.99) for all 55 Trophy Roadmaps"
                    : isEs
                      ? "✓ ¡100% Trofeos de Leonida completados!"
                      : "✓ All 55 Leonida Trophies completed!"}
              </p>
              {nextTrophy && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {nextTrophy.grade}
                  {nextTrophy.missable ? (isEs ? " · PERDIBLE" : " · MISSABLE") : ""}
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11.5, padding: "5px 10px", alignSelf: "flex-start" }}
              onClick={() => onNavigateView("trophies")}
            >
              {isEs ? "Ver Trofeos →" : "View Trophies →"}
            </button>
          </div>

          {/* Objective 3: Daily Hidden Control Pro Tip */}
          <div
            style={{
              background: "rgba(5, 8, 17, 0.72)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 6
            }}
          >
            <div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent-pink)", letterSpacing: 0.7 }}>
                🕹️ {isEs ? "CONTROL PRO DEL DÍA" : "DAILY HIDDEN CONTROL TIP"}
              </span>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700, color: "#f8fafc" }}>
                {dailyControl ? tField(dailyControl.title, lang) : "Weapon Quick-Swap & Cover"}
              </p>
              {dailyControl && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  PS5: {dailyControl.ps5Keys.join(" + ")}
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: 11.5, padding: "5px 10px", alignSelf: "flex-start" }}
              onClick={() => onNavigateView("controls")}
            >
              {isEs ? "Ver 32 Controles →" : "View 32 Controls →"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
