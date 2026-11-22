"use client";

import { useEffect, useRef, useState } from "react";
import type { Language, UserTier } from "@/types/vicelink";

export interface SocialStudioModalProps {
  open: boolean;
  lang: Language;
  socialStudioLocked: boolean;
  userHandle: string;
  userTier: UserTier;
  foundPinsCount: number;
  totalPinsCount: number;
  plannedWorthUsd: number;
  unlockedCheatsCount: number;
  totalCheatsCount: number;
  onClose: () => void;
  onOpenPricing: () => void;
}

export default function SocialStudioModal({
  open,
  lang,
  socialStudioLocked,
  userHandle,
  userTier,
  foundPinsCount,
  totalPinsCount,
  plannedWorthUsd,
  unlockedCheatsCount,
  totalCheatsCount,
  onClose,
  onOpenPricing
}: SocialStudioModalProps) {
  const isEs = lang === "es";
  const [styleMode, setStyleMode] = useState<"tiktok" | "instagram">("tiktok");
  const [copiedBio, setCopiedBio] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || socialStudioLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isIG = styleMode === "instagram";
    const grad = ctx.createLinearGradient(0, 0, 540, 960);
    if (isIG) {
      grad.addColorStop(0, "#190b28");
      grad.addColorStop(0.5, "#2b123b");
      grad.addColorStop(1, "#0a0d18");
    } else {
      grad.addColorStop(0, "#090d1a");
      grad.addColorStop(0.5, "#151c36");
      grad.addColorStop(1, "#070a12");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 540, 960);

    ctx.strokeStyle = isIG ? "#ff2a85" : "#00e5ff";
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 492, 912);

    ctx.fillStyle = isIG ? "#ff7ab3" : "#00e5ff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      isIG ? "INSTAGRAM STORY // LEONIDA INTEL" : "TIKTOK // LEONIDA TACTICAL HUB",
      54,
      82
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 48px sans-serif";
    ctx.fillText("VICELINK", 54, 136);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(`PLAYER: ${userHandle} (${userTier.toUpperCase()})`, 54, 172);

    const pct = totalPinsCount > 0 ? Math.round((foundPinsCount / totalPinsCount) * 100) : 0;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(54, 220, 432, 160);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      isEs ? "PROGRESO 100% MAPA LEONIDA" : "100% STORY & MAP DISCOVERY",
      78,
      262
    );
    ctx.fillStyle = "#00e5ff";
    ctx.font = "900 64px sans-serif";
    ctx.fillText(`${pct}%`, 78, 336);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 18px sans-serif";
    ctx.fillText(
      `${foundPinsCount} / ${totalPinsCount} ${isEs ? "Pines" : "Pins Found"}`,
      235,
      326
    );

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(54, 410, 432, 150);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      isEs ? "VALOR DEL IMPERIO EN LEONIDA" : "PLANNED LEONIDA EMPIRE VALUE",
      78,
      452
    );
    ctx.fillStyle = "#4ade80";
    ctx.font = "900 44px sans-serif";
    ctx.fillText(`$${plannedWorthUsd.toLocaleString()}`, 78, 518);

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(54, 590, 432, 130);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      isEs ? "DESAFÍOS DE TRUCOS COMPLETADOS" : "CHEAT CHALLENGES COMPLETED",
      78,
      632
    );
    ctx.fillStyle = "#ff2a85";
    ctx.font = "900 44px sans-serif";
    ctx.fillText(`${unlockedCheatsCount} / ${totalCheatsCount}`, 78, 692);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 19px sans-serif";
    ctx.fillText(
      isIG
        ? isEs
          ? "Toca el Sticker de Enlace para Mapa y ATMs:"
          : "Tap Link Sticker for Map & ATMs:"
        : isEs
          ? "Enlace en Bio para Mapa, ATMs y Fences:"
          : "Link in Bio for Map, ATMs & Fences:",
      54,
      830
    );
    ctx.fillStyle = isIG ? "#ff2a85" : "#00e5ff";
    ctx.font = "900 26px sans-serif";
    ctx.fillText("vicelink.vercel.app", 54, 870);
  }, [
    open,
    socialStudioLocked,
    styleMode,
    lang,
    isEs,
    userHandle,
    userTier,
    foundPinsCount,
    totalPinsCount,
    plannedWorthUsd,
    unlockedCheatsCount,
    totalCheatsCount
  ]);

  if (!open) return null;

  const bioText = isEs
    ? "🎮 Mapa Interactivo de GTA VI, Cajeros ATM, Autos Raros y Fences (EN/ES) 👇\n🔗 vicelink.vercel.app"
    : "🎮 GTA VI Interactive Map, Hackable ATMs, Rare Cars & Fences (EN/ES) 👇\n🔗 vicelink.vercel.app";

  const captionText = isEs
    ? "¡Todos los cajeros ATM hackeables, el Eclipse gratis de Paul Walker y los fences secretos de GTA 6 en UN solo mapa! Usa vicelink.vercel.app #GTA6 #GTAVI #ViceCity #Leonida #Gaming"
    : "All hackable ATMs, free Paul Walker Eclipse & secret fences in GTA 6 on ONE map! Use vicelink.vercel.app #GTA6 #GTAVI #ViceCity #Leonida #GamingTips";

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `ViceLink-GTA6-${styleMode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = async (text: string, which: "bio" | "caption") => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === "bio") {
        setCopiedBio(true);
        window.setTimeout(() => setCopiedBio(false), 2000);
      } else {
        setCopiedCaption(true);
        window.setTimeout(() => setCopiedCaption(false), 2000);
      }
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={isEs ? "Estudio TikTok e Instagram" : "TikTok & Instagram Studio"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content modal-wide" style={{ maxWidth: 760 }}>
        <div className="modal-top-bar">
          <span className="brand-badge">
            {isEs ? "ESTUDIO TIKTOK E INSTAGRAM 9:16" : "TIKTOK & INSTAGRAM 9:16 STUDIO"}
          </span>
          <button type="button" className="modal-close-pill" onClick={onClose}>
            ✕ {isEs ? "Cerrar" : "Close"}
          </button>
        </div>

        {socialStudioLocked ? (
          <div className="paywall-box" style={{ margin: "12px auto" }}>
            <span className="brand-badge" style={{ color: "#facc15", borderColor: "rgba(250, 204, 21, 0.4)" }}>
              👑 KINGPIN VIP ($4.99 {isEs ? "PAGO ÚNICO" : "ONE-TIME"})
            </span>
            <h3>
              📱{" "}
              {isEs
                ? "Desbloquea el Estudio de Tarjetas 9:16 para TikTok e Instagram"
                : "Unlock the 9:16 TikTok & Instagram Social Studio"}
            </h3>
            <p>
              {isEs
                ? "Exporta tarjetas 9:16 HD con tu progreso en Leonida, valor de imperio y desafíos completados, además de Asesor IA ilimitado e insignia dorada Kingpin."
                : "Export HD 9:16 progress flex cards with your Leonida completion, empire net worth, and cheat milestones—plus Unlimited AI Advisor & Gold Kingpin badge."}
            </p>
            <button
              type="button"
              className="btn-pro"
              style={{ maxWidth: 300, margin: "0 auto", background: "linear-gradient(90deg,#f59e0b,#ea580c)" }}
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
            >
              {isEs ? "Desbloquear Kingpin VIP — $4.99" : "Unlock Kingpin VIP — $4.99"}
            </button>
          </div>
        ) : (
          <>
            <h3>
              {isEs
                ? "Generador de Tarjetas Sociales y Bio Viral"
                : "Social Flex Card & Viral Bio Generator"}
            </h3>
            <p className="modal-sub">
              {isEs
                ? "Previsualiza tu tarjeta 9:16, descarga el PNG o copia textos listos para publicar (ESC o clic afuera para cerrar)."
                : "Preview your 9:16 progress card, download the PNG, or copy ready-to-post hooks (Press ESC or click outside to close)."}
            </p>

            <div className="social-studio-grid">
              <div className="social-preview-col">
                <div className="platform-toggle" style={{ justifyContent: "center", marginBottom: 10 }}>
                  <button
                    type="button"
                    className={`social-style-btn ${styleMode === "tiktok" ? "active" : ""}`}
                    onClick={() => setStyleMode("tiktok")}
                  >
                    🎵 TikTok 9:16
                  </button>
                  <button
                    type="button"
                    className={`social-style-btn ${styleMode === "instagram" ? "active" : ""}`}
                    onClick={() => setStyleMode("instagram")}
                  >
                    📸 {isEs ? "Historia IG" : "IG Story"}
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={540}
                  height={960}
                  className="social-canvas-preview"
                />

                <button
                  type="button"
                  className="btn-pro"
                  style={{ marginTop: 10 }}
                  onClick={handleDownload}
                >
                  ⬇️ {isEs ? "Descargar PNG 9:16" : "Download 9:16 PNG"}
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="unlock-card-step">
                  <strong>
                    🔗{" "}
                    {isEs
                      ? "Bio Lista para TikTok e Instagram:"
                      : "Ready-to-Paste TikTok & Instagram Bio:"}
                  </strong>
                  <p style={{ margin: "6px 0", color: "#38bdf8", fontSize: 12.5, whiteSpace: "pre-line" }}>
                    {bioText}
                  </p>
                  <button
                    type="button"
                    className="copy-combo-btn"
                    onClick={() => void handleCopy(bioText, "bio")}
                  >
                    {copiedBio
                      ? isEs
                        ? "✓ ¡Bio Copiada!"
                        : "✓ Bio Copied!"
                      : isEs
                        ? "📋 Copiar Bio para TikTok / IG"
                        : "📋 Copy Bio for TikTok / IG"}
                  </button>
                </div>

                <div className="unlock-card-step">
                  <strong>
                    🔥{" "}
                    {isEs
                      ? "Descripción Viral para TikTok / Reels:"
                      : "Viral TikTok / IG Reels Hook Caption:"}
                  </strong>
                  <p style={{ margin: "6px 0", color: "#cbd5e1", fontSize: 12.5 }}>
                    {captionText}
                  </p>
                  <button
                    type="button"
                    className="copy-combo-btn"
                    onClick={() => void handleCopy(captionText, "caption")}
                  >
                    {copiedCaption
                      ? isEs
                        ? "✓ ¡Descripción Copiada!"
                        : "✓ Caption Copied!"
                      : isEs
                        ? "📋 Copiar Descripción Reels / TikTok"
                        : "📋 Copy Reels / TikTok Caption"}
                  </button>
                </div>

                <div className="unlock-card-step">
                  <strong>
                    💡{" "}
                    {isEs
                      ? "Consejo de Crecimiento en Instagram Stories:"
                      : "Instagram Story Growth Tip:"}
                  </strong>
                  <p style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                    {isEs
                      ? 'Publica la tarjeta 9:16 en tu Historia de Instagram, agrega un Sticker de Enlace apuntando a tu app y guárdala en una Historia Destacada llamada "Mapa GTA 6".'
                      : 'Post the downloaded 9:16 card to your Instagram Story, add an Instagram Link Sticker pointing to your live URL, and save it to a Highlight titled "GTA 6 Map & Cheats".'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
