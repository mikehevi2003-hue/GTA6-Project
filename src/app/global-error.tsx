"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#05070e", color: "#f4f7ff", fontFamily: "system-ui, sans-serif", padding: 32 }}>
        <div
          style={{
            maxWidth: 520,
            margin: "60px auto",
            padding: 28,
            borderRadius: 16,
            background: "#0d1322",
            border: "1px solid rgba(0, 229, 255, 0.35)",
            textAlign: "center"
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 800, color: "#00e5ff", letterSpacing: 1 }}>
            VICELINK EMERGENCY SHELL RECOVERY
          </span>
          <h2 style={{ marginTop: 12 }}>Hub Shell Reload Required</h2>
          <p style={{ color: "#9fb0d9", fontSize: 14 }}>
            Your account session and saved progress remain safely stored in PostgreSQL RLS.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #ff2a85, #00e5ff)",
              color: "#05070e",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            ↻ Recover Workspace
          </button>
        </div>
      </body>
    </html>
  );
}
