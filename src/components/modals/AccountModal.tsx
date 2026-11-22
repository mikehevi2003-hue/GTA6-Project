"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Language, PaymentReceipt, UserProfile } from "@/types/vicelink";

export interface AccountModalProps {
  open: boolean;
  lang: Language;
  profile: UserProfile;
  payments: PaymentReceipt[];
  onClose: () => void;
  onSaveProfile: (patch: {
    handle: string;
    displayName: string;
    preferredLang: Language;
  }) => Promise<void>;
  onOpenPricing: () => void;
  onSignOut: () => Promise<void>;
}

const TIER_LABELS: Record<UserProfile["tier"], { en: string; es: string }> = {
  free: { en: "FREE RECRUIT", es: "RECLUTA GRATIS" },
  street: { en: "STREET PASS ($1.99)", es: "STREET PASS ($1.99)" },
  kingpin: { en: "👑 KINGPIN VIP ($4.99)", es: "👑 KINGPIN VIP ($4.99)" }
};

export default function AccountModal({
  open,
  lang,
  profile,
  payments,
  onClose,
  onSaveProfile,
  onOpenPricing,
  onSignOut
}: AccountModalProps) {
  const isEs = lang === "es";
  const [handle, setHandle] = useState(profile.handle);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [preferredLang, setPreferredLang] = useState<Language>(profile.preferredLang);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    setHandle(profile.handle);
    setDisplayName(profile.displayName);
    setPreferredLang(profile.preferredLang);
    setStatusMsg(null);
  }, [open, profile]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await onSaveProfile({
        handle: handle.trim(),
        displayName: displayName.trim(),
        preferredLang
      });
      setStatusMsg({
        kind: "success",
        text: isEs ? "Perfil actualizado y sincronizado." : "Profile saved and synced."
      });
    } catch (err) {
      setStatusMsg({
        kind: "error",
        text:
          err instanceof Error
            ? err.message
            : isEs
              ? "No se pudo actualizar tu perfil."
              : "Failed to save profile."
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportLaw81 = async () => {
    setExporting(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/me/export");
      if (!res.ok) {
        throw new Error(isEs ? "Error al exportar datos." : "Could not export account data.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vicelink-law81-export.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatusMsg({
        kind: "success",
        text: isEs
          ? "Archivo vicelink-law81-export.json descargado."
          : "Downloaded vicelink-law81-export.json."
      });
    } catch (err) {
      setStatusMsg({
        kind: "error",
        text: err instanceof Error ? err.message : isEs ? "Fallo la exportación." : "Export failed."
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSignOutClick = async () => {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label={isEs ? "Cuenta y Privacidad" : "Account & Privacy"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content modal-wide" style={{ maxWidth: 700 }}>
        <div className="modal-top-bar">
          <span className="brand-badge">
            {isEs ? "CUENTA VERIFICADA • PRIVACIDAD LEY 81" : "VERIFIED ACCOUNT • LAW 81 PRIVACY"}
          </span>
          <button type="button" className="modal-close-pill" onClick={onClose}>
            ✕ {isEs ? "Cerrar" : "Close"}
          </button>
        </div>

        <h3>{isEs ? "Perfil de Miembro y Recibos" : "Member Profile & Receipts"}</h3>
        <p className="modal-sub">
          {profile.email} •{" "}
          <span className={`tier-chip tier-${profile.tier}`}>
            {isEs ? TIER_LABELS[profile.tier].es : TIER_LABELS[profile.tier].en}
          </span>
        </p>

        {statusMsg && (
          <div
            className={`auth-alert ${statusMsg.kind === "error" ? "auth-alert-error" : "auth-alert-success"}`}
            style={{ marginBottom: 14 }}
          >
            {statusMsg.kind === "error" ? "⚠️ " : "✓ "}
            {statusMsg.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 18 }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
            <span>{isEs ? "@Usuario en el Foro" : "Forum @Handle"}</span>
            <input
              type="text"
              required
              maxLength={25}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                padding: "9px 11px",
                borderRadius: 9,
                fontSize: 13.5
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
            <span>{isEs ? "Nombre visible" : "Display Name"}</span>
            <input
              type="text"
              maxLength={60}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={isEs ? "Tu nombre o alias" : "Your name or callsign"}
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                padding: "9px 11px",
                borderRadius: 9,
                fontSize: 13.5
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
            <span>{isEs ? "Idioma Preferido" : "Preferred Language"}</span>
            <select
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value as Language)}
              style={{
                background: "#090d18",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                padding: "9px 11px",
                borderRadius: 9,
                fontSize: 13.5
              }}
            >
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
            </select>
          </label>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button type="submit" className="btn-pro" disabled={saving}>
              {saving
                ? isEs
                  ? "Guardando..."
                  : "Saving..."
                : isEs
                  ? "Guardar Cambios"
                  : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Verified Payment Receipts Table */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <h4 style={{ fontSize: 14, color: "var(--accent-cyan)" }}>
              🧾 {isEs ? "Historial de Pagos Verificados" : "Verified Payment Receipts"}
            </h4>
            {profile.tier !== "kingpin" && (
              <button
                type="button"
                className="copy-combo-btn"
                onClick={() => {
                  onClose();
                  onOpenPricing();
                }}
              >
                {isEs ? "⚡ Mejorar Pase" : "⚡ Upgrade Pass"}
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="unlock-card-step" style={{ color: "#94a3b8" }}>
              {isEs
                ? "Aún no tienes pagos registrados en esta cuenta."
                : "No payment receipts recorded on this account yet."}
            </div>
          ) : (
            <div className="fence-table-wrap">
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>{isEs ? "Fecha" : "Date"}</th>
                    <th>{isEs ? "Pasarela" : "Rail"}</th>
                    <th>{isEs ? "Orden" : "Order ID"}</th>
                    <th>{isEs ? "Pase" : "Tier"}</th>
                    <th>{isEs ? "Monto" : "Amount"}</th>
                    <th>{isEs ? "Estado" : "Status"}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td style={{ textTransform: "uppercase" }}>{p.provider}</td>
                      <td>
                        <code>{p.providerOrderId}</code>
                      </td>
                      <td style={{ textTransform: "uppercase" }}>{p.tier}</td>
                      <td>
                        ${Number(p.amountUsd).toFixed(2)} {p.currency}
                      </td>
                      <td style={{ textTransform: "uppercase", fontWeight: 700 }}>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Law 81 Export & Sign Out */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 12,
            borderTop: "1px solid var(--border)"
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            disabled={exporting}
            onClick={handleExportLaw81}
          >
            {exporting
              ? isEs
                ? "Exportando..."
                : "Exporting..."
              : isEs
                ? "📥 Exportar Mis Datos (Ley 81)"
                : "📥 Export My Data (Law 81)"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            disabled={signingOut}
            onClick={handleSignOutClick}
            style={{ borderColor: "rgba(244, 63, 94, 0.5)", color: "#fda4af" }}
          >
            {signingOut
              ? isEs
                ? "Cerrando sesión..."
                : "Signing out..."
              : isEs
                ? "Cerrar Sesión"
                : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
