"use client";

import type { Language, MechanicItem } from "@/types/vicelink";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export interface MechanicsViewProps {
  lang: Language;
  mechanics: MechanicItem[];
}

export default function MechanicsView({ lang, mechanics }: MechanicsViewProps) {
  const isEs = lang === "es";

  return (
    <section id="view-mechanics" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "mechTitle",
              isEs
                ? "Nuevas Mecánicas de GTA VI y Preguntas Frecuentes"
                : "GTA VI New Mechanics & Player FAQ"
            )}
          </h2>
          <p>
            {t(
              lang,
              "mechSub",
              isEs
                ? "Todo lo que cambió respecto a GTA V: lavado de dinero, maleteros, hackeo de autos y físico."
                : "Everything that changed from GTA V: Money laundering, car trunks, hacking tools & fitness."
            )}
          </p>
        </div>
      </header>

      <div className="cards-grid">
        {mechanics.map((m) => (
          <div key={m.id} className="cheat-card">
            <div>
              <span className="mech-badge">{tField(m.tag, lang)}</span>
              <h3>{tField(m.title, lang)}</h3>
              <p style={{ marginTop: 8, lineHeight: 1.55 }}>{tField(m.desc, lang)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
