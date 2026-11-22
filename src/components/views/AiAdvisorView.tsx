"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AiQuotaInfo, Language, SpoilerChapter, UserTier } from "@/types/vicelink";
import { SPOILER_CHAPTERS } from "@/lib/constants/forum";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  source?: "gemini" | "builtin";
}

export interface AiAdvisorViewProps {
  lang: Language;
  tier: UserTier;
  aiQuota: AiQuotaInfo;
  onUpdateQuota: (quota: AiQuotaInfo) => void;
  onOpenPricing: () => void;
  onOpenSocialStudio: () => void;
}

export default function AiAdvisorView({
  lang,
  aiQuota,
  onUpdateQuota,
  onOpenPricing,
  onOpenSocialStudio
}: AiAdvisorViewProps) {
  const isEs = lang === "es";
  const [chapter, setChapter] = useState<SpoilerChapter>("ch3");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const quickPrompts = isEs
    ? [
        {
          label: "💰 Ruta Más Rápida de Dinero",
          q: "¿Cuál es la ruta más rápida para ganar dinero sin perderlo en el Cap. 1?"
        },
        {
          label: "🏧 Cajeros ATM y Autos Raros",
          q: "¿Dónde están los cajeros ATM hackeables y el auto gratis de Paul Walker?"
        },
        {
          label: "🤝 Mejores Compradores (Fences)",
          q: "¿Qué fence paga más por joyas, bolsas de cocaína y autos robados?"
        },
        {
          label: "🥚 Easter Eggs Secretos",
          q: "¿Dónde están el huevo de la torre de radio, Dexter y el OVNI de las 2 AM?"
        }
      ]
    : [
        {
          label: "💰 Fastest Safe Money Route",
          q: "What is the fastest way to make money right now without getting my cash wiped?"
        },
        {
          label: "🏧 Hackable ATMs & Rare Cars",
          q: "Where are the hackable ATMs and Paul Walker's free green Eclipse?"
        },
        {
          label: "🤝 Best Fence Payouts",
          q: "Which fence pays the most for stolen jewelry, cocaine bags, and cars?"
        },
        {
          label: "🥚 Hidden Easter Eggs",
          q: "Where are the Radio Tower Easter egg, Dexter's apartment, and 2 AM UFO?"
        }
      ];

  const remaining =
    aiQuota.unlimited || aiQuota.limit === null
      ? null
      : Math.max(0, aiQuota.limit - aiQuota.used);

  const askAdvisor = async (promptText: string) => {
    const clean = promptText.trim();
    if (!clean || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: "user", text: clean }
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: clean, chapter, lang })
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.error === "QUOTA_EXCEEDED") {
        if (data.aiQuota) onUpdateQuota(data.aiQuota);
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: isEs
              ? "🔒 Alcanzaste el límite de 3 consultas diarias gratuitas. Desbloquea Kingpin VIP ($4.99 pago único) para acceso ilimitado al Asesor IA."
              : "🔒 You reached your 3 free daily lookups. Upgrade to Kingpin VIP ($4.99 one-time) for unlimited AI Mission Advisor access."
          }
        ]);
        onOpenPricing();
        return;
      }

      if (res.status === 429) {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text: isEs
              ? "⏱️ Demasiadas solicitudes seguidas. Espera unos segundos e intenta nuevamente."
              : "⏱️ Rate limit reached. Please wait a few seconds before sending another question."
          }
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            role: "bot",
            text:
              data?.message ||
              (isEs
                ? "⚠️ No se pudo procesar tu consulta en este momento."
                : "⚠️ Could not process your question right now.")
          }
        ]);
        return;
      }

      if (data.aiQuota) {
        onUpdateQuota(data.aiQuota);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          text: String(data.reply || ""),
          source: data.source === "gemini" ? "gemini" : "builtin"
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          role: "bot",
          text: isEs
            ? "⚠️ Error de conexión con el servidor de ViceLink IA."
            : "⚠️ Network error while contacting ViceLink AI."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput("");
    void askAdvisor(text);
  };

  return (
    <section id="view-ai" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "aiTitle",
              isEs
                ? "Asesor IA de Misiones y Botín en Leonida"
                : "AI Leonida Mission & Loot Advisor"
            )}
          </h2>
          <p>
            {t(
              lang,
              "aiSub",
              isEs
                ? "Asistente táctico sin spoilers en Español e Inglés + Estudio de Tarjetas para TikTok e Instagram."
                : "Spoiler-controlled tactical assistant in English & Español + TikTok & Instagram Card Studio."
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="btn-secondary"
            value={chapter}
            onChange={(e) => setChapter(e.target.value as SpoilerChapter)}
            aria-label={isEs ? "Escudo Anti-Spoilers" : "Spoiler Shield"}
          >
            {SPOILER_CHAPTERS.map((ch) => (
              <option key={ch.value} value={ch.value}>
                {tField(ch.label, lang)}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-pro"
            style={{ width: "auto" }}
            onClick={onOpenSocialStudio}
          >
            {t(lang, "shareCardBtn", isEs ? "📱 Tarjeta TikTok / IG" : "📱 TikTok & IG Card")}
          </button>
        </div>
      </header>

      <div className="ai-status-strip">
        <span>
          {aiQuota.unlimited
            ? isEs
              ? "👑 KINGPIN VIP: Consultas IA Ilimitadas Activas"
              : "👑 KINGPIN VIP: Unlimited AI Lookups Active"
            : isEs
              ? `Consultas IA Hoy: ${remaining} / ${aiQuota.limit ?? 3} Gratis Restantes (Ilimitado con Kingpin VIP $4.99)`
              : `Daily AI Lookups: ${remaining} / ${aiQuota.limit ?? 3} Free Remaining (Unlimited with Kingpin VIP $4.99)`}
        </span>
        {!aiQuota.unlimited && (
          <button type="button" className="copy-combo-btn" onClick={onOpenPricing}>
            {isEs ? "👑 Desbloquear Ilimitado" : "👑 Unlock Unlimited"}
          </button>
        )}
      </div>

      <div className="quick-prompts">
        {quickPrompts.map((p) => (
          <button
            key={p.label}
            type="button"
            className="prompt-chip"
            disabled={loading}
            onClick={() => void askAdvisor(p.q)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="ai-chat-box">
        <div className="ai-messages">
          {/* Reactive Bilingual Welcome Bubble */}
          <div className="ai-msg bot">
            👋{" "}
            <strong>
              {isEs ? "¡Bienvenido a ViceLink IA!" : "Welcome to ViceLink AI!"}
            </strong>{" "}
            {isEs
              ? "Selecciona tu capítulo en el Escudo Anti-Spoilers y pregúntame sobre misiones, cajeros ATM, autos raros, fences o Easter eggs."
              : "Select your current story chapter in the Spoiler Shield above and ask me anything about GTA VI missions, hackable ATMs, rare free cars, fences, or Easter eggs."}
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`ai-msg ${msg.role}`}>
              {msg.text.split("\n").map((line, i) => (
                <p key={i} style={{ marginTop: i > 0 ? 6 : 0 }}>
                  {line}
                </p>
              ))}
            </div>
          ))}

          {loading && (
            <div className="ai-msg bot">
              {isEs ? "Analizando inteligencia de Leonida..." : "Analyzing Leonida tactical intel..."}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="ai-input-row" onSubmit={handleSubmit}>
          <input
            type="text"
            required
            maxLength={500}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(
              lang,
              "aiPlaceholder",
              isEs
                ? "Pregunta sobre misiones, fences, códigos de cajas fuertes o coleccionables..."
                : "Ask anything about GTA VI missions, fences, safe codes, or collectibles..."
            )}
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-pro"
            style={{ width: "auto" }}
          >
            {t(lang, "aiSendBtn", isEs ? "Preguntar ➤" : "Ask Advisor ➤")}
          </button>
        </form>
      </div>
    </section>
  );
}
