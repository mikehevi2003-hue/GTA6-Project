"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Language } from "@/types/vicelink";
import { LEGAL_POLICIES } from "@/lib/legal/policies";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export type LegalTab = "terms" | "privacy" | "refunds";

export interface LegalPageShellProps {
  active: LegalTab;
}

const TABS: { id: LegalTab; href: string; en: string; es: string }[] = [
  { id: "terms", href: "/terms", en: "Terms of Service", es: "Términos de Servicio" },
  { id: "privacy", href: "/privacy", en: "Privacy Policy (Law 81)", es: "Privacidad (Ley 81)" },
  { id: "refunds", href: "/refunds", en: "Refund Policy", es: "Política de Reembolso" }
];

export default function LegalPageShell({ active }: LegalPageShellProps) {
  const [lang, setLang] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("vicelink_lang");
      if (stored === "en" || stored === "es") {
        setLang(stored);
      }
    } catch {
      // Ignore storage access errors in restricted browsers
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

  const policy = LEGAL_POLICIES[active];
  const isEs = lang === "es";

  return (
    <div className="legal-shell">
      <div className="legal-card">
        <div className="sidebar-top-row" style={{ marginBottom: 16 }}>
          <div>
            <span className="brand-badge">
              {t(lang, "badge", isEs ? "HUB NO OFICIAL DE FANS" : "UNOFFICIAL FAN HUB")}
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 8, letterSpacing: "1.2px" }}>
              VICE<span style={{ color: "var(--accent-pink)" }}>LINK</span>
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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
            <Link href="/login" className="btn-secondary" style={{ textDecoration: "none", padding: "7px 12px", fontSize: 12.5 }}>
              {isEs ? "← Acceso" : "← Sign In"}
            </Link>
            <Link href="/" className="btn-secondary" style={{ textDecoration: "none", padding: "7px 12px", fontSize: 12.5 }}>
              {isEs ? "Ir al Hub" : "Open Hub"}
            </Link>
          </div>
        </div>

        <nav className="legal-tabs" aria-label={isEs ? "Documentos legales" : "Legal documents"}>
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`auth-tab ${active === tab.id ? "active" : ""}`}
              style={{ textDecoration: "none", textAlign: "center" }}
            >
              {isEs ? tab.es : tab.en}
            </Link>
          ))}
        </nav>

        <article className="legal-body">
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 14, color: "var(--text-main)" }}>
            {tField(policy.title, lang)}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {policy.body.map((paragraph, idx) => (
              <p
                key={idx}
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "#cbd5e1"
                }}
              >
                {tField(paragraph, lang)}
              </p>
            ))}
          </div>

          <div
            className="unlock-pill"
            style={{
              marginTop: 22,
              borderLeftColor: "var(--accent-cyan)",
              color: "#e2e8f0"
            }}
          >
            <strong>{isEs ? "Aviso Legal: " : "Unofficial Fan Disclaimer: "}</strong>
            {tField(LEGAL_POLICIES.disclaimer, lang)}
          </div>
        </article>

        <footer className="auth-footer" style={{ marginTop: 22 }}>
          <span>ViceLink // Leonida Companion Hub • Panamá</span>
        </footer>
      </div>
    </div>
  );
}
