"use client";

import React from "react";
import type { Language } from "@/types/vicelink";

export type FenceTableProps = {
  lang: Language;
};

export function FenceTable({ lang }: FenceTableProps) {
  const isEs = lang === "es";

  return (
    <div className="fence-sheet" id="fenceTableContainer">
      <h3>
        🤝{" "}
        {isEs
          ? "Guía de Compradores / Fences de Leonida (Dónde Vender Botín)"
          : "Leonida Black-Market Fence Payout Guide (Where to Sell Loot)"}
      </h3>
      <div className="fence-table-wrap">
        <table className="fence-table">
          <thead>
            <tr>
              <th>{isEs ? "Comprador y Ubicación" : "Fence & Location"}</th>
              <th>{isEs ? "Misión de Desbloqueo" : "Unlock Mission"}</th>
              <th>{isEs ? "Especialidad de Botín" : "Best Loot Specialty"}</th>
              <th>{isEs ? "Pago y Notas" : "Payout & Notes"}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Brian</strong> (South Key Lento)
              </td>
              <td>
                {isEs ? "Cap. 1:" : "Ch. 1:"} <em>Lab Fees</em>
              </td>
              <td>{isEs ? "Narcóticos y Efectivo Inicial" : "Early Narcotics & Cash"}</td>
              <td>
                {isEs ? (
                  <>
                    Tarifa baja • Código puerta: <code>7700</code> (Cierra tras Cap. 1)
                  </>
                ) : (
                  <>
                    Low rate • Keypad: <code>7700</code> (Closes after Ch. 1)
                  </>
                )}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Donnie</strong> (South Key Lento)
              </td>
              <td>
                {isEs ? "Cap. 1:" : "Ch. 1:"} <em>Clean Up After Donnie</em>
              </td>
              <td>{isEs ? "Mercancía Inicial" : "Early Drop-Box Goods"}</td>
              <td>
                {isEs ? (
                  <>
                    Tarifa baja • Cierra tras misión <em>Swamped</em>
                  </>
                ) : (
                  <>
                    Low rate • Closes after Ch. 1 quest <em>Swamped</em>
                  </>
                )}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Moses &quot;Mo&quot; Watkins</strong> (Port Gellhorn)
              </td>
              <td>
                {isEs ? "Cap. 2:" : "Ch. 2:"} <em>Moses</em>
              </td>
              <td>
                <strong>
                  {isEs ? "Autos Robados (Sin Rastreador)" : "Stolen Cars (No Trackers)"}
                </strong>
              </td>
              <td>
                {isEs
                  ? "Registra autos como propios o paga $1,000+ por auto"
                  : "Registers cars as personal or buys clean cars ($1,000+ each)"}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Dunk</strong> (South Port Gellhorn)
              </td>
              <td>
                {isEs ? "Cap. 2:" : "Ch. 2:"} <em>Slam Dunk</em>
              </td>
              <td>{isEs ? "Narcóticos y Bolsas Cap. 2" : "Ch. 2 Narcotics & Stash Bags"}</td>
              <td>
                {isEs
                  ? "Tarifa media • Deposita en el maletero de su auto"
                  : "Medium rate • Drop box in his car trunk"}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Tyrone</strong> (La Perle, Vice City)
              </td>
              <td>{isEs ? "Progreso Cap. 3" : "Ch. 3 Progression"}</td>
              <td>
                <strong>
                  {isEs ? "PAGO MÁXIMO por Narcóticos" : "HIGHEST for Narcotics"}
                </strong>
              </td>
              <td>
                {isEs
                  ? "El mejor pago de Leonida para bolsas del Granero Rojo"
                  : "Top payout for Red Barn / Gang Op cocaine bags"}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Yasmani</strong> (Little Cuba, Vice City)
              </td>
              <td>
                {isEs ? "Cap. 3:" : "Ch. 3:"} <em>Boobie Time</em>
              </td>
              <td>
                <strong>
                  {isEs
                    ? "PAGO MÁXIMO por Joyas y Billetes"
                    : "HIGHEST for Jewelry & Marked Bills"}
                </strong>
              </td>
              <td>
                {isEs
                  ? "También vende pistas de bóvedas de bancos"
                  : "Also sells Security-Van & Bank Vault robbery tips"}
              </td>
            </tr>
            <tr>
              <td>
                <strong>Randy</strong> (Balsero, Vice City)
              </td>
              <td>{isEs ? "Progreso Cap. 3+" : "Ch. 3+ Progression"}</td>
              <td>
                <strong>
                  {isEs ? "Superautos Exóticos" : "High-End Exotic Cars"}
                </strong>
              </td>
              <td>
                {isEs
                  ? "Bonificaciones altas por autos de su lista"
                  : "Pays premium bonuses for Wish-List supercars"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FenceTable;
