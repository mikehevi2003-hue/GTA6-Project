import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createClient,
  ensureProfileAndProgress,
  getAuthenticatorAssuranceLevel,
  getAuthedUser
} from "@/lib/supabase/server";
import AdminView from "@/components/views/AdminView";
import type { Language } from "@/types/vicelink";

export const dynamic = "force-dynamic";

export default async function DedicatedAdminPage() {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);

  if (!user) {
    redirect("/login");
  }

  const [{ profile }, aal] = await Promise.all([
    ensureProfileAndProgress(supabase, user),
    getAuthenticatorAssuranceLevel(supabase)
  ]);

  const lang: Language = profile.preferred_lang === "es" ? "es" : "en";
  const isEs = lang === "es";

  if (!profile.is_admin) {
    return (
      <main
        className="auth-shell"
        style={{
          minHeight: "100vh",
          background: "#05070e",
          padding: "32px 16px"
        }}
      >
        <div
          className="auth-card"
          style={{
            maxWidth: 520,
            textAlign: "center",
            border: "1px solid rgba(255, 42, 133, 0.55)",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7)"
          }}
        >
          <span className="status-patched" style={{ display: "inline-block" }}>
            403 RESTRICTED • CO-FOUNDER ACCESS ONLY
          </span>
          <h1 style={{ marginTop: 14, fontSize: 22, fontWeight: 900, color: "#ffffff" }}>
            🛡️ {isEs ? "Acceso Restringido — Solo Co-Fundadores" : "403 Restricted — Co-Founder Access Only"}
          </h1>
          <p
            style={{
              marginTop: 10,
              marginBottom: 20,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "var(--text-muted)"
            }}
          >
            {isEs
              ? "Esta consola dedicada (/admin) requiere privilegios de Co-Fundador verificados en el servidor y autenticación 2FA obligatoria (AAL2)."
              : "This dedicated /admin command console is strictly restricted to verified Co-Founders with server-enforced RBAC and mandatory 2FA (AAL2)."}
          </p>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link
              href="/"
              className="btn-pro"
              style={{
                width: "auto",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                padding: "10px 18px"
              }}
            >
              ← {isEs ? "Volver a ViceLink Hub" : "Return to ViceLink Hub"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAal2 = aal === "aal2";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top right, rgba(255, 42, 133, 0.12), #05070e 45%)",
        color: "#f8fafc"
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          backdropFilter: "blur(16px)",
          background: "rgba(5, 7, 14, 0.88)",
          borderBottom: "1px solid rgba(0, 229, 255, 0.22)",
          padding: "12px 20px"
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/"
              className="btn-secondary"
              style={{
                textDecoration: "none",
                fontSize: 12.5,
                padding: "7px 12px",
                fontWeight: 700
              }}
            >
              ← {isEs ? "Volver al Hub" : "Back to Hub"}
            </Link>
            <span className="brand-badge">VICELINK // DEDICATED /ADMIN</span>
            {isAal2 ? (
              <span
                className="implemented-badge"
                style={{
                  background: "rgba(34, 197, 94, 0.18)",
                  border: "1px solid rgba(34, 197, 94, 0.55)",
                  color: "#4ade80"
                }}
              >
                🔒 AAL2 VERIFIED
              </span>
            ) : (
              <span
                className="status-patched"
                style={{
                  background: "rgba(245, 158, 11, 0.16)",
                  border: "1px solid rgba(250, 204, 21, 0.55)",
                  color: "#fde047"
                }}
              >
                🔒 MANDATORY CO-FOUNDER 2FA (AAL2) GATE
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{profile.email}</span>
            <Link
              href="/?setup2fa=1"
              className="btn-pro"
              style={{
                width: "auto",
                textDecoration: "none",
                fontSize: 12,
                padding: "7px 13px"
              }}
            >
              🔐 {isEs ? "Configurar Código QR 2FA" : "Set Up 2FA QR Code"}
            </Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "22px 20px 56px" }}>
        {!isAal2 && (
          <div
            role="status"
            style={{
              marginBottom: 18,
              padding: "14px 18px",
              borderRadius: 14,
              background:
                "linear-gradient(135deg, rgba(255, 42, 133, 0.16), rgba(245, 158, 11, 0.14))",
              border: "1px solid rgba(250, 204, 21, 0.55)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12
            }}
          >
            <div>
              <strong style={{ color: "#fde047", fontSize: 13.5, display: "block" }}>
                🔒 MANDATORY CO-FOUNDER 2FA (AAL2) GATE — SEC-05 ENFORCED
              </strong>
              <span style={{ color: "#e2e8f0", fontSize: 12.5 }}>
                {isEs
                  ? "Sesión actual en AAL1. Verifica tu código TOTP de 6 dígitos abajo o configura tu código QR 2FA para desbloquear la telemetría y las rutas /api/admin/*."
                  : "Current session is AAL1. Verify your 6-digit TOTP code below or enroll your 2FA Authenticator QR code to unlock telemetry and /api/admin/* endpoints."}
              </span>
            </div>
            <Link
              href="/?setup2fa=1"
              className="btn-secondary"
              style={{ textDecoration: "none", fontSize: 12, padding: "7px 12px" }}
            >
              🔐 /?setup2fa=1
            </Link>
          </div>
        )}

        <AdminView
          lang={lang}
          isAdmin={profile.is_admin}
          userEmail={profile.email}
          initialAal={aal}
          requireAal2Notice={!isAal2}
        />
      </main>
    </div>
  );
}
