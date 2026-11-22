"use client";

import { useMemo, useState } from "react";
import type { Language, PropertyItem, VehicleClass, VehicleItem } from "@/types/vicelink";
import { tField } from "@/lib/i18n/helpers";
import { t } from "@/lib/i18n/translations";

export interface DatabaseViewProps {
  lang: Language;
  vehicles: VehicleItem[];
  vehiclesLocked: boolean;
  totalVehiclesCount: number;
  properties: PropertyItem[];
  propertiesLocked: boolean;
  plannedVehicles: string[];
  plannedProps: string[];
  onToggleVehicle: (id: string) => void;
  onToggleProperty: (id: string) => void;
  onClearPlan: () => void;
  onOpenPricing: () => void;
}

const VEHICLE_CLASSES: { value: "ALL" | VehicleClass; en: string; es: string }[] = [
  { value: "ALL", en: "All Vehicle Classes", es: "Todas las Clases" },
  { value: "Super", en: "Super & Classics", es: "Súper y Clásicos" },
  { value: "Sports", en: "Sports", es: "Deportivos" },
  { value: "Muscle", en: "Muscle", es: "Muscle" },
  { value: "Off-Road & SUV", en: "Off-Road & SUV", es: "Todoterreno y SUV" },
  { value: "Motorcycle", en: "Motorcycles", es: "Motocicletas" },
  { value: "Marine", en: "Boats & Airboats", es: "Botes e Hidrodeslizadores" },
  { value: "Aircraft", en: "Helicopters & Planes", es: "Helicópteros y Aviones" }
];

export default function DatabaseView({
  lang,
  vehicles,
  vehiclesLocked,
  totalVehiclesCount,
  properties,
  propertiesLocked,
  plannedVehicles,
  plannedProps,
  onToggleVehicle,
  onToggleProperty,
  onClearPlan,
  onOpenPricing
}: DatabaseViewProps) {
  const isEs = lang === "es";
  const [activeTab, setActiveTab] = useState<"vehicles" | "properties">("vehicles");
  const [search, setSearch] = useState("");
  const [vehicleClass, setVehicleClass] = useState<"ALL" | VehicleClass>("ALL");
  const [sortBy, setSortBy] = useState<"speed" | "price-asc" | "price-desc">("speed");

  const summary = useMemo(() => {
    const vehTotal = plannedVehicles.reduce((sum, id) => {
      const v = vehicles.find((x) => x.id === id);
      return sum + (v ? v.price : 0);
    }, 0);
    const propTotal = plannedProps.reduce((sum, id) => {
      const p = properties.find((x) => x.id === id);
      return sum + (p ? p.price : 0);
    }, 0);
    const dailyIncome = plannedProps.reduce((sum, id) => {
      const p = properties.find((x) => x.id === id);
      return sum + (p ? p.dailyIncome : 0);
    }, 0);
    const totalSlots = plannedProps.reduce((sum, id) => {
      const p = properties.find((x) => x.id === id);
      return sum + (p ? p.slots : 0);
    }, 0);
    return {
      totalCost: vehTotal + propTotal,
      dailyIncome,
      totalSlots,
      overCapacity: plannedVehicles.length > totalSlots
    };
  }, [plannedVehicles, plannedProps, vehicles, properties]);

  const filteredVehicles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = vehicles.filter((v) => {
      const matchQ =
        !q || v.name.toLowerCase().includes(q) || tField(v.note, lang).toLowerCase().includes(q);
      const matchCls = vehicleClass === "ALL" || v.class === vehicleClass;
      return matchQ && matchCls;
    });

    if (sortBy === "speed") return [...list].sort((a, b) => b.topSpeed - a.topSpeed);
    if (sortBy === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    return [...list].sort((a, b) => b.price - a.price);
  }, [vehicles, search, vehicleClass, sortBy, lang]);

  return (
    <section id="view-database" className="view active">
      <header className="view-header">
        <div>
          <h2>
            {t(
              lang,
              "dbTitle",
              isEs
                ? "Vehículos, Propiedades y Economía de Leonida"
                : "Leonida Vehicles, Properties & Economy"
            )}
          </h2>
          <p>
            {t(
              lang,
              "dbSub",
              isEs
                ? "Compra propiedades para ganar espacios de garaje e ingresos diarios, y guarda tus autos."
                : "Buy properties to expand garage slots & passive income, then fill your garages with vehicles."
            )}
          </p>
        </div>

        <div className="platform-toggle" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "vehicles"}
            className={`db-tab-btn ${activeTab === "vehicles" ? "active" : ""}`}
            onClick={() => setActiveTab("vehicles")}
          >
            🏎️ {isEs ? `Vehículos (${totalVehiclesCount})` : `Vehicles (${totalVehiclesCount})`}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "properties"}
            className={`db-tab-btn ${activeTab === "properties" ? "active" : ""}`}
            onClick={() => setActiveTab("properties")}
          >
            {propertiesLocked ? "🔒 " : "🏢 "}
            {t(lang, "tabProperties", isEs ? "Propiedades y Garajes" : "Properties & Garages")}
          </button>
        </div>
      </header>

      <div className="planner-bar">
        <div className="planner-stat">
          <span>{t(lang, "plannerWorth", isEs ? "Valor Total del Plan" : "Planned Asset Value")}</span>
          <strong>${summary.totalCost.toLocaleString()}</strong>
        </div>

        <div className="planner-stat">
          <span>{t(lang, "plannerIncome", isEs ? "Ingreso Pasivo Diario" : "Daily Passive Income")}</span>
          <strong className="text-cyan">
            ${summary.dailyIncome.toLocaleString()} / {isEs ? "día" : "day"}
          </strong>
        </div>

        <div className="planner-stat">
          <span>
            {t(lang, "plannerGarage", isEs ? "Espacios de Garaje (Propiedades)" : "Garage Slots (From Properties)")}
          </span>
          <strong className={summary.overCapacity ? "slot-warning" : ""}>
            {summary.overCapacity
              ? `${plannedVehicles.length} / ${summary.totalSlots} (${isEs ? "¡Compra Garaje!" : "Need Garage!"})`
              : `${plannedVehicles.length} / ${summary.totalSlots} ${isEs ? "Espacios" : "Slots"}`}
          </strong>
        </div>

        <button type="button" className="btn-secondary" onClick={onClearPlan}>
          {t(lang, "clearPlan", isEs ? "Reiniciar Plan" : "Reset Plan")}
        </button>
      </div>

      {activeTab === "vehicles" ? (
        <div className="db-subview active">
          {vehiclesLocked && (
            <div className="controller-guide-banner" style={{ borderColor: "rgba(255, 42, 133, 0.45)" }}>
              <div className="guide-steps">
                <span>
                  🔒{" "}
                  <strong>
                    {isEs
                      ? `Vista previa: ${vehicles.length} de ${totalVehiclesCount} vehículos.`
                      : `Starter Preview: ${vehicles.length} of ${totalVehiclesCount} vehicles.`}
                  </strong>{" "}
                  {isEs
                    ? "Desbloquea Street Pass ($1.99) para los 24 vehículos + Planificador de Propiedades y ROI."
                    : "Unlock Street Pass ($1.99) for all 24 vehicles + Properties & Empire ROI Planner."}
                </span>
              </div>
              <button
                type="button"
                className="btn-pro"
                style={{ width: "auto" }}
                onClick={onOpenPricing}
              >
                {isEs ? "Desbloquear Street Pass — $1.99" : "Unlock Street Pass — $1.99"}
              </button>
            </div>
          )}

          <div className="controls-bar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                lang,
                "searchVeh",
                isEs
                  ? "Buscar vehículos (ej. Cheetah, Banshee, Ganado, Airboat)..."
                  : "Search vehicles (e.g., Cheetah, Banshee, Ganado, Airboat)..."
              )}
            />

            <select
              value={vehicleClass}
              onChange={(e) => setVehicleClass(e.target.value as "ALL" | VehicleClass)}
            >
              {VEHICLE_CLASSES.map((cls) => (
                <option key={cls.value} value={cls.value}>
                  {isEs ? cls.es : cls.en}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "speed" | "price-asc" | "price-desc")}
            >
              <option value="speed">{t(lang, "sortSpeed", isEs ? "Ordenar: Velocidad Máx." : "Sort: Top Speed")}</option>
              <option value="price-asc">{t(lang, "sortPriceLow", isEs ? "Precio: Menor a Mayor" : "Price: Low to High")}</option>
              <option value="price-desc">{t(lang, "sortPriceHigh", isEs ? "Precio: Mayor a Menor" : "Price: High to Low")}</option>
            </select>
          </div>

          <div className="cards-grid">
            {filteredVehicles.map((v) => {
              const added = plannedVehicles.includes(v.id);
              const clsLabel = VEHICLE_CLASSES.find((c) => c.value === v.class);
              return (
                <div key={v.id} className="cheat-card">
                  <div>
                    <div className="card-top">
                      <span className="cat-tag">
                        {clsLabel ? (isEs ? clsLabel.es : clsLabel.en) : v.class} • {v.topSpeed} MPH
                      </span>
                      <span className="price-pill">${v.price.toLocaleString()}</span>
                    </div>
                    <h3>{v.name}</h3>
                    <p>{tField(v.note, lang)}</p>
                  </div>

                  <div className="stat-bars">
                    <div className="stat-row">
                      <span>{isEs ? "Velocidad" : "Top Speed"}</span>
                      <div className="stat-track">
                        <div className="stat-fill" style={{ width: `${v.speedPct}%` }} />
                      </div>
                    </div>
                    <div className="stat-row">
                      <span>{isEs ? "Aceleración" : "Acceleration"}</span>
                      <div className="stat-track">
                        <div className="stat-fill" style={{ width: `${v.accelPct}%` }} />
                      </div>
                    </div>
                    <div className="stat-row">
                      <span>{isEs ? "Manejo" : "Handling"}</span>
                      <div className="stat-track">
                        <div className="stat-fill" style={{ width: `${v.handlingPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`plan-toggle-btn ${added ? "added" : ""}`}
                    onClick={() => onToggleVehicle(v.id)}
                  >
                    {added
                      ? t(lang, "inGarage", isEs ? "✓ En tu Garaje" : "✓ In Garage Plan")
                      : t(lang, "addGarage", isEs ? "+ Añadir al Garaje" : "+ Add to Garage Plan")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="db-subview active">
          {propertiesLocked ? (
            <div className="paywall-box">
              <span className="brand-badge">
                {isEs ? "STREET PASS ($1.99 PAGO ÚNICO)" : "STREET PASS ($1.99 ONE-TIME)"}
              </span>
              <h3>
                🏢{" "}
                {isEs
                  ? "Desbloquea Propiedades y Planificador de Imperio ROI"
                  : "Unlock Properties & Empire ROI Planner"}
              </h3>
              <p>
                {isEs
                  ? "Calcula ingresos pasivos diarios, retorno de inversión y capacidad real de garajes en las 5 propiedades principales de Leonida."
                  : "Plan daily passive income, ROI days, and garage capacity across all 5 Leonida empire properties."}
              </p>
              <button
                type="button"
                className="btn-pro"
                style={{ maxWidth: 280, margin: "0 auto" }}
                onClick={onOpenPricing}
              >
                {isEs ? "Desbloquear por $1.99 (Pago Único)" : "Unlock for $1.99 One-Time"}
              </button>
            </div>
          ) : (
            <div className="cards-grid">
              {properties.map((p) => {
                const owned = plannedProps.includes(p.id);
                return (
                  <div key={p.id} className="cheat-card">
                    <div>
                      <div className="card-top">
                        <span className="cat-tag">
                          {p.region} • +{p.slots} {isEs ? "Espacios" : "Garage Slots"}
                        </span>
                        <span className="price-pill">${p.price.toLocaleString()}</span>
                      </div>
                      <h3>{tField(p.name, lang)}</h3>
                      <p>{tField(p.note, lang)}</p>
                    </div>

                    <div className="code-box">
                      {isEs
                        ? `Ingreso Pasivo: +$${p.dailyIncome.toLocaleString()}/día • Retorno: ${p.roiDays} días`
                        : `Passive Income: +$${p.dailyIncome.toLocaleString()}/day • ROI: ${p.roiDays} days`}
                    </div>

                    <button
                      type="button"
                      className={`plan-toggle-btn ${owned ? "added" : ""}`}
                      onClick={() => onToggleProperty(p.id)}
                    >
                      {owned
                        ? t(lang, "ownedProp", isEs ? "✓ En tu Imperio" : "✓ Owned in Empire")
                        : t(lang, "buyProp", isEs ? "+ Comprar Propiedad y Garaje" : "+ Buy Property & Garage")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
