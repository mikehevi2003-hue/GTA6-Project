"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Emit isolated runtime diagnostic event when Sentry browser instrumentation is active
    if (process.env.NODE_ENV === "development") {
      console.error("ViceLink isolated route error:", error?.digest || error?.message);
    }
  }, [error]);

  return (
    <main className="auth-reset-shell">
      <div className="paywall-box" style={{ maxWidth: 520, margin: "40px auto" }}>
        <span className="brand-badge">🛡️ VICELINK FAULT ISOLATION</span>
        <h2 style={{ marginTop: 14 }}>Temporary View Recovery</h2>
        <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
          This view hit an unexpected runtime condition, while the rest of ViceLink and your Supabase
          account data remain isolated and intact.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18, flexWrap: "wrap" }}>
          <button type="button" className="btn-pro" style={{ width: "auto" }} onClick={() => reset()}>
            ↻ Reload View
          </button>
          <Link href="/" className="btn-secondary" style={{ textDecoration: "none", padding: "9px 14px" }}>
            ← Back to Hub
          </Link>
        </div>
      </div>
    </main>
  );
}
