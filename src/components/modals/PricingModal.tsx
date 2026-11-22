"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Language, UserTier, YappyCheckoutResponse } from "@/types/vicelink";
import { hasAccess } from "@/lib/security/tier";
import { t } from "@/lib/i18n/translations";

export interface PricingModalProps {
  open: boolean;
  lang: Language;
  currentTier: UserTier;
  cheatsCount: number;
  pinsCount: number;
  vehiclesCount: number;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
}

type PaidTier = "street" | "kingpin";

export default function PricingModal({
  open,
  lang,
  currentTier,
  cheatsCount,
  pinsCount,
  vehiclesCount,
  onClose,
  onRefreshData
}: PricingModalProps) {
  const isEs = lang === "es";
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [yappyOrder, setYappyOrder] = useState<(YappyCheckoutResponse & { tier: PaidTier }) | null>(
    null
  );
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setNotice(null);
      setYappyOrder(null);
      setLoadingKey(null);
    }
  }, [open]);

  if (!open) return null;

  const startYappyCheckout = async (targetTier: PaidTier) => {
    setNotice(null);
    setYappyOrder(null);
    setLoadingKey(`yappy-${targetTier}`);
    try {
      const res = await fetch("/api/checkout/yappy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTier })
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 503) {
        setNotice({
          kind: "info",
          text: isEs
            ? "Yappy Comercial V2 (Banco General) está en espera de credenciales de comercio (YAPPY_MERCHANT_ID / YAPPY_SECRET_KEY). Puedes usar Tarjeta o revisar SETUP.md."
            : "Banco General Yappy Comercial V2 is awaiting merchant activation keys (YAPPY_MERCHANT_ID / YAPPY_SECRET_KEY). Try Card checkout or see SETUP.md."
        });
        return;
      }

      if (res.status === 409) {
        await onRefreshData();
        setNotice({
          kind: "info",
          text: isEs
            ? "Tu cuenta ya posee este pase o uno superior."
            : "Your account already owns this pass or a higher tier."
        });
        return;
      }

      if (!res.ok) {
        setNotice({
          kind: "error",
          text:
            data?.message ||
            (isEs
              ? "No se pudo iniciar la orden de Yappy. Intenta de nuevo."
              : "Could not initialize Yappy order. Please try again.")
        });
        return;
      }

      setYappyOrder({ ...(data as YappyCheckoutResponse), tier: targetTier });
    } catch {
      setNotice({
        kind: "error",
        text: isEs
          ? "Error de red al conectar con la pasarela Yappy."
          : "Network error while contacting the Yappy checkout endpoint."
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const startCardCheckout = async (targetTier: PaidTier) => {
    setNotice(null);
    setYappyOrder(null);
    setLoadingKey(`card-${targetTier}`);
    try {
      const res = await fetch("/api/checkout/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTier })
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 503) {
        setNotice({
          kind: "info",
          text: isEs
            ? "La pasarela de Tarjeta (Visa/MC/Stripe) aún no está configurada en este entorno (falta STRIPE_SECRET_KEY). Revisa SETUP.md."
            : "Card Checkout (Visa/MC/Stripe) is not configured yet in this environment (STRIPE_SECRET_KEY missing). See SETUP.md."
        });
        return;
      }

      if (res.status === 409) {
        await onRefreshData();
        setNotice({
          kind: "info",
          text: isEs
            ? "Tu cuenta ya posee este pase o uno superior."
            : "Your account already owns this pass or a higher tier."
        });
        return;
      }

      if (!res.ok || !data?.url) {
        setNotice({
          kind: "error",
          text:
            data?.message ||
            (isEs
              ? "No se pudo abrir la sesión de pago con tarjeta."
              : "Could not create card checkout session.")
        });
        return;
      }

      window.location.assign(String(data.url));
    } catch {
      setNotice({
        kind: "error",
        text: isEs
          ? "Error de red al iniciar el pago con tarjeta."
          : "Network error while initiating card checkout."
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const handleCheckYappyStatus = async () => {
    setCheckingStatus(true);
    try {
      await onRefreshData();
      setNotice({
        kind: "info",
        text: isEs
          ? "Estado de cuenta sincronizado con el servidor."
          : "Account entitlement refreshed from server."
      });
    } finally {
      setCheckingStatus(false);
    }
  };

  const hasStreet = hasAccess(currentTier, "street");
  const hasKingpin = hasAccess(currentTier, "kingpin");

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={isEs ? "Pases de Acceso ViceLink" : "ViceLink Access Passes"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content modal-wide">
        <div className="modal-top-bar">
          <span className="brand-badge">
            {isEs
              ? "PASES VITALICIOS DE PAGO ÚNICO • SIN SUSCRIPCIONES"
              : "LIFETIME ONE-TIME PASSES • NO SUBSCRIPTIONS"}
          </span>
          <button type="button" className="modal-close-pill" onClick={onClose}>
            ✕ {isEs ? "Cerrar" : "Close"}
          </button>
        </div>

        <h3>
          {t(
            lang,
            "modalTitle",
            isEs ? "Elige tu Pase de Acceso Único ViceLink" : "Choose Your ViceLink Access Tier"
          )}
        </h3>
        <p className="modal-sub">
          {t(
            lang,
            "modalSub",
            isEs
              ? "Paga una vez, úsalo para siempre. Compatible con Yappy (Panamá) y Tarjetas Internacionales (Visa/MC)."
              : "Pay once, keep forever. Dual payment rails: Yappy (Panama) & International Cards (Visa/MC/Stripe)."
          )}
        </p>

        {notice && (
          <div
            className={`auth-alert ${notice.kind === "error" ? "auth-alert-error" : "auth-alert-success"}`}
            style={{ marginBottom: 14 }}
            role="status"
          >
            {notice.kind === "error" ? "⚠️ " : "ℹ️ "}
            {notice.text}
          </div>
        )}

        {yappyOrder && (
          <div className="unlock-card-step" style={{ marginBottom: 16, borderColor: "var(--accent-cyan)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--accent-cyan)" }}>
                🇵🇦 {isEs ? "Orden Yappy Comercial Generada" : "Yappy Comercial Order Ready"}
              </strong>
              <span className="price-pill">${yappyOrder.amountUsd.toFixed(2)} USD</span>
            </div>
            <p style={{ marginTop: 8, fontSize: 12.5, color: "#cbd5e1", lineHeight: 1.5 }}>
              {isEs
                ? `Orden ${yappyOrder.orderId} (Transacción ${yappyOrder.transactionId}). Aprueba el cobro en tu app Yappy de Banco General usando el componente <btn-yappy> y el token de sesión emitido.`
                : `Order ${yappyOrder.orderId} (Transaction ${yappyOrder.transactionId}). Approve this payment in your Banco General Yappy app via the <btn-yappy> checkout component using the issued session token.`}
            </p>
            <div className="code-box" style={{ marginTop: 8, fontSize: 11.5, wordBreak: "break-all" }}>
              orderId: {yappyOrder.orderId} • txId: {yappyOrder.transactionId} • doc: {yappyOrder.documentName}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-yappy"
                disabled={checkingStatus}
                onClick={handleCheckYappyStatus}
                style={{ width: "auto", padding: "8px 14px" }}
              >
                {checkingStatus
                  ? isEs
                    ? "Verificando..."
                    : "Checking..."
                  : isEs
                    ? "↻ Verificar Estado del Pago"
                    : "↻ Check Payment Status"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setYappyOrder(null)}
              >
                {isEs ? "Ocultar Orden" : "Dismiss"}
              </button>
            </div>
          </div>
        )}

        <div className="pricing-grid">
          {/* FREE RECRUIT */}
          <div className="price-tier-card">
            <div>
              <span className="tier-name">{isEs ? "RECLUTA GRATIS" : "FREE RECRUIT"}</span>
              <div className="tier-price">
                $0 <span>{isEs ? "para siempre" : "forever"}</span>
              </div>
              <ul>
                <li>
                  ✓{" "}
                  {isEs
                    ? `Los ${cheatsCount} Trucos y Guía de Desbloqueo`
                    : `All ${cheatsCount} Cheat Codes & Unlock Guide`}
                </li>
                <li>
                  ✓{" "}
                  {isEs
                    ? "Foro de Easter Eggs y Comentarios"
                    : "Easter Eggs & Community Comment Board"}
                </li>
                <li>
                  ✓{" "}
                  {isEs
                    ? "Mapa Inicial de Leonida (10 Pines)"
                    : "Starter Leonida Map (10 Pins)"}
                </li>
                <li>
                  ✓{" "}
                  {isEs
                    ? "6 Vehículos Iniciales y 3 Consultas IA / Día"
                    : "6 Starter Vehicles & 3 AI Questions / Day"}
                </li>
              </ul>
            </div>

            <button type="button" className="btn-secondary full-width" disabled>
              {currentTier === "free"
                ? isEs
                  ? "✓ Plan Activo"
                  : "✓ Current Plan"
                : isEs
                  ? "✓ Incluido"
                  : "✓ Included"}
            </button>
          </div>

          {/* STREET PASS */}
          <div className="price-tier-card featured-street">
            <div>
              <span className="tier-name text-cyan">STREET PASS</span>
              <div className="tier-price">
                $1.99 <span>{isEs ? "pago único" : "one-time"}</span>
              </div>
              <ul>
                <li>
                  ✓ <strong>{isEs ? "100% Sin Anuncios" : "100% Ad-Free"}</strong>{" "}
                  {isEs ? "en todo el hub" : "Experience"}
                </li>
                <li>
                  ✓{" "}
                  <strong>
                    {isEs ? `Mapa Completo (${pinsCount} Pines)` : `Full ${pinsCount}-Pin Map`}
                  </strong>{" "}
                  {isEs ? "(Dinero, ATMs, Autos y Fences)" : "(Money, ATMs, Rare Cars & Fences)"}
                </li>
                <li>
                  ✓ <strong>{isEs ? "Hub de Glitches y Exploits" : "Active Glitches & Exploits Hub"}</strong>
                </li>
                <li>
                  ✓{" "}
                  {isEs
                    ? `Los ${vehiclesCount} Vehículos + 5 Propiedades y Planificador ROI`
                    : `All ${vehiclesCount} Vehicles + 5 Properties & Empire ROI Planner`}
                </li>
              </ul>
            </div>

            {hasStreet ? (
              <button type="button" className="btn-secondary full-width" disabled>
                {currentTier === "street"
                  ? isEs
                    ? "✓ Plan Activo"
                    : "✓ Active Tier"
                  : isEs
                    ? "✓ Incluido en Kingpin"
                    : "✓ Included in Kingpin"}
              </button>
            ) : (
              <div className="rail-selector">
                <button
                  type="button"
                  className="btn-yappy"
                  disabled={loadingKey !== null}
                  onClick={() => startYappyCheckout("street")}
                >
                  {loadingKey === "yappy-street"
                    ? isEs
                      ? "Conectando Yappy..."
                      : "Starting Yappy..."
                    : isEs
                      ? "🇵🇦 Pagar con Yappy — $1.99"
                      : "🇵🇦 Pay with Yappy — $1.99"}
                </button>
                <button
                  type="button"
                  className="btn-card-pay"
                  disabled={loadingKey !== null}
                  onClick={() => startCardCheckout("street")}
                >
                  {loadingKey === "card-street"
                    ? isEs
                      ? "Abriendo Stripe..."
                      : "Opening Checkout..."
                    : isEs
                      ? "💳 Pagar con Tarjeta — $1.99"
                      : "💳 Pay with Card — $1.99"}
                </button>
              </div>
            )}
          </div>

          {/* KINGPIN VIP */}
          <div className="price-tier-card featured-kingpin">
            <div>
              <span className="tier-name" style={{ color: "#facc15" }}>
                👑 KINGPIN VIP
              </span>
              <div className="tier-price">
                $4.99 <span>{isEs ? "pago único" : "one-time"}</span>
              </div>
              <ul>
                <li>
                  ✓ {isEs ? "Todo lo incluido en" : "Everything in"}{" "}
                  <strong>Street Pass</strong>
                </li>
                <li>
                  ✓ <strong>{isEs ? "Asesor IA Ilimitado" : "Unlimited AI Mission Advisor"}</strong>
                </li>
                <li>
                  ✓ <strong>{isEs ? "Estudio TikTok e IG 9:16" : "TikTok & Instagram 9:16 Studio"}</strong>
                </li>
                <li>
                  ✓ <strong>{isEs ? "Insignia Dorada 👑 KINGPIN" : "Verified Gold 👑 KINGPIN Badge"}</strong>{" "}
                  {isEs ? "en el foro + sincronización nube" : "on Forum + Cloud Sync"}
                </li>
              </ul>
            </div>

            {hasKingpin ? (
              <button type="button" className="btn-secondary full-width" disabled>
                {isEs ? "✓ Plan Kingpin Activo" : "✓ Active Kingpin VIP"}
              </button>
            ) : (
              <div className="rail-selector">
                <button
                  type="button"
                  className="btn-yappy"
                  disabled={loadingKey !== null}
                  onClick={() => startYappyCheckout("kingpin")}
                >
                  {loadingKey === "yappy-kingpin"
                    ? isEs
                      ? "Conectando Yappy..."
                      : "Starting Yappy..."
                    : isEs
                      ? "🇵🇦 Pagar con Yappy — $4.99"
                      : "🇵🇦 Pay with Yappy — $4.99"}
                </button>
                <button
                  type="button"
                  className="btn-card-pay"
                  disabled={loadingKey !== null}
                  onClick={() => startCardCheckout("kingpin")}
                >
                  {loadingKey === "card-kingpin"
                    ? isEs
                      ? "Abriendo Stripe..."
                      : "Opening Checkout..."
                    : isEs
                      ? "💳 Pagar con Tarjeta — $4.99"
                      : "💳 Pay with Card — $4.99"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-compliance-links" style={{ marginTop: 18, justifyContent: "center" }}>
          <Link href="/terms" onClick={onClose}>
            {isEs ? "Términos de Servicio" : "Terms of Service"}
          </Link>
          <span>•</span>
          <Link href="/refunds" onClick={onClose}>
            {isEs ? "Política de Reembolso" : "Refund Policy"}
          </Link>
          <span>•</span>
          <Link href="/privacy" onClick={onClose}>
            {isEs ? "Privacidad (Ley 81)" : "Privacy (Law 81)"}
          </Link>
        </div>
      </div>
    </div>
  );
}
