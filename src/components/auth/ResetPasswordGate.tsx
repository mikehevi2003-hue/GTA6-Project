"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Language } from "@/types/vicelink";
import { createClient } from "@/lib/supabase/client";
import { LEGAL_POLICIES } from "@/lib/legal/policies";
import { tField } from "@/lib/i18n/helpers";
import { evaluatePasswordCriteria } from "@/lib/qr/totp-qr";

export default function ResetPasswordGate() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string>("");

  // Step-up 2FA (aal1 -> aal2) before password update if MFA is enrolled
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  // New Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Expired/No-session fresh link request state
  const [requestEmail, setRequestEmail] = useState("");
  const [freshLinkSentTo, setFreshLinkSentTo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isEs = lang === "es";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vicelink_lang");
      if (saved === "en" || saved === "es") setLang(saved);
    } catch {
      // Ignore storage access errors
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const handleLangChange = (next: Language) => {
    setLang(next);
    try {
      window.localStorage.setItem("vicelink_lang", next);
    } catch {
      // Ignore storage write errors
    }
  };

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const inspectSessionAndMfa = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!mounted) return;
        if (!session?.user) {
          setHasSession(false);
          setCheckingSession(false);
          return;
        }

        setHasSession(true);
        setSessionEmail(session.user.email || "");

        try {
          const [{ data: aalData }, { data: factorsData }, meRes] = await Promise.all([
            supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
            supabase.auth.mfa.listFactors(),
            fetch("/api/me", { cache: "no-store" }).catch(() => null)
          ]);
          if (!mounted) return;
          const meData =
            meRes && meRes.ok
              ? ((await meRes.json().catch(() => null)) as {
                  profile?: { mfaEnabled?: boolean };
                } | null)
              : null;
          const verifiedTotp = (factorsData?.totp ?? []).filter((f) => f.status === "verified");
          const isProfileMfaActive = meData?.profile ? meData.profile.mfaEnabled === true : true;
          if (
            verifiedTotp.length > 0 &&
            aalData?.currentLevel !== "aal2" &&
            isProfileMfaActive
          ) {
            setMfaFactorId(verifiedTotp[0].id);
            setMfaRequired(true);
          } else {
            setMfaRequired(false);
          }
        } catch {
          // Proceed if MFA check fails
        }
      } catch {
        if (mounted) setHasSession(false);
      } finally {
        if (mounted) setCheckingSession(false);
      }
    };

    void inspectSessionAndMfa();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (session?.user) {
          setHasSession(true);
          setSessionEmail(session.user.email || "");
          void inspectSessionAndMfa();
        }
      } else if (event === "SIGNED_OUT") {
        setHasSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const pwEval = useMemo(() => evaluatePasswordCriteria(newPassword, lang), [newPassword, lang]);

  const handleVerifyMfa = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCode = totpCode.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6 || !mfaFactorId) {
      setErrorMsg(
        isEs
          ? "Ingresa el código de 6 dígitos de tu autenticador."
          : "Enter the 6-digit code from your authenticator app."
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: cleanCode
      });
      if (error) {
        setErrorMsg(
          isEs
            ? "Código 2FA inválido o expirado. Inténtalo de nuevo."
            : "Invalid or expired 2FA code. Please try again."
        );
        setBusy(false);
        return;
      }
      setMfaRequired(false);
      setTotpCode("");
    } catch {
      setErrorMsg(
        isEs
          ? "No se pudo verificar el código 2FA."
          : "Could not verify 2FA code."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg(
        isEs
          ? "La nueva contraseña debe tener al menos 8 caracteres."
          : "New password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(
        isEs ? "Las contraseñas no coinciden." : "Passwords do not match."
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setErrorMsg(
          error.message ||
            (isEs
              ? "No se pudo actualizar la contraseña. Solicita un nuevo enlace."
              : "Could not update password. Please request a fresh recovery link.")
        );
        setBusy(false);
        return;
      }

      setSuccessMsg(
        isEs
          ? "✓ Contraseña actualizada con éxito. Redirigiendo a tu centro táctico ViceLink..."
          : "✓ Password updated successfully! Redirecting to your ViceLink tactical hub..."
      );
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1200);
    } catch {
      setErrorMsg(
        isEs
          ? "Error de conexión al actualizar la contraseña."
          : "Network error while updating password."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRequestFreshLink = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanEmail = requestEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(
        isEs ? "Ingresa un correo electrónico válido." : "Please enter a valid email address."
      );
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/reset-password`;
      await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      setFreshLinkSentTo(cleanEmail);
      setResendCooldown(60);
    } catch {
      setFreshLinkSentTo(cleanEmail);
      setResendCooldown(60);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell auth-reset-shell" style={{ backgroundColor: "#05070e" }}>
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <div className="sidebar-top-row" style={{ marginBottom: 14 }}>
          <span className="brand-badge">
            {isEs ? "BÓVEDA DE RECUPERACIÓN • LEY 81" : "PASSWORD RECOVERY VAULT • LAW 81"}
          </span>
          <div className="lang-switch" role="group" aria-label="Language">
            <button
              type="button"
              className={`lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => handleLangChange("en")}
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${lang === "es" ? "active" : ""}`}
              onClick={() => handleLangChange("es")}
            >
              ES
            </button>
          </div>
        </div>

        <div className="brand" style={{ marginBottom: 18 }}>
          <h1>
            VICE<span>LINK</span>
          </h1>
          <p>
            {isEs
              ? "Restablecimiento seguro de contraseña y verificación AAL2"
              : "Encrypted password recovery & step-up AAL2 verification"}
          </p>
        </div>

        {errorMsg && (
          <div className="auth-alert auth-alert-error" role="alert">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success" role="status">
            {successMsg}
          </div>
        )}

        {checkingSession ? (
          <div
            className="auth-recovery-card"
            style={{
              padding: "20px 16px",
              textAlign: "center",
              color: "#cbd5e1",
              fontSize: 13.5
            }}
          >
            {isEs
              ? "Verificando sesión de recuperación cifrada..."
              : "Verifying encrypted recovery session..."}
          </div>
        ) : !hasSession ? (
          /* No Active Recovery Session / Expired Link Card */
          <div
            className="auth-recovery-card"
            style={{
              background: "rgba(9, 14, 26, 0.92)",
              border: "1px solid rgba(0, 229, 255, 0.35)",
              borderRadius: 14,
              padding: "18px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#ffffff" }}>
                {isEs
                  ? "Solicitar un Nuevo Enlace de Recuperación"
                  : "Request a Fresh Reset Link"}
              </h2>
              <p style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>
                {isEs
                  ? "Tu enlace de recuperación expiró o aún no has abierto el enlace desde tu correo. Ingresa tu correo para recibir un enlace nuevo."
                  : "Your recovery link has expired or hasn't been opened from your email yet. Enter your account email below to receive a fresh reset link."}
              </p>
            </div>

            {freshLinkSentTo ? (
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.4)",
                  borderRadius: 11,
                  padding: "12px 14px",
                  fontSize: 12.5,
                  color: "#bbf7d0",
                  lineHeight: 1.5
                }}
              >
                {isEs ? (
                  <>
                    Si existe una cuenta para <strong>{freshLinkSentTo}</strong>, enviamos un enlace
                    seguro para restablecer tu contraseña. Revisa tu bandeja de entrada y spam.
                  </>
                ) : (
                  <>
                    If an account exists for <strong>{freshLinkSentTo}</strong>, we sent a secure
                    password reset link. Check your inbox and spam folder.
                  </>
                )}
              </div>
            ) : null}

            <form
              onSubmit={handleRequestFreshLink}
              style={{ display: "flex", flexDirection: "column", gap: 11 }}
            >
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 12.5,
                  color: "#cbd5e1"
                }}
              >
                <span>{isEs ? "Correo electrónico" : "Email address"}</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="player@vicelink.app"
                  style={{
                    background: "#090d18",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    padding: "11px 13px",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none"
                  }}
                />
              </label>

              <button
                type="submit"
                className="btn-pro"
                disabled={busy || resendCooldown > 0}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {busy
                  ? isEs
                    ? "Enviando..."
                    : "Sending..."
                  : resendCooldown > 0
                    ? isEs
                      ? `⏳ Reenviar disponible en ${resendCooldown}s`
                      : `⏳ Resend available in ${resendCooldown}s`
                    : isEs
                      ? "Enviar Nuevo Enlace de Recuperación"
                      : "Send Fresh Reset Link"}
              </button>
            </form>

            <Link
              href="/login"
              className="btn-secondary"
              style={{
                textAlign: "center",
                textDecoration: "none",
                display: "block",
                padding: "10px 14px",
                borderRadius: 10
              }}
            >
              {isEs ? "← Volver a Iniciar Sesión" : "← Back to Sign In"}
            </Link>
          </div>
        ) : mfaRequired ? (
          /* Step-Up 2FA Challenge Required Before Password Change */
          <form
            onSubmit={handleVerifyMfa}
            className="auth-otp-grid"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                background: "rgba(0, 229, 255, 0.1)",
                border: "1px solid rgba(0, 229, 255, 0.35)",
                borderRadius: 11,
                padding: "12px 14px",
                fontSize: 12.5,
                color: "#e2e8f0"
              }}
            >
              🔐{" "}
              {isEs
                ? "Tu cuenta tiene 2FA TOTP activo. Verifica tu código de 6 dígitos para autorizar el cambio de contraseña (nivel AAL2)."
                : "Your account has TOTP 2FA enabled. Verify your 6-digit authenticator code to authorize a password change (AAL2 required)."}
            </div>

            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12.5,
                color: "#cbd5e1"
              }}
            >
              <span>
                {isEs ? "Código TOTP de 6 dígitos" : "6-Digit TOTP Authenticator Code"}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                style={{
                  background: "#090d18",
                  border: "1px solid var(--accent-cyan)",
                  color: "#ffffff",
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: 8,
                  textAlign: "center",
                  fontFamily: "monospace",
                  fontVariantNumeric: "tabular-nums",
                  outline: "none"
                }}
              />
            </label>

            <button type="submit" className="btn-pro" disabled={busy || totpCode.length !== 6}>
              {busy
                ? isEs
                  ? "Verificando 2FA..."
                  : "Verifying 2FA..."
                : isEs
                  ? "🔓 Verificar 2FA y Continuar"
                  : "🔓 Verify 2FA & Continue"}
            </button>
          </form>
        ) : (
          /* Active Session Password Reset Form */
          <form
            onSubmit={handleUpdatePassword}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {sessionEmail && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--accent-cyan)",
                  background: "rgba(0, 229, 255, 0.08)",
                  border: "1px solid rgba(0, 229, 255, 0.25)",
                  padding: "8px 12px",
                  borderRadius: 9
                }}
              >
                ✓ {isEs ? "Sesión verificada para:" : "Verified recovery session for:"}{" "}
                <strong>{sessionEmail}</strong>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12.5,
                color: "#cbd5e1"
              }}
            >
              <label htmlFor="reset-new-password">
                {isEs ? "Nueva contraseña" : "New Password"}
              </label>
              <div
                className="auth-password-wrap"
                style={{ position: "relative", display: "flex", alignItems: "center" }}
              >
                <input
                  id="reset-new-password"
                  type={showNewPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    background: "#090d18",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    padding: "11px 42px 11px 13px",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={
                    showNewPassword
                      ? isEs
                        ? "Ocultar contraseña"
                        : "Hide password"
                      : isEs
                        ? "Mostrar contraseña"
                        : "Show password"
                  }
                  style={{
                    position: "absolute",
                    right: 10,
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 15,
                    padding: "4px 6px"
                  }}
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* 4-Criterion Real-Time Password Strength Checklist */}
            <div className="password-meter" aria-live="polite">
              <div className="progress-top" style={{ fontSize: 11.5, marginBottom: 5 }}>
                <span style={{ color: "var(--text-muted)" }}>
                  {isEs ? "Seguridad de la nueva contraseña" : "New password strength"}
                </span>
                <strong style={{ color: pwEval.color }}>{pwEval.label}</strong>
              </div>
              <div className="progress-track" style={{ marginTop: 0 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${(pwEval.score / 4) * 100}%`,
                    background: pwEval.color
                  }}
                />
              </div>

              <div
                className="auth-strength-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 6,
                  marginTop: 8
                }}
              >
                {pwEval.criteria.map((c) => (
                  <div
                    key={c.id}
                    className={`auth-strength-item ${c.met ? "met" : ""}`}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: c.met ? "#4ade80" : "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <span>{c.met ? "✓" : "○"}</span>
                    <span>{isEs ? c.labelEs : c.labelEn}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                fontSize: 12.5,
                color: "#cbd5e1"
              }}
            >
              <label htmlFor="reset-confirm-password">
                {isEs ? "Confirmar nueva contraseña" : "Confirm New Password"}
              </label>
              <div
                className="auth-password-wrap"
                style={{ position: "relative", display: "flex", alignItems: "center" }}
              >
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    background: "#090d18",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    padding: "11px 42px 11px 13px",
                    borderRadius: 10,
                    fontSize: 14,
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? isEs
                        ? "Ocultar confirmación"
                        : "Hide confirm password"
                      : isEs
                        ? "Mostrar confirmación"
                        : "Show confirm password"
                  }
                  style={{
                    position: "absolute",
                    right: 10,
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: 15,
                    padding: "4px 6px"
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-pro" disabled={busy} style={{ marginTop: 4 }}>
              {busy
                ? isEs
                  ? "Actualizando contraseña..."
                  : "Updating password..."
                : isEs
                  ? "🔒 Guardar Nueva Contraseña"
                  : "🔒 Save New Password"}
            </button>

            <Link
              href="/"
              className="btn-secondary"
              style={{
                textAlign: "center",
                textDecoration: "none",
                display: "block",
                padding: "9px 14px",
                borderRadius: 10,
                fontSize: 12.5
              }}
            >
              {isEs ? "← Volver al Hub ViceLink" : "← Return to ViceLink Hub"}
            </Link>
          </form>
        )}

        <div className="security-pills">
          <span>🔒 {isEs ? "Recuperación Cifrada" : "Encrypted Recovery"}</span>
          <span>🛡️ {isEs ? "Protección AAL2 2FA" : "AAL2 2FA Guard"}</span>
          <span>🇵🇦 {isEs ? "Privacidad Ley 81" : "Panama Law 81 Privacy"}</span>
        </div>

        <footer className="auth-footer">
          <div className="sidebar-compliance-links">
            <Link href="/terms">{isEs ? "Términos" : "Terms"}</Link>
            <span>•</span>
            <Link href="/privacy">{isEs ? "Privacidad" : "Privacy"}</Link>
            <span>•</span>
            <Link href="/refunds">{isEs ? "Reembolsos" : "Refunds"}</Link>
          </div>
          <p className="legal-note" style={{ marginTop: 8 }}>
            {tField(LEGAL_POLICIES.disclaimer, lang)}
          </p>
        </footer>
      </div>
    </div>
  );
}
