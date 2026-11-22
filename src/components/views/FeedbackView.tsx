"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  CommunitySubmission,
  Language,
  SubmissionStatus,
  SubmissionType,
  UserTier
} from "@/types/vicelink";
import { REGIONS } from "@/lib/constants/forum";

export type FeedbackViewProps = {
  lang: Language;
  userHandle: string;
  userTier: UserTier;
};

const SUBMISSION_TYPES: {
  value: SubmissionType;
  icon: string;
  en: string;
  es: string;
  placeholderEn: string;
  placeholderEs: string;
}[] = [
  {
    value: "money_spot",
    icon: "💰",
    en: "Money Spot",
    es: "Zona de Dinero",
    placeholderEn: "e.g., Vice City • Ocean Beach ATM Alley",
    placeholderEs: "ej., Vice City • Callejón ATM Ocean Beach"
  },
  {
    value: "glitch_report",
    icon: "⚡",
    en: "Glitch Report",
    es: "Reporte de Glitch",
    placeholderEn: "e.g., Patch 01.002.001 • Money / Physics",
    placeholderEs: "ej., Parche 01.002.001 • Dinero / Física"
  },
  {
    value: "easter_egg",
    icon: "🥚",
    en: "Easter Egg",
    es: "Easter Egg",
    placeholderEn: "e.g., Mount Kalaga • 2:00 AM",
    placeholderEs: "ej., Mount Kalaga • 2:00 AM"
  },
  {
    value: "cheat_combo",
    icon: "🎮",
    en: "Cheat Combo",
    es: "Combinación de Truco",
    placeholderEn: "e.g., Vehicles • PS5 / Xbox D-Pad",
    placeholderEs: "ej., Vehículos • D-Pad PS5 / Xbox"
  },
  {
    value: "site_feedback",
    icon: "💡",
    en: "Site Feedback & Feature Idea",
    es: "Sugerencia para ViceLink",
    placeholderEn: "e.g., Map Filters, Mobile UX, New Tracker",
    placeholderEs: "ej., Filtros de Mapa, Móvil, Nuevo Tracker"
  }
];

const XSS_PATTERN =
  /<\s*\/?\s*(script|iframe|object|embed|svg|style|link|meta|img|form)\b|javascript\s*:|on[a-z]{2,}\s*=/i;

function hasUnsafeMarkup(input: string): boolean {
  return XSS_PATTERN.test(input);
}

function formatDate(iso: string, isEs: boolean): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(isEs ? "es-PA" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function FeedbackView({ lang, userHandle, userTier }: FeedbackViewProps) {
  const isEs = lang === "es";

  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Submission composer state
  const [submissionType, setSubmissionType] = useState<SubmissionType>("money_spot");
  const [regionOrCategory, setRegionOrCategory] = useState("");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Roadmap feed filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | SubmissionType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | SubmissionStatus | "MINE">("ALL");
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/submissions", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs
              ? "No se pudo cargar el tablero de aportes."
              : "Could not load community intel feed.")
        );
      }
      const list = Array.isArray(data)
        ? (data as CommunitySubmission[])
        : Array.isArray(data.submissions)
          ? (data.submissions as CommunitySubmission[])
          : [];
      setSubmissions(list);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al cargar envíos de la comunidad."
            : "Error loading community submissions."
      );
    } finally {
      setLoading(false);
    }
  }, [isEs]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  const activeTypeMeta =
    SUBMISSION_TYPES.find((item) => item.value === submissionType) ?? SUBMISSION_TYPES[0];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanRegion = regionOrCategory.trim();
    const cleanTitle = title.trim();
    const cleanDetails = details.trim();

    if (cleanTitle.length < 2 || cleanTitle.length > 140) {
      setFormError(
        isEs
          ? "El título debe tener entre 2 y 140 caracteres."
          : "Title must be between 2 and 140 characters."
      );
      return;
    }

    if (cleanDetails.length < 5 || cleanDetails.length > 2000) {
      setFormError(
        isEs
          ? "Los detalles deben tener entre 5 y 2,000 caracteres."
          : "Details must be between 5 and 2,000 characters."
      );
      return;
    }

    if (
      hasUnsafeMarkup(cleanTitle) ||
      hasUnsafeMarkup(cleanDetails) ||
      hasUnsafeMarkup(cleanRegion)
    ) {
      setFormError(
        isEs
          ? "Entrada rechazada por seguridad: no se permiten etiquetas HTML, scripts ni manejadores de eventos."
          : "Blocked for security: raw HTML tags, scripts, or event handlers are not allowed."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionType,
          regionOrCategory: cleanRegion,
          title: cleanTitle,
          details: cleanDetails
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (res.status === 429
              ? isEs
                ? "Demasiados envíos seguidos. Espera un momento antes de enviar otro."
                : "Rate limit reached. Please wait a moment before submitting again."
              : isEs
                ? "No se pudo enviar tu reporte. Revisa los campos e inténtalo de nuevo."
                : "Could not submit your intel. Please check your input and try again.")
        );
      }

      const created = (data.submission || data) as CommunitySubmission;
      if (created && created.id) {
        setSubmissions((prev) => [
          { ...created, isMine: true },
          ...prev.filter((item) => item.id !== created.id)
        ]);
      } else {
        void loadSubmissions();
      }

      setRegionOrCategory("");
      setTitle("");
      setDetails("");
      setFormSuccess(
        isEs
          ? "✓ ¡Intel enviado! Tu reporte está en cola de revisión del equipo ViceLink y ya aparece abajo en tus envíos."
          : "✓ Intel submitted! Your report is queued for ViceLink review and is visible below in your submissions."
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo registrar tu envío."
            : "Failed to submit intel."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (submissionId: string) => {
    setVoteError(null);
    setVotingId(submissionId);
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}/vote`, {
        method: "POST"
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            (isEs ? "No se pudo registrar tu voto." : "Could not record your upvote.")
        );
      }
      setSubmissions((prev) =>
        prev.map((item) =>
          item.id === submissionId
            ? {
                ...item,
                votes: typeof data.votes === "number" ? data.votes : item.votes,
                upvoted: typeof data.upvoted === "boolean" ? data.upvoted : !item.upvoted
              }
            : item
        )
      );
    } catch (err) {
      setVoteError(
        err instanceof Error
          ? err.message
          : isEs
            ? "Error al votar."
            : "Could not update vote."
      );
    } finally {
      setVotingId(null);
    }
  };

  const counts = useMemo(() => {
    let approved = 0;
    let implemented = 0;
    let mine = 0;
    for (const s of submissions) {
      if (s.status === "approved") approved += 1;
      if (s.status === "implemented") implemented += 1;
      if (s.isMine) mine += 1;
    }
    return { total: submissions.length, approved, implemented, mine };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return submissions
      .filter((item) => {
        const matchType = typeFilter === "ALL" || item.submissionType === typeFilter;
        const matchStatus =
          statusFilter === "ALL"
            ? true
            : statusFilter === "MINE"
              ? Boolean(item.isMine)
              : item.status === statusFilter;
        const matchQuery =
          !q ||
          item.title.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q) ||
          item.regionOrCategory.toLowerCase().includes(q) ||
          item.authorHandle.toLowerCase().includes(q);
        return matchType && matchStatus && matchQuery;
      })
      .sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [submissions, search, typeFilter, statusFilter]);

  const getTypeBadge = (type: SubmissionType) => {
    const meta = SUBMISSION_TYPES.find((item) => item.value === type);
    if (!meta) return type;
    return `${meta.icon} ${isEs ? meta.es : meta.en}`;
  };

  const renderStatusBadge = (status: SubmissionStatus) => {
    if (status === "approved") {
      return (
        <span className="verified-badge">
          {isEs ? "✓ Verificado por ViceLink" : "✓ Verified by ViceLink"}
        </span>
      );
    }
    if (status === "implemented") {
      return (
        <span className="implemented-badge">
          {isEs ? "🚀 Implementado" : "🚀 Implemented"}
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="status-patched">
          {isEs ? "✕ Rechazado" : "✕ Declined"}
        </span>
      );
    }
    return (
      <span className="submission-badge">
        {isEs ? "⏳ En Revisión" : "⏳ Pending Review"}
      </span>
    );
  };

  return (
    <section id="view-feedback" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {isEs
              ? "Enviar Intel de Leonida y Roadmap Comunitario"
              : "Submit Leonida Intel & Community Roadmap"}
          </h2>
          <p>
            {isEs
              ? "Comparte nuevas zonas de dinero, glitches, Easter eggs, combinaciones de trucos o ideas para ViceLink y vota por los descubrimientos aprobados."
              : "Share newly discovered money spots, glitches, Easter eggs, cracked cheat combos, or ViceLink feature ideas — and upvote verified community discoveries."}
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => void loadSubmissions()}
          disabled={loading}
        >
          {loading
            ? isEs
              ? "Actualizando..."
              : "Refreshing..."
            : isEs
              ? "↻ Actualizar Tablero"
              : "↻ Refresh Feed"}
        </button>
      </header>

      {/* Submission Composer Card */}
      <form onSubmit={handleSubmit} className="theory-composer" noValidate>
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
              {isEs ? "NUEVO ENVÍO DE LA COMUNIDAD" : "NEW COMMUNITY SUBMISSION"}
            </span>
            <h3 style={{ fontSize: 17, marginTop: 4 }}>
              💡{" "}
              {isEs
                ? "Reportar Descubrimiento o Sugerir Mejora"
                : "Submit Intel, Glitch Report, or Feature Idea"}
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{ color: "var(--text-muted)" }}>
              {isEs ? "Enviando como:" : "Submitting as:"}
            </span>
            <strong style={{ color: "var(--accent-cyan)" }}>{userHandle}</strong>
            {userTier === "kingpin" && <span className="kingpin-badge">👑 KINGPIN</span>}
          </div>
        </div>

        {formError && (
          <div className="auth-alert auth-alert-error" role="alert">
            ⚠️ {formError}
          </div>
        )}

        {formSuccess && (
          <div className="auth-alert auth-alert-success" role="status">
            {formSuccess}
          </div>
        )}

        <div className="composer-row">
          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 5 }}>
            <label htmlFor="sub-type" style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}>
              {isEs ? "Categoría del Aporte" : "Submission Category"}
            </label>
            <select
              id="sub-type"
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as SubmissionType)}
            >
              {SUBMISSION_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.icon} {isEs ? item.es : item.en}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column", gap: 5 }}>
            <label
              htmlFor="sub-region"
              style={{ fontSize: 11.5, fontWeight: 700, color: "#cbd5e1" }}
            >
              {isEs ? "Región o Sección (Opcional)" : "Region or Category (Optional)"}
            </label>
            <input
              id="sub-region"
              type="text"
              maxLength={80}
              list="vicelink-region-suggestions"
              value={regionOrCategory}
              onChange={(e) => setRegionOrCategory(e.target.value)}
              placeholder={isEs ? activeTypeMeta.placeholderEs : activeTypeMeta.placeholderEn}
            />
            <datalist id="vicelink-region-suggestions">
              {REGIONS.map((reg) => (
                <option key={reg} value={reg} />
              ))}
            </datalist>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
            <label htmlFor="sub-title" style={{ fontWeight: 700, color: "#cbd5e1" }}>
              {isEs ? "Título del Descubrimiento / Sugerencia" : "Headline / Title"}
            </label>
            <span style={{ color: "var(--text-muted)" }}>{title.length} / 140</span>
          </div>
          <input
            id="sub-title"
            type="text"
            maxLength={140}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              isEs
                ? "ej., Nuevo cajero ATM hackeable detrás del hotel en Ocean Beach"
                : "e.g., New hackable ATM behind the Ocean Beach hotel alley"
            }
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
            <label htmlFor="sub-details" style={{ fontWeight: 700, color: "#cbd5e1" }}>
              {isEs
                ? "Detalles, Pasos Exactos o Coordenadas"
                : "Details, Exact Steps, or Coordinates"}
            </label>
            <span style={{ color: "var(--text-muted)" }}>{details.length} / 2000</span>
          </div>
          <textarea
            id="sub-details"
            rows={4}
            maxLength={2000}
            required
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              isEs
                ? "Incluye pasos verificables, parche actual (ej. 01.002.001), botones o cómo reproducirlo..."
                : "Include reproducible steps, patch version (e.g., 01.002.001), landmarks, or D-Pad buttons..."
            }
          />
        </div>

        <div className="composer-actions" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--text-muted)", marginRight: "auto" }}>
            {isEs
              ? "🛡️ Todos los aportes pasan por revisión anti-spam y verificación del equipo ViceLink."
              : "🛡️ All submissions are reviewed by the ViceLink team before appearing publicly."}
          </span>
          <button
            type="submit"
            className="btn-pro"
            style={{ width: "auto" }}
            disabled={submitting}
          >
            {submitting
              ? isEs
                ? "Enviando..."
                : "Submitting..."
              : isEs
                ? "Enviar a ViceLink ➤"
                : "Submit to ViceLink ➤"}
          </button>
        </div>
      </form>

      {/* Community Roadmap & Approved Player Discoveries Header */}
      <div style={{ marginTop: 22, marginBottom: 14 }}>
        <h3 style={{ fontSize: 19, fontWeight: 800 }}>
          🚀{" "}
          {isEs
            ? "Roadmap Comunitario y Descubrimientos Verificados"
            : "Community Roadmap & Approved Player Discoveries"}
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
          {isEs
            ? `${counts.approved} verificados • ${counts.implemented} implementados • ${counts.mine} de tus envíos`
            : `${counts.approved} verified • ${counts.implemented} implemented • ${counts.mine} of your submissions`}
        </p>
      </div>

      {/* Status Filter Chips */}
      <div className="map-layer-chips">
        <button
          type="button"
          className={`layer-chip ${statusFilter === "ALL" ? "active" : ""}`}
          onClick={() => setStatusFilter("ALL")}
        >
          {isEs ? `📋 Todo (${counts.total})` : `📋 All (${counts.total})`}
        </button>
        <button
          type="button"
          className={`layer-chip ${statusFilter === "approved" ? "active" : ""}`}
          onClick={() => setStatusFilter("approved")}
        >
          {isEs ? `✓ Verificados (${counts.approved})` : `✓ Verified (${counts.approved})`}
        </button>
        <button
          type="button"
          className={`layer-chip ${statusFilter === "implemented" ? "active" : ""}`}
          onClick={() => setStatusFilter("implemented")}
        >
          {isEs
            ? `🚀 Implementados (${counts.implemented})`
            : `🚀 Implemented (${counts.implemented})`}
        </button>
        <button
          type="button"
          className={`layer-chip ${statusFilter === "MINE" ? "active" : ""}`}
          onClick={() => setStatusFilter("MINE")}
        >
          {isEs ? `👤 Mis Envíos (${counts.mine})` : `👤 My Submissions (${counts.mine})`}
        </button>
      </div>

      {/* Search + Category Filter */}
      <div className="controls-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isEs
              ? "Buscar descubrimientos, glitches, regiones o @usuarios..."
              : "Search discoveries, glitches, regions, or @handles..."
          }
          aria-label={isEs ? "Buscar envíos" : "Search submissions"}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "ALL" | SubmissionType)}
          aria-label={isEs ? "Filtrar por tipo" : "Filter by submission type"}
        >
          <option value="ALL">
            {isEs ? "Todas las Categorías" : "All Submission Types"}
          </option>
          {SUBMISSION_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.icon} {isEs ? item.es : item.en}
            </option>
          ))}
        </select>
      </div>

      {voteError && (
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 14 }}>
          ⚠️ {voteError}
        </div>
      )}

      {loadError ? (
        <div className="auth-alert auth-alert-error" role="alert">
          ⚠️ {loadError}
        </div>
      ) : loading ? (
        <div className="cheat-card" style={{ textAlign: "center", padding: 28 }}>
          <p>{isEs ? "Cargando roadmap y descubrimientos..." : "Loading community roadmap..."}</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="paywall-box" style={{ maxWidth: 500 }}>
          <h3>
            {isEs
              ? "No hay envíos con estos filtros"
              : "No Submissions Match Your Filters"}
          </h3>
          <p>
            {isEs
              ? "Sé el primero en compartir un descubrimiento de Leonida o cambia los filtros de arriba."
              : "Be the first to share a Leonida discovery or clear the active filters above."}
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setSearch("");
              setTypeFilter("ALL");
              setStatusFilter("ALL");
            }}
          >
            {isEs ? "Mostrar Todo" : "Show All"}
          </button>
        </div>
      ) : (
        <div className="forum-feed">
          {filteredSubmissions.map((sub) => (
            <article key={sub.id} className="roadmap-card">
              <div className="vote-box">
                <button
                  type="button"
                  className={`vote-btn ${sub.upvoted ? "voted" : ""}`}
                  disabled={votingId === sub.id}
                  onClick={() => void handleVote(sub.id)}
                  aria-label={isEs ? "Votar a favor" : "Upvote submission"}
                  title={isEs ? "Votar a favor" : "Upvote"}
                >
                  ▲
                </button>
                <span className="vote-count">{sub.votes}</span>
              </div>

              <div className="theory-body" style={{ minWidth: 0 }}>
                <div className="theory-meta">
                  {renderStatusBadge(sub.status)}
                  <span className="submission-badge">{getTypeBadge(sub.submissionType)}</span>
                  {sub.regionOrCategory && (
                    <span className="coord-pill">📍 {sub.regionOrCategory}</span>
                  )}
                  {sub.isMine && (
                    <span className="cat-tag">
                      • {isEs ? "Tu envío" : "Your submission"}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: 16.5, fontWeight: 800, marginBottom: 6 }}>
                  {sub.title}
                </h4>
                <p
                  style={{
                    fontSize: 13.5,
                    color: "#cbd5e1",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {sub.details}
                </p>

                {sub.adminNotes && (
                  <div className="unlock-pill" style={{ marginTop: 10 }}>
                    <strong>{isEs ? "Nota de ViceLink:" : "ViceLink Team Note:"}</strong>{" "}
                    {sub.adminNotes}
                  </div>
                )}

                <div className="theory-footer" style={{ flexWrap: "wrap", gap: 8 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {isEs ? "Por" : "By"}{" "}
                    <strong style={{ color: "var(--accent-cyan)" }}>{sub.authorHandle}</strong>
                    {sub.authorTier === "kingpin" && (
                      <span className="kingpin-badge">👑 KINGPIN</span>
                    )}
                  </span>
                  <span>{formatDate(sub.createdAt, isEs)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default FeedbackView;
