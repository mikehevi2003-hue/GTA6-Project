"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type {
  Language,
  PromoValidationResult,
  UserTier,
  YappyCheckoutResponse
} from "@/types/vicelink";
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

const BASE_STREET_USD = 1.99;
const BASE_KINGPIN_USD = 4.99;

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
  const [notice, setNotice] = useState<{ kind: "error" | "info" | "success"; text: string } | null>(
    null
  );
  const [yappyOrder, setYappyOrder] = useState<(YappyCheckoutResponse & { tier: PaidTier }) | null>(
    null
  );
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Stage 12 Promo / Discount Code Redeemer State
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoValidationResult | null>(null);

  // Stage 12 Mandatory Pre-Checkout No-Refund Waiver State
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  const [waiverErrorHighlight, setWaiverErrorHighlight] = useState(false);

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
      setWaiverErrorHighlight(false);
    }
  }, [open]);

  if (!open) return null;

  const streetDiscountActive =
    Boolean(appliedPromo?.valid) &&
    (appliedPromo?.targetTier === "street" || appliedPromo?.targetTier === "both") &&
    typeof appliedPromo?.streetDiscountedUsd === "number" &&
    appliedPromo.streetDiscountedUsd < BASE_STREET_USD;

  const kingpinDiscountActive =
    Boolean(appliedPromo?.valid) &&
    (appliedPromo?.targetTier === "kingpin" || appliedPromo?.targetTier === "both") &&
    typeof appliedPromo?.kingpinDiscountedUsd === "number" &&
    appliedPromo.kingpinDiscountedUsd < BASE_KINGPIN_USD;

  const activeStreetPriceUsd = streetDiscountActive
    ? appliedPromo!.streetDiscountedUsd
    : BASE_STREET_USD;
  const activeKingpinPriceUsd = kingpinDiscountActive
    ? appliedPromo!.kingpinDiscountedUsd
    : BASE_KINGPIN_USD;

  const handleApplyPromo = async (e?: FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const cleanCode = (overrideCode ?? promoInput).trim().toUpperCase();
    if (!cleanCode) {
      setNotice({
        kind: "error",
        text: isEs
          ? "Ingresa un código promocional (ej. PANAMA50, LEONIDA25, FOUNDERVIP)."
          : "Enter a promo code first (e.g. PANAMA50, LEONIDA25, FOUNDERVIP)."
      });
      return;
    }

    setPromoLoading(true);
    setNotice(null);
    try {
      const res = await fetch("/api/promo/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode })
      });
      const data = (await res.json().catch(() => ({}))) as Partial<PromoValidationResult> & {
        message?: string;
      };

      if (!res.ok || !data.valid) {
        setAppliedPromo(null);
        setNotice({
          kind: "error",
          text:
            (isEs ? data.messageEs : data.messageEn) ||
            data.message ||
            (isEs
              ? "Código promocional inválido, expirado o agotado."
              : "Invalid, expired, or exhausted promo code.")
        });
        return;
      }

      const validPromo = data as PromoValidationResult;
      setAppliedPromo(validPromo);
      setPromoInput(validPromo.code);

      if (validPromo.instantUnlock || validPromo.discountPct === 100) {
        await onRefreshData();
        setNotice({
          kind: "success",
          text:
            (isEs ? validPromo.messageEs : validPromo.messageEn) ||
            (isEs
              ? `🎉 ¡Código ${validPromo.code} del 100% canjeado! Tu pase vitalicio ha sido desbloqueado de inmediato.`
              : `🎉 100% Promo Code ${validPromo.code} redeemed! Your lifetime pass has been unlocked immediately.`)
        });
        return;
      }

      setNotice({
        kind: "success",
        text:
          (isEs ? validPromo.messageEs : validPromo.messageEn) ||
          (isEs
            ? `✓ Código ${validPromo.code} aplicado (-${validPromo.discountPct}%). Precios actualizados abajo.`
            : `✓ Promo code ${validPromo.code} applied (-${validPromo.discountPct}%). Discounted prices active below.`)
      });
    } catch {
      setNotice({
        kind: "error",
        text: isEs
          ? "Error de red al validar el código promocional."
          : "Network error while validating promo code."
      });
    } finally {
      setPromoLoading(false);
    }
  };

  const handleClearPromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setNotice(null);
  };

  const enforcePreCheckoutWaiver = (): boolean => {
    if (waiverAccepted) {
      setWaiverErrorHighlight(false);
      return true;
    }
    setWaiverErrorHighlight(true);
    setNotice({
      kind: "error",
      text: isEs
        ? "Debes marcar la casilla obligatoria de Entrega Digital Inmediata y Política de No Reembolso antes de continuar al pago."
        : "You must check the mandatory Immediate Digital Delivery & No-Refund Waiver box below before proceeding to checkout."
    });
    return false;
  };

  const startYappyCheckout = async (targetTier: PaidTier) => {
    if (!enforcePreCheckoutWaiver()) return;
    setNotice(null);
    setYappyOrder(null);
    setLoadingKey(`yappy-${targetTier}`);
    try {
      const res = await fetch("/api/checkout/yappy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTier,
          promoCode: appliedPromo?.code,
          waiverAccepted: true
        })
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
    if (!enforcePreCheckoutWaiver()) return;
    setNotice(null);
    setYappyOrder(null);
    setLoadingKey(`card-${targetTier}`);
    try {
      const res = await fetch("/api/checkout/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTier,
          promoCode: appliedPromo?.code,
          waiverAccepted: true
        })
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

        {/* GTA VI Player Value Conversion Banner */}
        <div
          className="value-conversion-banner"
          style={{
            background:
              "linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(255, 42, 133, 0.14))",
            border: "1px solid rgba(0, 229, 255, 0.42)",
            borderRadius: 14,
            padding: "14px 16px",
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
              flexWrap: "wrap",
              gap: 8
            }}
          >
            <strong style={{ fontSize: 13.5, color: "#ffffff" }}>
              ⚡{" "}
              {isEs
                ? "VENTAJA TÁCTICA GTA VI — DESBLOQUEO DIGITAL INMEDIATO"
                : "GTA VI TACTICAL PLAYER ADVANTAGE — INSTANT DIGITAL UNLOCK"}
            </strong>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 10px",
                borderRadius: 99,
                background: "rgba(34, 197, 94, 0.18)",
                border: "1px solid rgba(34, 197, 94, 0.5)",
                color: "#4ade80"
              }}
            >
              {isEs
                ? "Pago Único $1.99 / $4.99 • Sin Cuotas Mensuales"
                : "One-Time Pay $1.99 / $4.99 • No Monthly Fees"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))",
              gap: 8,
              fontSize: 12,
              color: "#e2e8f0"
            }}
          >
            <div
              style={{
                background: "rgba(9, 13, 24, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 9,
                padding: "7px 10px"
              }}
            >
              💰{" "}
              <strong>
                {isEs
                  ? "Ruta de $250K/hr y Superauto en la 1ra Hora"
                  : "$250K/hr First-Hour Cash & Supercar Route"}
              </strong>
            </div>
            <div
              style={{
                background: "rgba(9, 13, 24, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 9,
                padding: "7px 10px"
              }}
            >
              ⚡{" "}
              <strong>
                {isEs ? "5 Glitches de Dinero Activos" : "5 Working Money Glitches"}
              </strong>
            </div>
            <div
              style={{
                background: "rgba(9, 13, 24, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 9,
                padding: "7px 10px"
              }}
            >
              🗺️{" "}
              <strong>
                {isEs
                  ? "Las 32 Coordenadas del Mapa Táctico"
                  : "All 32 Tactical Map Coordinates"}
              </strong>
            </div>
            <div
              style={{
                background: "rgba(9, 13, 24, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 9,
                padding: "7px 10px"
              }}
            >
              🏆{" "}
              <strong>
                {isEs ? "55 Guías de Trofeos de Platino" : "55 Trophy Roadmaps"}
              </strong>
            </div>
            <div
              style={{
                background: "rgba(9, 13, 24, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 9,
                padding: "7px 10px"
              }}
            >
              🤖{" "}
              <strong>
                {isEs ? "Asesor IA Ilimitado (Kingpin)" : "Unlimited AI Advisor"}
              </strong>
            </div>
          </div>
        </div>

        {/* Interactive Promo / Discount Code Redeemer */}
        <div
          className="promo-redeemer-box"
          style={{
            background: "rgba(9, 13, 24, 0.88)",
            border: appliedPromo
              ? "1px solid rgba(34, 197, 94, 0.55)"
              : "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 12,
            padding: "11px 14px",
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}
        >
          <form
            onSubmit={(e) => void handleApplyPromo(e)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--accent-cyan)" }}>
                🎟️{" "}
                {isEs
                  ? "¿Tienes un Código Promocional o VIP?"
                  : "Have a Promo or Discount Code?"}
              </span>
              {appliedPromo && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: "rgba(34, 197, 94, 0.18)",
                    border: "1px solid rgba(34, 197, 94, 0.5)",
                    color: "#4ade80"
                  }}
                >
                  ✓ {appliedPromo.code} (-{appliedPromo.discountPct}%)
                </span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flex: 1, minWidth: 240, justifyContent: "flex-end" }}>
              <input
                type="text"
                maxLength={32}
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder={
                  isEs
                    ? "Código (ej. PANAMA50, LEONIDA25, FOUNDERVIP)"
                    : "Enter code (e.g. PANAMA50, LEONIDA25, FOUNDERVIP)"
                }
                aria-label={isEs ? "Código promocional" : "Promo code"}
                style={{
                  flex: 1,
                  maxWidth: 270,
                  background: "#05070e",
                  border: "1px solid var(--border)",
                  color: "#ffffff",
                  padding: "8px 11px",
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: "uppercase"
                }}
              />
              <button
                type="submit"
                className="copy-combo-btn"
                disabled={promoLoading || !promoInput.trim()}
                style={{ whiteSpace: "nowrap", fontWeight: 800, padding: "8px 14px" }}
              >
                {promoLoading
                  ? isEs
                    ? "Validando..."
                    : "Applying..."
                  : isEs
                    ? "Aplicar Código"
                    : "Apply Code"}
              </button>
              {appliedPromo && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleClearPromo}
                  style={{ padding: "7px 10px", fontSize: 11.5 }}
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mandatory Pre-Checkout No-Refund Waiver Checkbox */}
        {(!hasStreet || !hasKingpin) && (
          <label
            className="precheckout-waiver-box"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "11px 14px",
              borderRadius: 12,
              marginBottom: 14,
              cursor: "pointer",
              background: waiverErrorHighlight
                ? "rgba(244, 63, 94, 0.14)"
                : waiverAccepted
                  ? "rgba(34, 197, 94, 0.1)"
                  : "rgba(15, 23, 42, 0.85)",
              border: waiverErrorHighlight
                ? "2px solid #f43f5e"
                : waiverAccepted
                  ? "1px solid rgba(34, 197, 94, 0.55)"
                  : "1px solid rgba(250, 204, 21, 0.45)",
              boxShadow: waiverErrorHighlight ? "0 0 18px rgba(244, 63, 94, 0.35)" : "none",
              transition: "all 0.18s ease"
            }}
          >
            <input
              type="checkbox"
              checked={waiverAccepted}
              onChange={(e) => {
                setWaiverAccepted(e.target.checked);
                if (e.target.checked) {
                  setWaiverErrorHighlight(false);
                  if (notice?.kind === "error") setNotice(null);
                }
              }}
              style={{
                width: 18,
                height: 18,
                marginTop: 2,
                accentColor: "var(--accent-cyan)",
                cursor: "pointer",
                flexShrink: 0
              }}
            />
            <span style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.5 }}>
              <strong>
                {isEs
                  ? "Consentimiento Obligatorio de Entrega Digital Inmediata y Venta Final (Sin Reembolso):"
                  : "Mandatory Immediate Digital Delivery & All-Sales-Final No-Refund Waiver:"}
              </strong>{" "}
              {isEs
                ? "Solicito el desbloqueo digital inmediato de mi pase de pago único ($1.99 / $4.99 USD) y reconozco expresamente que, una vez desbloqueadas las coordenadas del mapa, rutas de dinero y glitches, todas las ventas son finales y renuncio a cualquier periodo de retracto o reembolso (Ley 45 de Panamá / Directiva UE 2011/83/UE Art. 16(m) / UK Reg. 37)."
                : "I request immediate digital performance and unlock of my one-time pass ($1.99 / $4.99 USD) and expressly acknowledge that once digital map coordinates, cash routes, and glitches are unlocked, all sales are final and I waive any cooling-off or withdrawal refund right (Panama Law 45 / EU Directive 2011/83/EU Art. 16(m) / UK Reg. 37)."}{" "}
              <Link
                href="/refunds"
                onClick={onClose}
                style={{ color: "var(--accent-cyan)", fontWeight: 700, textDecoration: "underline" }}
              >
                {isEs ? "Ver Política de No Reembolso" : "Read No-Refund Policy"}
              </Link>
            </span>
          </label>
        )}

        {notice && (
          <div
            className={`auth-alert ${
              notice.kind === "error" ? "auth-alert-error" : "auth-alert-success"
            }`}
            style={{ marginBottom: 14 }}
            role="status"
          >
            {notice.kind === "error" ? "⚠️ " : notice.kind === "success" ? "✓ " : "ℹ️ "}
            {notice.text}
          </div>
        )}

        {yappyOrder && (
          <div
            className="unlock-card-step"
            style={{ marginBottom: 16, borderColor: "var(--accent-cyan)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap"
              }}
            >
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
            <div
              className="code-box"
              style={{ marginTop: 8, fontSize: 11.5, wordBreak: "break-all" }}
            >
              orderId: {yappyOrder.orderId} • txId: {yappyOrder.transactionId} • doc:{" "}
              {yappyOrder.documentName}
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
              <div className="tier-price" style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                {streetDiscountActive ? (
                  <>
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "#94a3b8",
                        fontSize: 17,
                        fontWeight: 700
                      }}
                    >
                      ${BASE_STREET_USD.toFixed(2)}
                    </span>
                    <strong style={{ color: "#4ade80" }}>
                      ${activeStreetPriceUsd.toFixed(2)}
                    </strong>
                  </>
                ) : (
                  <>${BASE_STREET_USD.toFixed(2)}</>
                )}{" "}
                <span>{isEs ? "pago único" : "one-time"}</span>
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
                  ✓{" "}
                  <strong>
                    {isEs ? "Hub de Glitches y Exploits" : "Active Glitches & Exploits Hub"}
                  </strong>
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
                  onClick={() => void startYappyCheckout("street")}
                >
                  {loadingKey === "yappy-street"
                    ? isEs
                      ? "Conectando Yappy..."
                      : "Starting Yappy..."
                    : isEs
                      ? `🇵🇦 Pagar con Yappy — $${activeStreetPriceUsd.toFixed(2)}`
                      : `🇵🇦 Pay with Yappy — $${activeStreetPriceUsd.toFixed(2)}`}
                </button>
                <button
                  type="button"
                  className="btn-card-pay"
                  disabled={loadingKey !== null}
                  onClick={() => void startCardCheckout("street")}
                >
                  {loadingKey === "card-street"
                    ? isEs
                      ? "Abriendo Stripe..."
                      : "Opening Checkout..."
                    : isEs
                      ? `💳 Pagar con Tarjeta — $${activeStreetPriceUsd.toFixed(2)}`
                      : `💳 Pay with Card — $${activeStreetPriceUsd.toFixed(2)}`}
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
              <div className="tier-price" style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                {kingpinDiscountActive ? (
                  <>
                    <span
                      style={{
                        textDecoration: "line-through",
                        color: "#94a3b8",
                        fontSize: 17,
                        fontWeight: 700
                      }}
                    >
                      ${BASE_KINGPIN_USD.toFixed(2)}
                    </span>
                    <strong style={{ color: "#4ade80" }}>
                      ${activeKingpinPriceUsd.toFixed(2)}
                    </strong>
                  </>
                ) : (
                  <>${BASE_KINGPIN_USD.toFixed(2)}</>
                )}{" "}
                <span>{isEs ? "pago único" : "one-time"}</span>
              </div>
              <ul>
                <li>
                  ✓ {isEs ? "Todo lo incluido en" : "Everything in"}{" "}
                  <strong>Street Pass</strong>
                </li>
                <li>
                  ✓{" "}
                  <strong>
                    {isEs ? "Asesor IA Ilimitado" : "Unlimited AI Mission Advisor"}
                  </strong>
                </li>
                <li>
                  ✓{" "}
                  <strong>
                    {isEs ? "Estudio TikTok e IG 9:16" : "TikTok & Instagram 9:16 Studio"}
                  </strong>
                </li>
                <li>
                  ✓{" "}
                  <strong>
                    {isEs ? "Insignia Dorada 👑 KINGPIN" : "Verified Gold 👑 KINGPIN Badge"}
                  </strong>{" "}
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
                  onClick={() => void startYappyCheckout("kingpin")}
                >
                  {loadingKey === "yappy-kingpin"
                    ? isEs
                      ? "Conectando Yappy..."
                      : "Starting Yappy..."
                    : isEs
                      ? `🇵🇦 Pagar con Yappy — $${activeKingpinPriceUsd.toFixed(2)}`
                      : `🇵🇦 Pay with Yappy — $${activeKingpinPriceUsd.toFixed(2)}`}
                </button>
                <button
                  type="button"
                  className="btn-card-pay"
                  disabled={loadingKey !== null}
                  onClick={() => void startCardCheckout("kingpin")}
                >
                  {loadingKey === "card-kingpin"
                    ? isEs
                      ? "Abriendo Stripe..."
                      : "Opening Checkout..."
                    : isEs
                      ? `💳 Pagar con Tarjeta — $${activeKingpinPriceUsd.toFixed(2)}`
                      : `💳 Pay with Card — $${activeKingpinPriceUsd.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          className="sidebar-compliance-links"
          style={{ marginTop: 18, justifyContent: "center" }}
        >
          <Link href="/terms" onClick={onClose}>
            {isEs ? "Términos de Servicio" : "Terms of Service"}
          </Link>
          <span>•</span>
          <Link href="/refunds" onClick={onClose}>
            {isEs ? "Política de No Reembolso (Venta Final)" : "No-Refund Policy (All Sales Final)"}
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
