"use client";

import { useState, type FormEvent } from "react";
import type {
  KeywordAnalyticsSummary,
  Language,
  PatchReportItem
} from "@/types/vicelink";

export interface AdminPatchAiPanelProps {
  lang: Language;
  reports: PatchReportItem[];
  keywordAnalytics: KeywordAnalyticsSummary;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onPatchChanged: () => Promise<void>;
  onBanner: (kind: "success" | "error", text: string) => void;
}

const SAMPLE_V1003_NOTES = [
  "GTA VI Title Update v1.003 (Single-Player & World Fixes):",
  "- Fixed an exploit in the Apollo Aggregates Red Barn storage loop allowing repeated stash spawns when switching characters.",
  "- Patched True First-Person Camera glitch triggered via Touchpad / View button phone swap.",
  "- New cheat unlockable added: Spawn Sanchez Enduro Dirt Bike (UP DOWN LEFT RIGHT UP DOWN).",
  "- New collectible location added in Vice City Ocean View safe vault."
].join("\n");

export default function AdminPatchAiPanel({
  lang,
  reports,
  keywordAnalytics,
  loading,
  onRefresh,
  onPatchChanged,
  onBanner
}: AdminPatchAiPanelProps) {
  const isEs = lang === "es";

  const [patchVersion, setPatchVersion] = useState("v1.003");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rawNotes, setRawNotes] = useState("");
  const [fetchFromUrl, setFetchFromUrl] = useState(false);
  const [autoPublish, setAutoPublish] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const handleRunScan = async (e: FormEvent) => {
    e.preventDefault();
    setScanning(true);
    try {
      const res = await fetch("/api/admin/patch-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patchVersion: patchVersion.trim(),
          sourceUrl: sourceUrl.trim(),
          rawNotes: rawNotes.trim(),
          fetchFromUrl,
          autoPublish
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Patch AI scan failed.");
      }

      const report = data.report as PatchReportItem;
      onBanner(
        "success",
        report.status === "auto_published"
          ? isEs
            ? `🤖 IA detectó ${report.confidenceScore}% confianza y AUTO-PUBLICÓ ${report.appliedCount} actualizaciones para ${report.patchVersion}.`
            : `🤖 AI reached ${report.confidenceScore}% confidence and AUTO-PUBLISHED ${report.appliedCount} updates for ${report.patchVersion}.`
          : isEs
            ? `🤖 Borrador generado (${report.confidenceScore}% confianza). Revísalo abajo para publicar.`
            : `🤖 Patch draft created (${report.confidenceScore}% confidence). Review below to publish.`
      );
      setRawNotes("");
      await onRefresh();
      await onPatchChanged();
    } catch (err) {
      onBanner(
        "error",
        err instanceof Error ? err.message : "Failed to run AI patch scan."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleReportAction = async (
    reportId: string,
    action: "publish" | "rollback" | "reject"
  ) => {
    setActingId(reportId);
    try {
      const res = await fetch("/api/admin/patch-ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Failed to execute patch action.");
      }

      const labelMap = {
        publish: isEs ? "Actualización publicada al sitio en vivo." : "Patch updates published live.",
        rollback: isEs
          ? "⏪ Rollback completado en 1 clic: estado anterior restaurado."
          : "⏪ 1-Click Rollback complete: prior database state restored.",
        reject: isEs ? "Borrador descartado." : "Patch draft dismissed."
      };
      onBanner("success", labelMap[action]);
      await onRefresh();
      await onPatchChanged();
    } catch (err) {
      onBanner(
        "error",
        err instanceof Error ? err.message : "Could not update patch report."
      );
    } finally {
      setActingId(null);
    }
  };

  const maxAreaHits = Math.max(
    1,
    ...keywordAnalytics.areaBreakdown.map((item) => item.searches)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 1. Autonomous Patch AI Scanner */}
      <form className="admin-card patch-ai-card" onSubmit={handleRunScan}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <div>
            <span className="cat-tag">
              🤖 {isEs ? "AGENTE IA DE PARCHES Y ACTUALIZACIONES GTA" : "AUTONOMOUS GTA PATCH & UPDATE AI AGENT"}
            </span>
            <h3 style={{ marginTop: 4 }}>
              {isEs
                ? "Escanear Notas de Parche → Auto-Publicar Cambios en el Hub"
                : "Scan Official GTA Patch Notes → Auto-Publish Hub Updates"}
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setPatchVersion("v1.003");
                setRawNotes(SAMPLE_V1003_NOTES);
              }}
            >
              ⚡ {isEs ? "Cargar Muestra v1.003" : "Load Sample v1.003 Patch"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={loading}
              onClick={() => void onRefresh()}
            >
              {loading ? "..." : isEs ? "↻ Recargar" : "↻ Refresh"}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
          {isEs
            ? "Analiza notas de Rockstar, detecta técnicas sandbox parcheadas, nuevos trucos/pines y actualiza la barra en vivo automáticamente si la confianza ≥ 85%, guardando snapshot completo para Rollback en 1 clic."
            : "Analyzes Rockstar patch notes, matches affected Sandbox Techniques, extracts new cheats/pins, and auto-publishes when confidence ≥ 85% while saving a full 1-click Rollback snapshot."}
        </p>

        <div className="admin-grid">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
              {isEs ? "Versión del Parche" : "Patch Version Tag"}
            </label>
            <input
              type="text"
              required
              maxLength={40}
              value={patchVersion}
              onChange={(e) => setPatchVersion(e.target.value)}
              placeholder="v1.003"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
              {isEs
                ? "URL Oficial Rockstar (Opcional HTTPS)"
                : "Official Rockstar URL (Optional HTTPS)"}
            </label>
            <input
              type="url"
              maxLength={300}
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://support.rockstargames.com/..."
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
            {isEs ? "Texto de Notas del Parche / Changelog" : "Rockstar Patch Notes / Changelog Text"}
          </label>
          <textarea
            rows={5}
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder={
              isEs
                ? "Pega aquí las notas del parche o novedades de GTA..."
                : "Paste Rockstar GTA title update notes or changelog lines here..."
            }
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12
          }}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                style={{ accentColor: "var(--accent-cyan)", width: 16, height: 16 }}
              />
              <span>
                {isEs
                  ? "Auto-Publicar Alta Confianza (≥85%)"
                  : "Auto-Publish High-Confidence (≥85%)"}
              </span>
            </label>

            {sourceUrl.trim().length > 0 && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <input
                  type="checkbox"
                  checked={fetchFromUrl}
                  onChange={(e) => setFetchFromUrl(e.target.checked)}
                  style={{ accentColor: "var(--accent-pink)", width: 16, height: 16 }}
                />
                <span>{isEs ? "Leer texto desde URL Rockstar" : "Fetch excerpt from Rockstar URL"}</span>
              </label>
            )}
          </div>

          <button
            type="submit"
            className="btn-pro"
            style={{ width: "auto", padding: "10px 20px" }}
            disabled={scanning}
          >
            {scanning
              ? isEs
                ? "🤖 Analizando y Aplicando..."
                : "🤖 Analyzing & Applying..."
              : isEs
                ? "🤖 Ejecutar Escaneo IA de Parche"
                : "🤖 Run AI Patch Scan"}
          </button>
        </div>
      </form>

      {/* 2. Patch Reports & 1-Click Rollback History */}
      <div className="admin-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8
          }}
        >
          <div>
            <span className="cat-tag">
              📦 {isEs ? "HISTORIAL DE PARCHES IA Y ROLLBACK" : "AI PATCH REPORTS & 1-CLICK ROLLBACK"}
            </span>
            <h3 style={{ marginTop: 4 }}>
              {isEs ? "Cambios Detectados y Estado en Vivo" : "Detected Updates & Live Audit Trail"}
            </h3>
          </div>
          <span className="verified-badge">{reports.length} reports</span>
        </div>

        {reports.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>
            {isEs
              ? "Aún no hay escaneos de parches registrados. Usa 'Cargar Muestra v1.003' arriba para probar el motor IA."
              : "No AI patch scans logged yet. Click 'Load Sample v1.003 Patch' above to run your first scan."}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reports.map((report) => {
              const isLive = report.status === "auto_published" || report.status === "published";
              const isDraft = report.status === "draft";
              const statusLabel =
                report.status === "auto_published"
                  ? "AUTO-PUBLISHED"
                  : report.status === "published"
                    ? "PUBLISHED"
                    : report.status === "rolled_back"
                      ? "ROLLED BACK"
                      : report.status === "rejected"
                        ? "REJECTED"
                        : "DRAFT";

              return (
                <div key={report.id} className="patch-report-card">
                  <div className="patch-report-head">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong style={{ color: "#ffffff", fontSize: 15 }}>
                        {report.patchVersion}
                      </strong>
                      <span
                        className={`patch-status-pill status-${report.status}`}
                      >
                        {statusLabel}
                      </span>
                      <span className="badge-live" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99 }}>
                        {report.confidenceScore}% {isEs ? "confianza" : "confidence"}
                      </span>
                      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {report.proposedChanges.length} {isEs ? "cambios" : "changes"} ·{" "}
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {isDraft && (
                        <>
                          <button
                            type="button"
                            className="btn-pro"
                            style={{ width: "auto", padding: "6px 12px", fontSize: 12 }}
                            disabled={actingId === report.id}
                            onClick={() => void handleReportAction(report.id, "publish")}
                          >
                            ✓ {isEs ? "Aprobar y Publicar" : "Approve & Publish"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: "6px 10px", fontSize: 12 }}
                            disabled={actingId === report.id}
                            onClick={() => void handleReportAction(report.id, "reject")}
                          >
                            ✕ {isEs ? "Descartar" : "Reject"}
                          </button>
                        </>
                      )}

                      {isLive && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                            borderColor: "rgba(245, 158, 11, 0.55)",
                            color: "#fde047"
                          }}
                          disabled={actingId === report.id}
                          onClick={() => void handleReportAction(report.id, "rollback")}
                        >
                          ⏪ {actingId === report.id ? "..." : isEs ? "Rollback en 1 Clic" : "1-Click Rollback"}
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: "#e2e8f0", marginTop: 8, lineHeight: 1.45 }}>
                    {isEs ? report.aiSummaryEs : report.aiSummaryEn}
                  </p>

                  <div className="patch-diff-list">
                    {report.proposedChanges.map((chg) => (
                      <div key={chg.id} className="patch-diff-chip">
                        <small>{chg.target.toUpperCase()}</small>
                        <span>{isEs ? chg.summaryEs : chg.summaryEn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Player Keyword Search Analytics */}
      <div className="admin-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8
          }}
        >
          <div>
            <span className="cat-tag">
              🔎 {isEs ? "ANALÍTICA DEL RASTREADOR INTERNO" : "INTERNAL KEYWORD TRACKER ANALYTICS"}
            </span>
            <h3 style={{ marginTop: 4 }}>
              {isEs
                ? "Búsquedas de Jugadores y Brechas de Contenido"
                : "Trending Player Keywords & Zero-Result Content Gaps"}
            </h3>
          </div>
          <span className="verified-badge">{keywordAnalytics.totalSearches} tracked searches</span>
        </div>

        <div className="admin-grid">
          <div>
            <h4 style={{ fontSize: 13, marginBottom: 8, color: "var(--accent-cyan)" }}>
              {isEs ? "Top Palabras Clave" : "Top Searched Keywords"}
            </h4>
            {keywordAnalytics.topKeywords.length === 0 ? (
              <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                {isEs
                  ? "Aún no hay búsquedas registradas desde el rastreador lateral."
                  : "No keyword searches logged from the sidebar tracker yet."}
              </p>
            ) : (
              <div className="fence-table-wrap">
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>{isEs ? "Palabra Clave" : "Keyword"}</th>
                      <th>{isEs ? "Área" : "Area"}</th>
                      <th>{isEs ? "Consultas" : "Hits"}</th>
                      <th>{isEs ? "Prom. Resultados" : "Avg Results"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordAnalytics.topKeywords.map((row) => (
                      <tr key={`${row.area}:${row.keyword}`}>
                        <td>
                          <strong style={{ color: "#ffffff" }}>{row.keyword}</strong>
                        </td>
                        <td>
                          <span className="cat-tag">{row.area}</span>
                        </td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{row.searches}</td>
                        <td style={{ fontVariantNumeric: "tabular-nums" }}>{row.avgResults}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <h4 style={{ fontSize: 13, marginBottom: 8, color: "var(--accent-pink)" }}>
                {isEs ? "Distribución por Área del Sitio" : "Search Volume by Website Area"}
              </h4>
              {keywordAnalytics.areaBreakdown.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>—</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {keywordAnalytics.areaBreakdown.map((item) => (
                    <div key={item.area} className="analytics-area-row">
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span>{item.area}</span>
                        <strong>{item.searches}</strong>
                      </div>
                      <div className="analytics-bar-track">
                        <div
                          className="analytics-bar-fill"
                          style={{
                            width: `${Math.max(8, Math.round((item.searches / maxAreaHits) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 style={{ fontSize: 13, marginBottom: 6, color: "#fbbf24" }}>
                ⚠️ {isEs ? "Brechas Sin Resultados (Qué agregar después)" : "Zero-Result Content Gaps"}
              </h4>
              {keywordAnalytics.zeroResultGaps.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                  {isEs ? "Todas las búsquedas encontraron datos." : "All tracked keywords returned hits."}
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {keywordAnalytics.zeroResultGaps.map((gap) => (
                    <span key={`${gap.area}:${gap.keyword}`} className="cat-tag">
                      &ldquo;{gap.keyword}&rdquo; ({gap.area}) ×{gap.searches}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
