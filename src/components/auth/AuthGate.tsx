"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Language } from "@/types/vicelink";
import { createClient } from "@/lib/supabase/client";
import { LEGAL_POLICIES } from "@/lib/legal/policies";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";
import { evaluatePasswordCriteria } from "@/lib/qr/totp-qr";

type AuthMode = "login" | "signup" | "reset";

export default function AuthGate() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [handle, setHandle] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Anti-Enumeration Forgot Password Confirmation Card & 60s Cooldown
  const [resetSentEmail, setResetSentEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Step-Up 6-Digit TOTP 2FA Challenge State (aal1 -> aal2)
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");

  const isEs = lang === "es";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("vicelink_lang");
      if (saved === "en" || saved === "es") setLang(saved);
    } catch {
      // Ignore storage access errors
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const qMode = params.get("mode");
      if (qMode === "reset" || qMode === "signup" || qMode === "login") {
        setMode(qMode);
      }
      const qEmail = params.get("email");
      if (qEmail) setEmail(qEmail);
    } catch {
      // Ignore URL parse issues
    }
  }, []);

  // 60-second resend cooldown timer
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

  const pwEval = useMemo(() => evaluatePasswordCriteria(password, lang), [password, lang]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSentEmail(null);
    setMfaRequired(false);
    setTotpCode("");
  };

  const handleForgotInline = () => {
    setMode("reset");
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSentEmail(null);
  };

  const triggerPasswordResetEmail = async (targetEmail: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(
        isEs ? "Ingresa un correo electrónico válido." : "Please enter a valid email address."
      );
      return;
    }

    setBusy(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/reset-password`;
      await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo
      });
      // Anti-enumeration: Always transition to confirmation card without leaking whether the email exists
      setResetSentEmail(cleanEmail);
      setResendCooldown(60);
    } catch {
      // Even on unexpected client failure, show anti-enumeration confirmation if email format is valid
      setResetSentEmail(cleanEmail);
      setResendCooldown(60);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyMfa = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCode = totpCode.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6 || !mfaFactorId) {
      setErrorMsg(
        isEs
          ? "Ingresa el código de 6 dígitos de tu aplicación autenticadora."
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
            ? "Código TOTP inválido o expirado. Verifica tu autenticador e inténtalo de nuevo."
            : "Invalid or expired TOTP code. Check your authenticator and try again."
        );
        setBusy(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMsg(
        isEs
          ? "No se pudo verificar el código 2FA. Inténtalo de nuevo."
          : "Could not verify 2FA code. Please try again."
      );
      setBusy(false);
    }
  };

  const handleCancelMfa = async () => {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore signout error
    } finally {
      setMfaRequired(false);
      setMfaFactorId(null);
      setTotpCode("");
      setPassword("");
      setBusy(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`
        }
      });
      if (error) {
        setErrorMsg(
          error.message ||
            (isEs
              ? "No se pudo iniciar sesión con Google."
              : "Could not start Google sign-in.")
        );
        setBusy(false);
      }
    } catch {
      setErrorMsg(
        isEs
          ? "No se pudo conectar con Google OAuth. Intenta de nuevo."
          : "Could not connect to Google OAuth. Please try again."
      );
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(
        isEs ? "Ingresa un correo electrónico válido." : "Please enter a valid email address."
      );
      return;
    }

    if (mode === "reset") {
      await triggerPasswordResetEmail(cleanEmail);
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();

      if (mode === "login") {
        if (!password) {
          setErrorMsg(isEs ? "Ingresa tu contraseña." : "Please enter your password.");
          setBusy(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) {
          setErrorMsg(
            isEs
              ? "Credenciales inválidas. Verifica tu correo y contraseña."
              : "Invalid credentials. Check your email and password."
          );
          setBusy(false);
          return;
        }

        // Priority 0 2FA Lockout Fix: Inspect BOTH verified TOTP factors AND meData.profile.mfaEnabled
        try {
          const [{ data: factorsData }, meRes] = await Promise.all([
            supabase.auth.mfa.listFactors(),
            fetch("/api/me", { cache: "no-store" })
          ]);
          const meData = meRes.ok
            ? ((await meRes.json().catch(() => null)) as {
                profile?: { mfaEnabled?: boolean; isAdmin?: boolean };
              } | null)
            : null;
          const verifiedTotp = (factorsData?.totp ?? []).filter((f) => f.status === "verified");

          if (verifiedTotp.length === 0 || meData?.profile?.mfaEnabled !== true) {
            // Case A: User has NOT completed authenticator QR setup in ViceLink — DO NOT show 6-digit TOTP challenge!
            router.replace(meData?.profile?.isAdmin ? "/?setup2fa=1" : "/");
            router.refresh();
            return;
          }

          if (verifiedTotp.length > 0 && meData?.profile?.mfaEnabled === true) {
            // Case B: Verified TOTP factor + ViceLink mfaEnabled === true -> Show 6-digit TOTP step-up challenge
            setMfaFactorId(verifiedTotp[0].id);
            setMfaRequired(true);
            setTotpCode("");
            setBusy(false);
            return;
          }
        } catch {
          // Proceed smoothly if MFA inspection is unavailable
        }

        router.replace("/");
        router.refresh();
        return;
      }

      if (mode === "signup") {
        if (password.length < 8) {
          setErrorMsg(
            isEs
              ? "La contraseña debe tener al menos 8 caracteres."
              : "Password must be at least 8 characters long."
          );
          setBusy(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg(isEs ? "Las contraseñas no coinciden." : "Passwords do not match.");
          setBusy(false);
          return;
        }

        const sanitizedHandle = handle
          .trim()
          .replace(/^@+/, "")
          .replace(/[^A-Za-z0-9_]/g, "")
          .slice(0, 24);

        const redirectTo = `${window.location.origin}/api/auth/callback`;
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              handle: sanitizedHandle ? `@${sanitizedHandle}` : undefined,
              preferred_lang: lang
            }
          }
        });

        if (error) {
          setErrorMsg(error.message);
          setBusy(false);
          return;
        }

        if (data.session) {
          router.replace("/");
          router.refresh();
          return;
        }

        setSuccessMsg(
          isEs
            ? "Cuenta creada. Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión."
            : "Account created! Check your email inbox to confirm your address before signing in."
        );
        setPassword("");
        setConfirmPassword("");
        setBusy(false);
        return;
      }
    } catch {
      setErrorMsg(
        isEs
          ? "No se pudo conectar con el servicio de autenticación. Intenta de nuevo."
          : "Could not reach the authentication service. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <div
        className="auth-split-shell"
        style={{
          width: "100%",
          maxWidth: 1040,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: 24,
          alignItems: "stretch"
        }}
      >
        {/* Left Panel: ViceLink Leonida Operational Showcase */}
        <section
          className="auth-showcase-panel"
          aria-label={isEs ? "Resumen Operativo de ViceLink" : "ViceLink Operational Showcase"}
          style={{
            background:
              "linear-gradient(155deg, rgba(13, 18, 34, 0.92), rgba(20, 14, 36, 0.88))",
            border: "1px solid rgba(255, 42, 133, 0.32)",
            borderRadius: 18,
            padding: "28px 26px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: 20,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.72)"
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16
              }}
            >
              <span className="brand-badge">
                {t(lang, "badge", isEs ? "HUB NO OFICIAL DE FANS" : "UNOFFICIAL FAN HUB")}
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: 1,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: "rgba(34, 197, 94, 0.16)",
                  border: "1px solid rgba(34, 197, 94, 0.45)",
                  color: "#4ade80"
                }}
              >
                ● v2.5 LIVE // LEONIDA HUD
              </span>
            </div>

            <div className="brand" style={{ marginBottom: 14 }}>
              <h1 style={{ fontSize: 34, letterSpacing: 1.6 }}>
                VICE<span>LINK</span>
              </h1>
              <p style={{ fontSize: 14, color: "#cbd5e1", marginTop: 6, lineHeight: 1.5 }}>
                {isEs
                  ? "Centro táctico sincronizado en la nube para GTA VI: radar interactivo de Leonida, trucos verificados, guía de Platino, radio y asesor IA."
                  : "Cloud-synced GTA VI tactical command hub: interactive Leonida radar, verified button combos, Platinum checklist, radio finder & AI advisor."}
              </p>
            </div>

            {/* 4 Operational Telemetry Badges */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginTop: 18
              }}
            >
              <div
                style={{
                  background: "rgba(8, 12, 22, 0.78)",
                  border: "1px solid rgba(0, 229, 255, 0.28)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "var(--accent-cyan)",
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  19
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>
                  {isEs ? "Trucos Verificados" : "Verified Cheats"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {isEs ? "PS5 DualSense y Xbox" : "PS5 DualSense & Xbox"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(8, 12, 22, 0.78)",
                  border: "1px solid rgba(255, 42, 133, 0.28)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "var(--accent-pink)",
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  32
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>
                  {isEs ? "Pines Tácticos" : "Tactical Pins"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {isEs ? "Cajeros, Autos y Fences" : "ATMs, Rare Cars & Fences"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(8, 12, 22, 0.78)",
                  border: "1px solid rgba(250, 204, 21, 0.28)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#facc15",
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  55
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>
                  {isEs ? "Trofeos de Platino" : "Trophies"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {isEs ? "Alertas de Cap. 1 Perdibles" : "Missable Ch. 1 Alerts"}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(8, 12, 22, 0.78)",
                  border: "1px solid rgba(139, 92, 246, 0.32)",
                  borderRadius: 12,
                  padding: "12px 14px"
                }}
              >
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#c4b5fd",
                    fontVariantNumeric: "tabular-nums"
                  }}
                >
                  25
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>
                  {isEs ? "Emisoras de Radio" : "Radio Stations"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  {isEs ? "Buscador de Temas y DJs" : "Track & DJ Frequency Finder"}
                </div>
              </div>
            </div>

            {/* Operational Feature List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                marginTop: 18,
                padding: "14px",
                borderRadius: 12,
                background: "rgba(9, 13, 24, 0.65)",
                border: "1px solid rgba(255, 255, 255, 0.07)",
                fontSize: 12.5,
                color: "#cbd5e1"
              }}
            >
              <div>
                🎮{" "}
                <strong>
                  {isEs ? "Vinculación PSN y Xbox:" : "PSN & Xbox Bio-Code Handshake:"}
                </strong>{" "}
                {isEs
                  ? "Insignias verificadas en el foro y tarjetas 9:16."
                  : "Verified console badges across forum & 9:16 cards."}
              </div>
              <div>
                📸{" "}
                <strong>
                  {isEs ? "Sincronización OCR con IA:" : "Smart Screenshot OCR Sync:"}
                </strong>{" "}
                {isEs
                  ? "Escanea capturas del mapa para marcar pines automáticamente."
                  : "Scan map screenshots to auto-mark discovered Leonida pins."}
              </div>
              <div>
                🛡️{" "}
                <strong>
                  {isEs ? "Bóveda 2FA TOTP:" : "TOTP 2FA Account Vault:"}
                </strong>{" "}
                {isEs
                  ? "Protección de grado AAL2 compatible con Google/Authy/1Password."
                  : "Step-up AAL2 protection compatible with Google/Authy/1Password."}
              </div>
            </div>
          </div>

          <div className="security-pills" style={{ marginTop: 4 }}>
            <span>🔐 {isEs ? "2FA TOTP AAL2" : "TOTP 2FA AAL2"}</span>
            <span>🛡️ {isEs ? "RLS en Servidor" : "Server-Enforced RLS"}</span>
            <span>🇵🇦 {isEs ? "Privacidad Ley 81" : "Panama Law 81 Shield"}</span>
          </div>
        </section>

        {/* Right Panel: Frosted Neo-Glass Auth Vault */}
        <section className="auth-card" style={{ maxWidth: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="sidebar-top-row" style={{ marginBottom: 14 }}>
              <span className="brand-badge">
                {mfaRequired
                  ? isEs
                    ? "VERIFICACIÓN 2FA • AAL2"
                    : "STEP-UP 2FA CHALLENGE • AAL2"
                  : isEs
                    ? "BÓVEDA DE ACCESO CIFRADA"
                    : "ENCRYPTED ACCESS VAULT"}
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

            <div className="brand" style={{ marginBottom: 16 }}>
              <h2 style={{ fontSize: 23, fontWeight: 800, color: "#fff" }}>
                {mfaRequired
                  ? isEs
                    ? "Verificación en Dos Pasos (2FA)"
                    : "Two-Factor Verification (2FA)"
                  : mode === "login"
                    ? isEs
                      ? "Inicia Sesión en ViceLink"
                      : "Sign In to ViceLink"
                    : mode === "signup"
                      ? isEs
                        ? "Crea tu Cuenta Táctica"
                        : "Create Your Tactical Account"
                      : isEs
                        ? "Recuperación de Contraseña"
                        : "Reset Your Password"}
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 4 }}>
                {mfaRequired
                  ? isEs
                    ? "Tu cuenta está protegida con TOTP 2FA. Ingresa el código de 6 dígitos de tu autenticador."
                    : "Your account is protected with TOTP 2FA. Enter the 6-digit code from your authenticator app."
                  : t(
                      lang,
                      "authSubtitle",
                      isEs
                        ? "Portal privado de miembros • Acceso seguro con cuenta verificada"
                        : "Private Member Portal • Verified account access required"
                    )}
              </p>
            </div>

            {!mfaRequired && (
              <div className="auth-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  className={`auth-tab ${mode === "login" ? "active" : ""}`}
                  onClick={() => switchMode("login")}
                >
                  {t(lang, "authLoginTab", isEs ? "Iniciar Sesión" : "Sign In")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  className={`auth-tab ${mode === "signup" ? "active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  {t(lang, "authSignupTab", isEs ? "Crear Cuenta" : "Create Account")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "reset"}
                  className={`auth-tab ${mode === "reset" ? "active" : ""}`}
                  onClick={() => switchMode("reset")}
                >
                  {t(lang, "authResetTab", isEs ? "Recuperar" : "Reset Password")}
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="auth-alert auth-alert-error" role="alert">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="auth-alert auth-alert-success" role="status">
                ✓ {successMsg}
              </div>
            )}

            {/* Step-Up 6-Digit TOTP 2FA Challenge View */}
            {mfaRequired ? (
              <form
                onSubmit={handleVerifyMfa}
                className="auth-otp-grid"
                style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}
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
                  <span>
                    {isEs
                      ? "Código de Autenticador (6 dígitos)"
                      : "Authenticator Code (6 digits)"}
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    style={{
                      background: "#090d18",
                      border: "1px solid var(--accent-cyan)",
                      color: "#ffffff",
                      padding: "13px 16px",
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
                      ? "Verificando AAL2..."
                      : "Verifying AAL2..."
                    : isEs
                      ? "🔓 Verificar y Entrar a ViceLink"
                      : "🔓 Verify & Enter ViceLink"}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => void handleCancelMfa()}
                >
                  {isEs ? "← Cancelar y Cambiar Cuenta" : "← Cancel & Switch Account"}
                </button>
              </form>
            ) : mode === "reset" && resetSentEmail ? (
              /* Anti-Enumeration Forgot Password Confirmation Card */
              <div
                className="auth-recovery-card"
                role="status"
                style={{
                  background: "rgba(9, 14, 26, 0.92)",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                  borderRadius: 14,
                  padding: "18px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 8
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>📩</span>
                  <strong style={{ fontSize: 14.5, color: "#ffffff" }}>
                    {isEs ? "Revisa tu Bandeja de Entrada" : "Check Your Email Inbox"}
                  </strong>
                </div>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55 }}>
                  {isEs ? (
                    <>
                      Si existe una cuenta para <strong>{resetSentEmail}</strong>, enviamos un
                      enlace seguro para restablecer tu contraseña. Revisa tu bandeja principal y
                      la carpeta de spam.
                    </>
                  ) : (
                    <>
                      If an account exists for <strong>{resetSentEmail}</strong>, we sent a secure
                      password reset link. Check your inbox and spam folder.
                    </>
                  )}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={busy || resendCooldown > 0}
                    onClick={() => void triggerPasswordResetEmail(resetSentEmail)}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {resendCooldown > 0
                      ? isEs
                        ? `⏳ Reenviar enlace disponible en ${resendCooldown}s`
                        : `⏳ Resend link available in ${resendCooldown}s`
                      : isEs
                        ? "🔄 Reenviar Enlace de Recuperación"
                        : "🔄 Resend Recovery Link"}
                  </button>

                  <button
                    type="button"
                    className="btn-pro"
                    onClick={() => switchMode("login")}
                  >
                    {isEs ? "← Volver a Iniciar Sesión" : "← Back to Sign In"}
                  </button>
                </div>
              </div>
            ) : (
              /* Main Login / Sign Up / Reset Request Form */
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 13 }}
              >
                {(mode === "login" || mode === "signup") && (
                  <>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => void handleGoogleOAuth()}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: 10,
                        background: "rgba(15, 23, 42, 0.92)",
                        border: "1px solid rgba(0, 229, 255, 0.38)",
                        color: "#ffffff",
                        fontSize: 13.5,
                        fontWeight: 800,
                        cursor: busy ? "not-allowed" : "pointer"
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="#EA4335"
                          d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.48 0-.72-.06-1.41-.19-2.03H12z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.3-2.56c-.91.61-2.08.98-3.33.98-2.56 0-4.73-1.73-5.5-4.05H3.09v2.64A9.997 9.997 0 0 0 12 22z"
                        />
                        <path
                          fill="#4A90E2"
                          d="M6.5 13.94A5.996 5.996 0 0 1 6.18 12c0-.67.12-1.33.32-1.94V7.42H3.09A9.997 9.997 0 0 0 2 12c0 1.61.39 3.13 1.09 4.58l3.41-2.64z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M12 6.01c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.96 3.01 14.7 2 12 2A9.997 9.997 0 0 0 3.09 7.42l3.41 2.64c.77-2.32 2.94-4.05 5.5-4.05z"
                        />
                      </svg>
                      <span>
                        {isEs ? "Continuar con Google" : "Continue with Google"}
                      </span>
                    </button>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 11,
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        letterSpacing: 0.8,
                        textTransform: "uppercase"
                      }}
                    >
                      <span style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.1)" }} />
                      <span>{isEs ? "o con correo electrónico" : "or with email"}</span>
                      <span style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.1)" }} />
                    </div>
                  </>
                )}

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
                    {t(lang, "authEmailLabel", isEs ? "Correo electrónico" : "Email address")}
                  </span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

                {mode === "signup" && (
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
                      {t(lang, "authHandleLabel", isEs ? "@Usuario (opcional)" : "@Handle (optional)")}
                    </span>
                    <input
                      type="text"
                      maxLength={25}
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      placeholder="@VicePlayer"
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
                )}

                {mode !== "reset" && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      fontSize: 12.5,
                      color: "#cbd5e1"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8
                      }}
                    >
                      <label htmlFor="auth-password-input">
                        {t(lang, "authPasswordLabel", isEs ? "Contraseña" : "Password")}
                      </label>
                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={handleForgotInline}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--accent-cyan)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            padding: 0
                          }}
                        >
                          {isEs ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
                        </button>
                      )}
                    </div>

                    <div
                      className="auth-password-wrap"
                      style={{ position: "relative", display: "flex", alignItems: "center" }}
                    >
                      <input
                        id="auth-password-input"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword
                            ? isEs
                              ? "Ocultar contraseña"
                              : "Hide password"
                            : isEs
                              ? "Mostrar contraseña"
                              : "Show password"
                        }
                        title={
                          showPassword
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
                          padding: "4px 6px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "signup" && (
                  <>
                    <div className="password-meter" aria-live="polite">
                      <div className="progress-top" style={{ fontSize: 11.5, marginBottom: 5 }}>
                        <span style={{ color: "var(--text-muted)" }}>
                          {isEs ? "Seguridad de contraseña" : "Password strength"}
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

                      {/* 4-Criterion Real-Time Password Checklist */}
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
                      <label htmlFor="auth-confirm-password-input">
                        {t(
                          lang,
                          "authConfirmPasswordLabel",
                          isEs ? "Confirmar contraseña" : "Confirm password"
                        )}
                      </label>
                      <div
                        className="auth-password-wrap"
                        style={{ position: "relative", display: "flex", alignItems: "center" }}
                      >
                        <input
                          id="auth-confirm-password-input"
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
                            padding: "4px 6px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {showConfirmPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {mode === "reset" && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.45 }}>
                    {isEs
                      ? "Te enviaremos un enlace cifrado de un solo uso que abrirá la bóveda /reset-password para configurar tu nueva contraseña."
                      : "We will send a single-use encrypted recovery link that opens the /reset-password vault to set your new password."}
                  </p>
                )}

                <button type="submit" className="btn-pro" disabled={busy} style={{ marginTop: 4 }}>
                  {busy
                    ? isEs
                      ? "Procesando..."
                      : "Processing..."
                    : mode === "login"
                      ? t(lang, "authLoginBtn", isEs ? "Entrar a ViceLink" : "Enter ViceLink")
                      : mode === "signup"
                        ? t(
                            lang,
                            "authSignupBtn",
                            isEs ? "Crear Cuenta Gratis" : "Create Free Account"
                          )
                        : t(
                            lang,
                            "authResetBtn",
                            isEs ? "Enviar Enlace de Recuperación" : "Send Reset Link"
                          )}
                </button>

                {mode === "reset" && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => switchMode("login")}
                  >
                    {isEs ? "← Volver a Iniciar Sesión" : "← Back to Sign In"}
                  </button>
                )}
              </form>
            )}
          </div>

          <div>
            <div className="security-pills">
              <span>🔒 {isEs ? "Sesión cifrada con Supabase Auth" : "Encrypted Supabase Auth"}</span>
              <span>🛡️ {isEs ? "Acceso protegido en servidor" : "Server-Enforced Access"}</span>
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
        </section>
      </div>
    </div>
  );
}
