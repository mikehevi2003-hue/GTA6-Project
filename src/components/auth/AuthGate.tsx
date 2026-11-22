"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Language } from "@/types/vicelink";
import { createClient } from "@/lib/supabase/client";
import { LEGAL_POLICIES } from "@/lib/legal/policies";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

type AuthMode = "login" | "signup" | "reset";

interface PasswordStrength {
  score: number; // 0..4
  label: string;
  color: string;
}

function evaluatePasswordStrength(pw: string, lang: Language): PasswordStrength {
  const isEs = lang === "es";
  if (!pw) {
    return { score: 0, label: isEs ? "Ingresa una contraseña" : "Enter a password", color: "#475569" };
  }
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  else if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score = Math.min(score + 1, 3);

  if (score <= 1) {
    return { score: 1, label: isEs ? "Débil (mín. 8 caracteres)" : "Weak (min 8 chars)", color: "#f43f5e" };
  }
  if (score === 2) {
    return { score: 2, label: isEs ? "Media" : "Fair", color: "#f59e0b" };
  }
  if (score === 3) {
    return { score: 3, label: isEs ? "Buena" : "Good", color: "#00e5ff" };
  }
  return { score: 4, label: isEs ? "Fuerte" : "Strong", color: "#22c55e" };
}

export default function AuthGate() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [handle, setHandle] = useState("");
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

  const handleLangChange = (next: Language) => {
    setLang(next);
    try {
      window.localStorage.setItem("vicelink_lang", next);
    } catch {
      // Ignore storage write errors
    }
  };

  const strength = useMemo(() => evaluatePasswordStrength(password, lang), [password, lang]);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg(isEs ? "Ingresa un correo electrónico válido." : "Please enter a valid email address.");
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
            error.message ||
              (isEs ? "Credenciales inválidas. Verifica tu correo y contraseña." : "Invalid credentials. Check your email and password.")
          );
          setBusy(false);
          return;
        }
        router.push("/");
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
          router.push("/");
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

      // mode === "reset"
      const redirectTo = `${window.location.origin}/api/auth/callback`;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo
      });
      if (error) {
        setErrorMsg(error.message);
        setBusy(false);
        return;
      }
      setSuccessMsg(
        isEs
          ? "Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña."
          : "If an account exists for that email, a password reset link has been sent."
      );
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
      <div className="auth-card">
        <div className="sidebar-top-row" style={{ marginBottom: 14 }}>
          <span className="brand-badge">
            {t(lang, "badge", isEs ? "HUB NO OFICIAL DE FANS" : "UNOFFICIAL FAN HUB")}
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
            {t(
              lang,
              "authSubtitle",
              isEs
                ? "Portal privado de miembros • Acceso seguro con cuenta verificada"
                : "Private Member Portal • Verified account access required"
            )}
          </p>
        </div>

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
            {t(lang, "authResetTab", isEs ? "Recuperar" : "Reset")}
          </button>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
            <span>{t(lang, "authEmailLabel", isEs ? "Correo electrónico" : "Email address")}</span>
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
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
              <span>{t(lang, "authHandleLabel", isEs ? "@Usuario (opcional)" : "@Handle (optional)")}</span>
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
            <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
              <span>{t(lang, "authPasswordLabel", isEs ? "Contraseña" : "Password")}</span>
              <input
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          {mode === "signup" && (
            <>
              <div className="password-meter" aria-live="polite">
                <div className="progress-top" style={{ fontSize: 11.5, marginBottom: 5 }}>
                  <span style={{ color: "var(--text-muted)" }}>
                    {isEs ? "Seguridad de contraseña" : "Password strength"}
                  </span>
                  <strong style={{ color: strength.color }}>{strength.label}</strong>
                </div>
                <div className="progress-track" style={{ marginTop: 0 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                      background: strength.color
                    }}
                  />
                </div>
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, color: "#cbd5e1" }}>
                <span>{t(lang, "authConfirmPasswordLabel", isEs ? "Confirmar contraseña" : "Confirm password")}</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
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
            </>
          )}

          <button type="submit" className="btn-pro" disabled={busy} style={{ marginTop: 4 }}>
            {busy
              ? isEs
                ? "Procesando..."
                : "Processing..."
              : mode === "login"
                ? t(lang, "authLoginBtn", isEs ? "Entrar a ViceLink" : "Enter ViceLink")
                : mode === "signup"
                  ? t(lang, "authSignupBtn", isEs ? "Crear Cuenta Gratis" : "Create Free Account")
                  : t(lang, "authResetBtn", isEs ? "Enviar Enlace de Recuperación" : "Send Reset Link")}
          </button>
        </form>

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
    </div>
  );
}
