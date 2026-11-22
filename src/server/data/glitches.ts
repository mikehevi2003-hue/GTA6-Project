import "server-only";

import type { GlitchItem } from "@/types/vicelink";

export const GLITCHES_DATA: GlitchItem[] = [
  {
    id: "g1",
    category: "Money",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: {
      en: "Apollo Aggregates Red Barn Unlimited Money Loop (~$40k–$89k / Run)",
      es: "Bucle de Dinero Infinito Granero Rojo Apollo Aggregates (~$40k–$89k / Viaje)",
    },
    votes: 842,
    warning: {
      en: "Chapter 1 Warning: Cash on hand & standard BuckMe funds get wiped at the end of Ch. 1 ('Tourist Trap'). Deposit into BuckMe Savings or farm from Chapter 2 onward!",
      es: "Aviso Cap. 1: El efectivo en mano se reinicia al final del Cap. 1 ('Tourist Trap'). Deposita en tu Cuenta de Ahorros BuckMe o hazlo desde el Cap. 2.",
    },
    steps: {
      en: [
        "Steal a 10-slot delivery van outside Apollo Aggregates (red warehouse east of Hamlet) and register it at Moses or Pay 'n' Spray.",
        "Back the van up to the barn entrance. Loot the Teddy-Bear van outside, the second van inside, the cocaine on the office table, and break open the office safe.",
        "Stow all stash bags into your van's storage slots (look for the '+1' drop-off confirmation).",
        "Instant Reset Trick: Switch from Lucia to Jason (far from the barn), then switch right back to Lucia—or Save & Reload. All loot respawns immediately!",
        "Sell to Tyrone (La Perle, Vice City) for maximum payout or Dunk (Port Gellhorn).",
      ],
      es: [
        "Roba una van de reparto de 10 espacios frente a Apollo Aggregates (almacén rojo al este de Hamlet) y regístrala en Moses o Pay 'n' Spray.",
        "Estaciona la van de reversa en la entrada del granero. Saquea la van de ositos afuera, la segunda van adentro, la mesa de la oficina y la caja fuerte.",
        "Guarda todas las bolsas en los espacios de carga de tu van (verifica la confirmación '+1').",
        "Truco de Reinicio Instantáneo: Cambia de Lucía a Jason (lejos del granero) y vuelve a Lucía, o guarda y recarga. ¡Todo el botín reaparece al instante!",
        "Vende todo a Tyrone (La Perle, Vice City) para ganar el pago máximo o a Dunk (Port Gellhorn).",
      ],
    },
  },
  {
    id: "g2",
    category: "Camera",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: {
      en: "True First-Person Camera Mode Glitch (PS5 & Xbox)",
      es: "Glitch de Cámara en Primera Persona Real (PS5 y Xbox)",
    },
    votes: 619,
    warning: {
      en: "GTA 6 did not ship with a toggleable first-person option—this timing trick locks the camera into true first-person until you reload.",
      es: "GTA 6 no trae modo primera persona nativo; este truco bloquea la cámara en primera persona real hasta que recargues partida.",
    },
    steps: {
      en: [
        "Open Pause > Settings > Controller and change 'Touch Pad Button' (PS5) or 'View Button' (Xbox) from Map to Camera.",
        "Sit in the driver's seat of any vehicle and press D-Pad Up to pull out your phone.",
        "Press Circle (PS5) or B (Xbox) to put the phone away, and immediately spam the Touchpad / View button while the phone lowers.",
        "Exit the vehicle—your camera is now locked in full First-Person view on foot and driving.",
      ],
      es: [
        "Abre Pausa > Ajustes > Control y cambia el 'Botón Panel Táctil' (PS5) o 'Botón Vista' (Xbox) de Mapa a Cámara.",
        "Siéntate al volante de cualquier vehículo y presiona Flecha Arriba para sacar el teléfono.",
        "Presiona Círculo (PS5) o B (Xbox) para guardar el teléfono y presiona repetidamente el Panel Táctil / Vista mientras baja la mano.",
        "Sal del vehículo: tu cámara quedará bloqueada en Primera Persona real a pie y conduciendo.",
      ],
    },
  },
  {
    id: "g3",
    category: "Stealth",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: {
      en: "Instant Police Vehicle-ID & Tracker Bypass",
      es: "Evadir Rastreadores GPS e Identificación Policial al Instante",
    },
    votes: 314,
    warning: {
      en: "Works best during 3-star and 4-star Bank Vault or Jewelry escapes.",
      es: "Ideal durante escapes de 3 y 4 estrellas en robos de bancos o joyerías.",
    },
    steps: {
      en: [
        "Break line-of-sight inside a Vice City parking garage or alley while police search cones sweep the block.",
        "Exit your getaway car and enter any parked civilian car—LCPD dispatch tracks your specific vehicle model/plate rather than your face.",
        "Or use your WAiNK phone app (D-Pad Up + Hold R1/RB) to scan and disable GPS trackers.",
      ],
      es: [
        "Rompe la línea de visión dentro de un estacionamiento o callejón de Vice City mientras los conos policiales buscan.",
        "Baja de tu auto de huida y sube a cualquier auto civil estacionado: la policía rastrea la matrícula/modelo del auto más que tu rostro.",
        "También puedes usar la app WAiNK (Flecha Arriba + R1/RB) para escanear y desactivar rastreadores GPS.",
      ],
    },
  },
  {
    id: "g4",
    category: "Physics",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: {
      en: "Grassrivers Airboat Ramp Super-Launch",
      es: "Super-Salto con Hidrodeslizador en Rampas de Grassrivers",
    },
    votes: 276,
    warning: {
      en: "Land in deep water: hitting the bank at full speed destroys the airboat and can drop you to a 1-star wanted level from park rangers.",
      es: "Aterriza en agua profunda: si golpeas la orilla a toda velocidad el hidrodeslizador se destruye y los guardabosques pueden darte 1 estrella.",
    },
    steps: {
      en: [
        "Take the free Panther / POACH Swamp Airboat from the Pelican Valley pier in Grassrivers.",
        "Line up with a sloped dirt bank or wooden dock ramp at the edge of a wide channel and hold full throttle to reach top speed.",
        "Just before the ramp, tap the handbrake / brake once so the nose lifts, then release and keep the throttle pinned.",
        "Tilt the stick back in mid-air to keep the nose up—the fan thrust carries you far past the normal jump distance across lakes and marsh.",
        "Ease off the throttle before landing in deep water to avoid flipping the boat.",
      ],
      es: [
        "Toma el Hidrodeslizador Panther / POACH gratis en el muelle de Pelican Valley en Grassrivers.",
        "Alinéate con una orilla de tierra inclinada o la rampa de un muelle de madera al borde de un canal ancho y acelera a fondo hasta la velocidad máxima.",
        "Justo antes de la rampa, toca el freno de mano / freno una vez para levantar la proa, suéltalo y mantén el acelerador a fondo.",
        "Inclina el stick hacia atrás en el aire para mantener la proa arriba: el empuje de la hélice te lleva mucho más lejos de lo normal sobre lagos y pantanos.",
        "Suelta el acelerador antes de caer en agua profunda para no volcar el bote.",
      ],
    },
  },
  {
    id: "g5",
    category: "Physics",
    status: { en: "WORKING ON PATCH 01.002.001", es: "FUNCIONANDO EN PARCHE 01.002.001" },
    title: {
      en: "Motorcycle Curb & Wall-Climb Boost",
      es: "Impulso de Moto en Bordillos y Escalada de Muros",
    },
    votes: 203,
    warning: {
      en: "Patch 01.002.001 timing is tight: failed attempts can eject you from the bike. Works best on light dirt bikes such as the Maibatsu Sanchez or Dinka Enduro.",
      es: "En el parche 01.002.001 el tiempo es exacto: si fallas puedes salir despedido de la moto. Funciona mejor con motos ligeras como la Maibatsu Sanchez o la Dinka Enduro.",
    },
    steps: {
      en: [
        "Ride a Maibatsu Sanchez or Dinka Enduro to a low concrete curb or short wall (around waist height).",
        "Approach at a 30–40 degree angle at roughly 40 mph and tap the jump button as the front wheel touches the curb.",
        "Lean forward and immediately lean back right as the rear wheel hits the edge—the bike gets a small upward boost instead of bouncing off.",
        "Repeat the same input chain against walls and fences to climb onto low rooftops, loading docks and rocky ledges.",
        "Bail out with a roll before the bike stalls to keep your health intact.",
      ],
      es: [
        "Conduce una Maibatsu Sanchez o Dinka Enduro hasta un bordillo de concreto bajo o un muro corto (a la altura de la cintura).",
        "Acércate con un ángulo de 30–40 grados a unas 40 mph y toca el botón de salto cuando la rueda delantera toque el bordillo.",
        "Inclínate hacia adelante y de inmediato hacia atrás justo cuando la rueda trasera llegue al borde: la moto recibe un pequeño impulso hacia arriba en vez de rebotar.",
        "Repite la misma secuencia contra muros y cercas para subir a techos bajos, muelles de carga y salientes rocosos.",
        "Salta rodando antes de que la moto se detenga para no perder salud.",
      ],
    },
  },
];
