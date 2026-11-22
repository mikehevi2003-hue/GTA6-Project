"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Language, TheoryPost, UserTier } from "@/types/vicelink";
import { ANIMATED_GIFS, REACTION_EMOJIS, THEORY_TAGS } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export type ForumActionPayload =
  | { action: "vote" }
  | { action: "react"; emoji: string }
  | { action: "comment"; text: string; gifId?: string }
  | { action: "likeComment"; commentId: string };

export interface ForumViewProps {
  lang: Language;
  userHandle: string;
  userTier: UserTier;
  theories: TheoryPost[];
  onUpdateHandle: (newHandle: string) => Promise<void>;
  onCreateTheory: (payload: {
    title: string;
    tag: string;
    coords: string;
    body: string;
  }) => Promise<void>;
  onTheoryAction: (theoryId: string, payload: ForumActionPayload) => Promise<void>;
}

export default function ForumView({
  lang,
  userHandle,
  userTier,
  theories,
  onUpdateHandle,
  onCreateTheory,
  onTheoryAction
}: ForumViewProps) {
  const isEs = lang === "es";

  const [handleInput, setHandleInput] = useState(userHandle);
  const [savingHandle, setSavingHandle] = useState(false);

  useEffect(() => {
    setHandleInput(userHandle);
  }, [userHandle]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState<string>(THEORY_TAGS[0]?.value ?? "Verified Easter Egg");
  const [coords, setCoords] = useState("");
  const [body, setBody] = useState("");
  const [submittingTheory, setSubmittingTheory] = useState(false);

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");

  const [openGifTray, setOpenGifTray] = useState<Record<string, boolean>>({});
  const [selectedGif, setSelectedGif] = useState<Record<string, string>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [busyThreadId, setBusyThreadId] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const filteredTheories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = theories.filter((item) => {
      const titleText = tField(item.title, lang).toLowerCase();
      const bodyText = tField(item.body, lang).toLowerCase();
      const matchQ =
        !q ||
        titleText.includes(q) ||
        bodyText.includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.coords.toLowerCase().includes(q);
      const matchTag = tagFilter === "ALL" || item.tag === tagFilter;
      return matchQ && matchTag;
    });

    return [...list].sort((a, b) =>
      sortBy === "top" ? b.votes - a.votes : b.timestamp - a.timestamp
    );
  }, [theories, search, tagFilter, sortBy, lang]);

  const handleSaveHandle = async () => {
    const cleaned = handleInput.trim();
    if (!cleaned) return;
    setSavingHandle(true);
    setFeedbackError(null);
    try {
      await onUpdateHandle(cleaned);
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : isEs ? "No se pudo actualizar @usuario." : "Failed to update handle.");
    } finally {
      setSavingHandle(false);
    }
  };

  const handlePublishTheory = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmittingTheory(true);
    setFeedbackError(null);
    try {
      await onCreateTheory({
        title: title.trim(),
        tag,
        coords: coords.trim(),
        body: body.trim()
      });
      setTitle("");
      setCoords("");
      setBody("");
      setComposerOpen(false);
    } catch (err) {
      setFeedbackError(
        err instanceof Error
          ? err.message
          : isEs
            ? "No se pudo publicar la teoría."
            : "Could not publish theory."
      );
    } finally {
      setSubmittingTheory(false);
    }
  };

  const runAction = async (theoryId: string, payload: ForumActionPayload) => {
    setFeedbackError(null);
    setBusyThreadId(theoryId);
    try {
      await onTheoryAction(theoryId, payload);
    } catch (err) {
      setFeedbackError(
        err instanceof Error
          ? err.message
          : isEs
            ? "Acción rechazada. Intenta de nuevo en unos segundos."
            : "Action could not be completed. Please try again shortly."
      );
    } finally {
      setBusyThreadId(null);
    }
  };

  const handleCommentSubmit = async (e: FormEvent, theoryId: string) => {
    e.preventDefault();
    const text = (commentDrafts[theoryId] || "").trim();
    const gifId = selectedGif[theoryId] || "";
    if (!text && !gifId) return;

    await runAction(theoryId, {
      action: "comment",
      text,
      gifId: gifId || undefined
    });

    setCommentDrafts((prev) => ({ ...prev, [theoryId]: "" }));
    setSelectedGif((prev) => ({ ...prev, [theoryId]: "" }));
    setOpenGifTray((prev) => ({ ...prev, [theoryId]: false }));
  };

  const activeInitial = userHandle.replace(/^@/, "").charAt(0).toUpperCase() || "V";

  return (
    <section id="view-forum" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "forumTitle",
              isEs
                ? "Foro de Easter Eggs y Conspiraciones de Leonida"
                : "Leonida Easter Eggs & Conspiracy Board"
            )}
          </h2>
          <p>
            {isEs
              ? `${theories.length} secretos y teorías • Comentarios estilo TikTok con @usuario, ❤️ likes y GIFs animados.`
              : `${theories.length} secrets & theories • TikTok-style @username comments, ❤️ likes & animated GIF reactions.`}
          </p>
        </div>

        <button
          type="button"
          className="btn-pro"
          style={{ width: "auto" }}
          onClick={() => setComposerOpen((prev) => !prev)}
        >
          {t(lang, "postTheoryBtn", isEs ? "+ Publicar Nueva Teoría" : "+ Post New Theory")}
        </button>
      </header>

      {feedbackError && (
        <div className="auth-alert auth-alert-error" role="alert" style={{ marginBottom: 14 }}>
          ⚠️ {feedbackError}
        </div>
      )}

      {/* Synced Active Handle Bar */}
      <div className="handle-bar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="tt-avatar">{activeInitial}</div>
          <div>
            <span style={{ fontSize: 11, color: "#94a3b8", display: "block" }}>
              {t(lang, "commentingAs", isEs ? "Comentando y publicando como:" : "Commenting & posting as:")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <strong style={{ color: "#00e5ff" }}>{userHandle}</strong>
              {userTier === "kingpin" && <span className="kingpin-badge">👑 KINGPIN</span>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={handleInput}
            maxLength={25}
            onChange={(e) => setHandleInput(e.target.value)}
            placeholder="@YourUsername"
            style={{
              background: "#080c16",
              border: "1px solid #232f4d",
              color: "#fff",
              padding: "7px 11px",
              borderRadius: 8,
              fontSize: 13
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            disabled={savingHandle}
            onClick={handleSaveHandle}
          >
            {savingHandle
              ? isEs
                ? "Guardando..."
                : "Saving..."
              : t(lang, "saveHandleBtn", isEs ? "Guardar @Usuario" : "Set @Username")}
          </button>
        </div>
      </div>

      {/* New Theory Composer */}
      {composerOpen && (
        <form onSubmit={handlePublishTheory} className="theory-composer">
          <div className="composer-row">
            <input
              type="text"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(lang, "theoryTitlePh", isEs ? "Título de tu teoría..." : "Theory Headline...")}
            />
            <select value={tag} onChange={(e) => setTag(e.target.value)}>
              {THEORY_TAGS.map((tg) => (
                <option key={tg.value} value={tg.value}>
                  {tField(tg.label, lang)}
                </option>
              ))}
            </select>
          </div>

          <div className="composer-row">
            <input
              type="text"
              maxLength={120}
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
              placeholder={t(
                lang,
                "theoryCoordsPh",
                isEs ? "Ubicación / Hora (ej. Condado Kelly • 2:00 AM)" : "Location / Time (e.g., Kelly County • 2:00 AM)"
              )}
            />
          </div>

          <textarea
            rows={3}
            required
            maxLength={1200}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t(
              lang,
              "theoryBodyPh",
              isEs ? "Comparte tus pruebas, ubicación o teoría..." : "Share your evidence or coordinates..."
            )}
          />

          <div className="composer-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setComposerOpen(false)}
            >
              {t(lang, "cancelBtn", isEs ? "Cancelar" : "Cancel")}
            </button>
            <button
              type="submit"
              className="btn-pro"
              disabled={submittingTheory}
              style={{ width: "auto" }}
            >
              {submittingTheory
                ? isEs
                  ? "Publicando..."
                  : "Publishing..."
                : t(lang, "publishBtn", isEs ? "Publicar en el Foro" : "Publish to Board")}
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Controls */}
      <div className="controls-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(
            lang,
            "searchForum",
            isEs
              ? "Buscar Dexter, Paul Walker, Torre de Radio, Pie Grande, OVNI..."
              : "Search Dexter, Paul Walker, Radio Tower, Bigfoot, UFO..."
          )}
        />

        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="ALL">{t(lang, "allTags", isEs ? "Todas las Etiquetas" : "All Mystery Tags")}</option>
          {THEORY_TAGS.map((tg) => (
            <option key={tg.value} value={tg.value}>
              {tField(tg.label, lang)}
            </option>
          ))}
        </select>

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "top" | "newest")}>
          <option value="top">{t(lang, "sortTop", isEs ? "Ordenar: Más Votadas" : "Sort: Top Upvoted")}</option>
          <option value="newest">{t(lang, "sortNew", isEs ? "Ordenar: Más Recientes" : "Sort: Newest First")}</option>
        </select>
      </div>

      {/* Theories Feed */}
      <div className="forum-feed">
        {filteredTheories.map((post) => {
          const activeGifId = selectedGif[post.id] || "";
          const activeGifObj = ANIMATED_GIFS.find((g) => g.id === activeGifId);
          const tagMeta = THEORY_TAGS.find((tg) => tg.value === post.tag);
          const isBusy = busyThreadId === post.id;

          return (
            <article key={post.id} className="theory-card">
              <div className="vote-box">
                <button
                  type="button"
                  disabled={isBusy}
                  className={`vote-btn ${post.upvoted ? "voted" : ""}`}
                  onClick={() => runAction(post.id, { action: "vote" })}
                  aria-label={isEs ? "Votar teoría" : "Upvote theory"}
                >
                  ▲
                </button>
                <span className="vote-count">{post.votes}</span>
              </div>

              <div className="theory-body">
                <div className="theory-meta">
                  <span className="mystery-tag">
                    {tagMeta ? tField(tagMeta.label, lang) : post.tag}
                  </span>
                  {post.coords && <span className="coord-pill">📍 {post.coords}</span>}
                </div>

                <h3>{tField(post.title, lang)}</h3>
                <p style={{ marginTop: 6, color: "#cbd5e1", fontSize: 13.5, lineHeight: 1.55 }}>
                  {tField(post.body, lang)}
                </p>

                {/* Emoji Reactions */}
                <div className="reactions-bar">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={`${post.id}-${emoji}`}
                      type="button"
                      disabled={isBusy}
                      className="react-pill"
                      onClick={() => runAction(post.id, { action: "react", emoji })}
                    >
                      {emoji} {post.reactions?.[emoji] ?? 0}
                    </button>
                  ))}
                </div>

                {/* TikTok-Style Comment Drawer */}
                <div className="comments-drawer">
                  <strong style={{ fontSize: 12, color: "#38bdf8" }}>
                    💬 {isEs ? "Comentarios" : "Comments"} ({post.comments.length})
                  </strong>

                  <div style={{ marginTop: 6 }}>
                    {post.comments.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0" }}>
                        {isEs
                          ? "Sé el primero en comentar con tu @usuario o enviar un GIF."
                          : "Be the first to drop a comment or animated GIF!"}
                      </p>
                    ) : (
                      post.comments.map((comment) => {
                        const initial = (comment.author || "V").replace(/^@/, "").charAt(0).toUpperCase() || "V";
                        const gifObj = ANIMATED_GIFS.find((g) => g.id === comment.gifId);

                        return (
                          <div key={comment.id} className="tt-comment">
                            <div className="tt-avatar sm">{initial}</div>
                            <div className="tt-comment-body">
                              <div
                                className="tt-comment-user"
                                style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
                              >
                                <span>{comment.author}</span>
                                {comment.authorTier === "kingpin" && (
                                  <span className="kingpin-badge">👑 KINGPIN</span>
                                )}
                              </div>
                              {comment.text && <div>{comment.text}</div>}
                              {gifObj && (
                                <div className="animated-gif-card">
                                  <span className="gif-icon-bounce">{gifObj.icon}</span>
                                  <span>{tField(gifObj.label, lang)}</span>
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={isBusy}
                              className={`tt-comment-like ${comment.liked ? "liked" : ""}`}
                              onClick={() =>
                                runAction(post.id, {
                                  action: "likeComment",
                                  commentId: comment.id
                                })
                              }
                            >
                              <span>{comment.liked ? "❤️" : "🤍"}</span>
                              <span>{comment.likes || 0}</span>
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {activeGifObj && (
                    <div style={{ marginTop: 6 }}>
                      <span className="animated-gif-card">
                        <span className="gif-icon-bounce">{activeGifObj.icon}</span>
                        <span>{tField(activeGifObj.label, lang)}</span>
                        <button
                          type="button"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            marginLeft: 6
                          }}
                          onClick={() => setSelectedGif((prev) => ({ ...prev, [post.id]: "" }))}
                          aria-label={isEs ? "Quitar GIF" : "Remove GIF"}
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  )}

                  {openGifTray[post.id] && (
                    <div className="gif-picker-tray">
                      {ANIMATED_GIFS.map((gif) => (
                        <button
                          key={gif.id}
                          type="button"
                          className="gif-option-chip"
                          onClick={() => {
                            setSelectedGif((prev) => ({ ...prev, [post.id]: gif.id }));
                            setOpenGifTray((prev) => ({ ...prev, [post.id]: false }));
                          }}
                        >
                          {gif.icon} {tField(gif.label, lang)}
                        </button>
                      ))}
                    </div>
                  )}

                  <form
                    className="tt-input-bar"
                    onSubmit={(e) => handleCommentSubmit(e, post.id)}
                  >
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: "7px 10px", borderRadius: 99, fontSize: 11.5 }}
                      onClick={() =>
                        setOpenGifTray((prev) => ({
                          ...prev,
                          [post.id]: !prev[post.id]
                        }))
                      }
                    >
                      GIF 🎬
                    </button>
                    <input
                      type="text"
                      maxLength={400}
                      value={commentDrafts[post.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder={
                        isEs
                          ? `Comentar como ${userHandle}...`
                          : `Add comment as ${userHandle}...`
                      }
                    />
                    <button
                      type="submit"
                      disabled={isBusy}
                      className="btn-pro"
                      style={{ width: "auto", padding: "8px 14px", borderRadius: 99 }}
                    >
                      ➤
                    </button>
                  </form>
                </div>

                <div className="theory-footer">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {isEs ? "Publicado por" : "Posted by"} <strong>{post.author}</strong>
                    {post.authorTier === "kingpin" && (
                      <span className="kingpin-badge">👑 KINGPIN</span>
                    )}
                  </span>
                  <span>Leonida Lore Board</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
