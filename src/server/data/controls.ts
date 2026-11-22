import "server-only";

import type { HiddenControlItem } from "@/types/vicelink";

export const HIDDEN_CONTROLS_DATA: HiddenControlItem[] = [
  // ---- Driving & Cars (9) ----
  {
    id: "ctrl-auto-drive",
    category: "Driving & Cars",
    title: {
      en: "Auto-Drive Cinematic Mode",
      es: "Modo Conducción Automática Cinematográfica"
    },
    ps5: {
      en: "Set a map waypoint, then Hold Touchpad (or R3) while driving on a road",
      es: "Marca una ruta en el mapa y mantén presionado el Panel Táctil (o R3) conduciendo"
    },
    xbox: {
      en: "Set a map waypoint, then Hold View Button (or RS) while driving on a road",
      es: "Marca una ruta en el mapa y mantén presionado el botón Vista (o RS) conduciendo"
    },
    ps5Keys: ["Set Waypoint", "Hold Touchpad", "R3"],
    xboxKeys: ["Set Waypoint", "Hold View", "RS"],
    tip: {
      en: "Your character automatically follows traffic laws or matches highway speed toward your waypoint while you enjoy the Vice City sunset.",
      es: "Tu personaje sigue la ruta automáticamente hacia el destino marcado mientras disfrutas de la cámara cinematográfica y la radio."
    }
  },
  {
    id: "ctrl-leave-engine-running",
    category: "Driving & Cars",
    title: {
      en: "Leave Engine, Headlights & Radio Running",
      es: "Dejar Motor, Luces y Radio Encendidos al Bajar"
    },
    ps5: {
      en: "Tap Triangle briefly to exit (or Hold D-Pad Down + Tap Triangle for instant getaway mode)",
      es: "Pulsa Triángulo brevemente al salir (o Mantén Cruceta Abajo + Triángulo para huida rápida)"
    },
    xbox: {
      en: "Tap Y briefly to exit (or Hold D-Pad Down + Tap Y for instant getaway mode)",
      es: "Pulsa Y brevemente al salir (o Mantén Cruceta Abajo + Y para huida rápida)"
    },
    ps5Keys: ["Hold D-Pad Down", "Tap Triangle"],
    xboxKeys: ["Hold D-Pad Down", "Tap Y"],
    tip: {
      en: "Essential for bank vault heists and photography—keeps the engine idling, neon headlights glowing, and exterior speakers blasting.",
      es: "Ideal para robos rápidos y fotos nocturnas: el motor sigue encendido, los faros iluminan la escena y la radio suena hacia afuera."
    }
  },
  {
    id: "ctrl-vehicle-controls-menu",
    category: "Driving & Cars",
    title: {
      en: "Vehicle Controls Menu (Doors, Windows, Hood & Neon)",
      es: "Menú de Control del Vehículo (Puertas, Ventanas, Capó y Neón)"
    },
    ps5: {
      en: "Hold D-Pad Right while seated inside or standing next to your personal vehicle",
      es: "Mantén Cruceta Derecha sentado dentro o parado junto a tu vehículo personal"
    },
    xbox: {
      en: "Hold D-Pad Right while seated inside or standing next to your personal vehicle",
      es: "Mantén Cruceta Derecha sentado dentro o parado junto a tu vehículo personal"
    },
    ps5Keys: ["Hold D-Pad Right", "Left Stick"],
    xboxKeys: ["Hold D-Pad Right", "Left Stick"],
    tip: {
      en: "Opens the radial car systems wheel to pop the hood, roll windows down, toggle convertible roofs, or cycle underglow lighting.",
      es: "Abre la rueda de sistemas del auto para abrir el capó, bajar ventanas, plegar el techo convertible o encender luces de neón."
    }
  },
  {
    id: "ctrl-turn-signals",
    category: "Driving & Cars",
    title: {
      en: "Turn Signals & Hazard Blinkers",
      es: "Direccionales y Luces Intermitentes de Emergencia"
    },
    ps5: {
      en: "Double-Tap D-Pad Left / D-Pad Right for blinkers; Hold both or Double-Tap D-Pad Down for hazards",
      es: "Doble toque en Cruceta Izquierda / Derecha para direccional; Doble toque en Cruceta Abajo para intermitentes"
    },
    xbox: {
      en: "Double-Tap D-Pad Left / D-Pad Right for blinkers; Hold both or Double-Tap D-Pad Down for hazards",
      es: "Doble toque en Cruceta Izquierda / Derecha para direccional; Doble toque en Cruceta Abajo para intermitentes"
    },
    ps5Keys: ["2x D-Pad Left", "2x D-Pad Right", "2x D-Pad Down"],
    xboxKeys: ["2x D-Pad Left", "2x D-Pad Right", "2x D-Pad Down"],
    tip: {
      en: "Using turn signals during a 1-star LCPD patrol tail reduces suspicion buildup while blending into Vice City traffic.",
      es: "Usar las direccionales cuando una patrulla LCPD te vigila con 1 estrella reduce la sospecha al mezclarte con el tráfico."
    }
  },
  {
    id: "ctrl-kick-car-door",
    category: "Driving & Cars",
    title: {
      en: "Kick Car Door Open into Pursuers",
      es: "Patear la Puerta del Auto contra Perseguidores"
    },
    ps5: {
      en: "Hold L2 + Press Circle + Tilt Left Stick Left/Right as an enemy or bike pulls alongside",
      es: "Mantén L2 + Pulsa Círculo + Inclina Stick Izquierdo cuando un enemigo o moto pase al lado"
    },
    xbox: {
      en: "Hold LT + Press B + Tilt Left Stick Left/Right as an enemy or bike pulls alongside",
      es: "Mantén LT + Pulsa B + Inclina Stick Izquierdo cuando un enemigo o moto pase al lado"
    },
    ps5Keys: ["Hold L2", "Circle", "Left Stick"],
    xboxKeys: ["Hold LT", "B", "Left Stick"],
    tip: {
      en: "Slams the heavy door outward to knock bikers off their motorcycles or stun chasing officers without firing a shot.",
      es: "Golpea con fuerza la puerta hacia afuera para derribar motociclistas o aturdir policías sin disparar un solo tiro."
    }
  },
  {
    id: "ctrl-push-flip-car",
    category: "Driving & Cars",
    title: {
      en: "Push or Flip Overturned Cars on Foot",
      es: "Empujar o Voltear Autos Volcados a Pie"
    },
    ps5: {
      en: "Approach the side of a flipped or stalled car and Hold Square + Push Left Stick forward",
      es: "Acércate al costado de un auto volcado o atascado y Mantén Cuadrado + Stick Izquierdo adelante"
    },
    xbox: {
      en: "Approach the side of a flipped or stalled car and Hold X + Push Left Stick forward",
      es: "Acércate al costado de un auto volcado o atascado y Mantén X + Stick Izquierdo adelante"
    },
    ps5Keys: ["Hold Square", "Left Stick Up", "Tap X"],
    xboxKeys: ["Hold X", "Left Stick Up", "Tap A"],
    tip: {
      en: "GTA VI removes magical in-cab car rolling—if your exotic supercar flips in Grassrivers, step out and rock it back onto its tires.",
      es: "En GTA VI los autos no giran solos en el aire: si vuelcas tu deportivo, baja y empújalo físicamente sobre sus ruedas."
    }
  },
  {
    id: "ctrl-trunk-arsenal",
    category: "Driving & Cars",
    title: {
      en: "Car Trunk Arsenal & Duffel Loadout Access",
      es: "Acceso al Arsenal y Bolso Táctico del Maletero"
    },
    ps5: {
      en: "Stand behind your vehicle trunk and Hold L1 (or Press D-Pad Right) to open the weapon rack",
      es: "Párate detrás del maletero de tu auto y Mantén L1 (o Pulsa Cruceta Derecha) para abrir el armero"
    },
    xbox: {
      en: "Stand behind your vehicle trunk and Hold LB (or Press D-Pad Right) to open the weapon rack",
      es: "Párate detrás del maletero de tu auto y Mantén LB (o Pulsa Cruceta Derecha) para abrir el armero"
    },
    ps5Keys: ["Stand at Trunk", "Hold L1", "D-Pad Right"],
    xboxKeys: ["Stand at Trunk", "Hold LB", "D-Pad Right"],
    tip: {
      en: "You can only carry two long guns on foot—swap RPGs, sniper rifles, heavy armor plates, and bolt cutters from your trunk.",
      es: "Solo puedes llevar dos armas largas a pie: cambia lanzacohetes, rifles de francotirador, blindaje y cizallas desde tu maletero."
    }
  },
  {
    id: "ctrl-cruise-control",
    category: "Driving & Cars",
    title: {
      en: "Cruise Control & Traffic Speed Match",
      es: "Control de Crucero y Velocidad de Tráfico"
    },
    ps5: {
      en: "Hold R2 at your desired speed and Press X + L3 to lock cruise speed",
      es: "Mantén R2 a la velocidad deseada y Pulsa X + L3 para fijar el control de crucero"
    },
    xbox: {
      en: "Hold RT at your desired speed and Press A + LS to lock cruise speed",
      es: "Mantén RT a la velocidad deseada y Pulsa A + LS para fijar el control de crucero"
    },
    ps5Keys: ["Hold R2", "Press X", "Click L3"],
    xboxKeys: ["Hold RT", "Press A", "Click LS"],
    tip: {
      en: "Locks your exact MPH on Overseas Highway bridges or matches surrounding traffic speed to avoid speed-trap heat.",
      es: "Fija tu velocidad exacta en los puentes hacia Leonida Keys o iguala el tráfico para evitar radares policiales."
    }
  },
  {
    id: "ctrl-rip-gps-tracker",
    category: "Driving & Cars",
    title: {
      en: "Rip Out Stolen Car GPS Tracker Under Dashboard",
      es: "Arrancar el Rastreador GPS bajo el Tablero"
    },
    ps5: {
      en: "Inside a stolen high-end car, Hold L1 + Hold Square before the 45-second tracker timer expires",
      es: "Dentro de un auto de lujo robado, Mantén L1 + Mantén Cuadrado antes de que pasen 45 segundos"
    },
    xbox: {
      en: "Inside a stolen high-end car, Hold LB + Hold X before the 45-second tracker timer expires",
      es: "Dentro de un auto de lujo robado, Mantén LB + Mantén X antes de que pasen 45 segundos"
    },
    ps5Keys: ["Hold L1", "Hold Square"],
    xboxKeys: ["Hold LB", "Hold X"],
    tip: {
      en: "Requires an Immobilizer Bypass tool from a fence; ripping the module prevents automatic LCPD dispatch and lets Moses register the car.",
      es: "Requiere un Bypass de Inmovilizador; arrancar el módulo evita que la policía te rastree y permite vender o registrar el auto con Moses."
    }
  },

  // ---- Boats & Trailers (5) ----
  {
    id: "ctrl-tow-launch-boat",
    category: "Boats & Trailers",
    title: {
      en: "Tow & Launch Boats or Jet Skis on Trailers",
      es: "Remolcar y Lanzar Botes o Motos de Agua desde Tráiler"
    },
    ps5: {
      en: "Back truck trailer into water ramp, then Hold D-Pad Right to release winch & launch vessel",
      es: "Retrocede el remolque al agua y Mantén Cruceta Derecha para soltar el cabrestante y lanzar el bote"
    },
    xbox: {
      en: "Back truck trailer into water ramp, then Hold D-Pad Right to release winch & launch vessel",
      es: "Retrocede el remolque al agua y Mantén Cruceta Derecha para soltar el cabrestante y lanzar el bote"
    },
    ps5Keys: ["Reverse to Ramp", "Hold D-Pad Right"],
    xboxKeys: ["Reverse to Ramp", "Hold D-Pad Right"],
    tip: {
      en: "Drive your boat back onto the submerged trailer rails and Hold D-Pad Right to winch it locked for highway transport.",
      es: "Conduce el bote de regreso sobre los rieles sumergidos del tráiler y Mantén Cruceta Derecha para asegurarlo y llevarlo por carretera."
    }
  },
  {
    id: "ctrl-boat-autopilot",
    category: "Boats & Trailers",
    title: {
      en: "Boat Autopilot & Deck Walk Mode",
      es: "Piloto Automático de Barco y Caminar por Cubierta"
    },
    ps5: {
      en: "At the helm with a naval waypoint set, Hold Touchpad (or Hold R3) to engage marine autopilot",
      es: "En el timón con ruta marcada, Mantén Panel Táctil (o Mantén R3) para activar piloto marino"
    },
    xbox: {
      en: "At the helm with a naval waypoint set, Hold View Button (or Hold RS) to engage marine autopilot",
      es: "En el timón con ruta marcada, Mantén Botón Vista (o Mantén RS) para activar piloto marino"
    },
    ps5Keys: ["Hold Touchpad", "Hold Triangle"],
    xboxKeys: ["Hold View", "Hold Y"],
    tip: {
      en: "Hold Triangle/Y after engaging autopilot to step away from the wheel and walk freely on the boat deck to snipe or fish.",
      es: "Mantén Triángulo/Y tras activar el piloto automático para soltar el timón y caminar libremente por la cubierta para disparar."
    }
  },
  {
    id: "ctrl-push-beached-boat",
    category: "Boats & Trailers",
    title: {
      en: "Push Beached Boat or Jet Ski Back to Water",
      es: "Empujar Bote o Moto de Agua Encallada al Mar"
    },
    ps5: {
      en: "Stand at the bow or hull of a stranded watercraft and Hold Square + Push Left Stick toward water",
      es: "Párate frente a la proa o casco de una lancha encallada y Mantén Cuadrado + Stick Izquierdo hacia el agua"
    },
    xbox: {
      en: "Stand at the bow or hull of a stranded watercraft and Hold X + Push Left Stick toward water",
      es: "Párate frente a la proa o casco de una lancha encallada y Mantén X + Stick Izquierdo hacia el agua"
    },
    ps5Keys: ["Hold Square", "Left Stick"],
    xboxKeys: ["Hold X", "Left Stick"],
    tip: {
      en: "Saves your smuggling speedboat if you beach it on a Leonida Keys sandbar or Grassrivers mud bank during a Coast Guard chase.",
      es: "Salva tu lancha rápida si encallas en un banco de arena de Leonida Keys o en el lodo de Grassrivers durante una persecución."
    }
  },
  {
    id: "ctrl-trailer-hitch-detach",
    category: "Boats & Trailers",
    title: {
      en: "Trailer Hitch Attach & Emergency Detach",
      es: "Enganchar y Desenganchar Remolque de Emergencia"
    },
    ps5: {
      en: "Align pickup hitch with trailer tongue and Hold D-Pad Left to couple or emergency-drop trailer",
      es: "Alinea el enganche de la camioneta con el remolque y Mantén Cruceta Izquierda para acoplar o soltar"
    },
    xbox: {
      en: "Align pickup hitch with trailer tongue and Hold D-Pad Left to couple or emergency-drop trailer",
      es: "Alinea el enganche de la camioneta con el remolque y Mantén Cruceta Izquierda para acoplar o soltar"
    },
    ps5Keys: ["Hold D-Pad Left"],
    xboxKeys: ["Hold D-Pad Left"],
    tip: {
      en: "Dropping a heavy boat or utility trailer at high speed creates an instant roadblock against pursuing LCPD cruisers.",
      es: "Soltar un remolque pesado a alta velocidad crea una barricada instantánea para bloquear patrullas que te persigan."
    }
  },
  {
    id: "ctrl-dive-anchor-tether",
    category: "Boats & Trailers",
    title: {
      en: "Drop Marine Anchor & Scuba Dive Gear Equip",
      es: "Lanzar Ancla Marina y Equipar Equipo de Buceo"
    },
    ps5: {
      en: "Stop boat over reef, Hold R1 + Press D-Pad Down to drop anchor and auto-equip scuba tank",
      es: "Detén el bote sobre el arrecife y Mantén R1 + Cruceta Abajo para lanzar el ancla y equipar tanque de buceo"
    },
    xbox: {
      en: "Stop boat over reef, Hold RB + Press D-Pad Down to drop anchor and auto-equip scuba tank",
      es: "Detén el bote sobre el arrecife y Mantén RB + Cruceta Abajo para lanzar el ancla y equipar tanque de buceo"
    },
    ps5Keys: ["Hold R1", "D-Pad Down"],
    xboxKeys: ["Hold RB", "D-Pad Down"],
    tip: {
      en: "Prevents ocean currents from drifting your boat away while you loot sunken smuggling crates in the Leonida Keys.",
      es: "Evita que la corriente marina se lleve tu lancha mientras buceas buscando cajas hundidas de contrabando en los Cayos."
    }
  },

  // ---- On-Foot (7) ----
  {
    id: "ctrl-radio-earbuds",
    category: "On-Foot",
    title: {
      en: "Listen to Leonida Radio on Foot with Earbuds",
      es: "Escuchar la Radio de Leonida a Pie con Audífonos"
    },
    ps5: {
      en: "Open in-game Phone (D-Pad Up) > Music App, or Hold L1 + Tap D-Pad Left on foot to toggle earbuds",
      es: "Abre el Teléfono (Cruceta Arriba) > App Música, o Mantén L1 + Cruceta Izquierda a pie para activar audífonos"
    },
    xbox: {
      en: "Open in-game Phone (D-Pad Up) > Music App, or Hold LB + Tap D-Pad Left on foot to toggle earbuds",
      es: "Abre el Teléfono (Cruceta Arriba) > App Música, o Mantén LB + Cruceta Izquierda a pie para activar audífonos"
    },
    ps5Keys: ["Hold L1", "D-Pad Left"],
    xboxKeys: ["Hold LB", "D-Pad Left"],
    tip: {
      en: "Stream Cocoteo FM, Worldwide FM, or Vault Radio while exploring Vice Beach on foot, working out, or hunting collectibles.",
      es: "Escucha Cocoteo FM, Worldwide FM o Vault Radio mientras caminas por Ocean Beach, entrenas en el gimnasio o buscas coleccionables."
    }
  },
  {
    id: "ctrl-slide-car-hood",
    category: "On-Foot",
    title: {
      en: "Action Slide Over Car Hoods & Low Obstacles",
      es: "Deslizarse sobre el Capó de Autos y Obstáculos Bajos"
    },
    ps5: {
      en: "Sprint (Tap/Hold X) toward a car hood or waist-high counter and Tap Square at the edge",
      es: "Corre a máxima velocidad (X) hacia el capó de un auto o mostrador y Pulsa Cuadrado en el borde"
    },
    xbox: {
      en: "Sprint (Tap/Hold A) toward a car hood or waist-high counter and Tap X at the edge",
      es: "Corre a máxima velocidad (A) hacia el capó de un auto o mostrador y Pulsa X en el borde"
    },
    ps5Keys: ["Sprint (X)", "Tap Square"],
    xboxKeys: ["Sprint (A)", "Tap X"],
    tip: {
      en: "Preserves 100% sprint momentum during foot chases across congested Vice City boulevards without snagging on bumpers.",
      es: "Mantiene toda tu velocidad de carrera durante persecuciones a pie por las avenidas de Vice City sin tropezar con los autos."
    }
  },
  {
    id: "ctrl-lean-railings",
    category: "On-Foot",
    title: {
      en: "Ambient Lean on Cars, Docks, Walls & Railings",
      es: "Apoyarse en Autos, Muelles, Paredes y Barandillas"
    },
    ps5: {
      en: "Walk up to any personal car, balcony railing, or dock post and Hold D-Pad Right",
      es: "Acércate caminando a tu auto, balcón o barandilla de muelle y Mantén Cruceta Derecha"
    },
    xbox: {
      en: "Walk up to any personal car, balcony railing, or dock post and Hold D-Pad Right",
      es: "Acércate caminando a tu auto, balcón o barandilla de muelle y Mantén Cruceta Derecha"
    },
    ps5Keys: ["Walk to Edge", "Hold D-Pad Right"],
    xboxKeys: ["Walk to Edge", "Hold D-Pad Right"],
    tip: {
      en: "Blends you into crowd zones to drop low-level police line-of-sight AND triggers Jason's balcony meditation for the missable Chapter 1 trophy!",
      es: "Te camufla entre la multitud para evadir patrullas y activa la meditación en el balcón de Jason para el trofeo perdible del Capítulo 1."
    }
  },
  {
    id: "ctrl-waink-tracker-scan",
    category: "On-Foot",
    title: {
      en: "WAiNK App Location Scan & Collectible Ping",
      es: "Escaneo de Ubicación WAiNK y Radar de Coleccionables"
    },
    ps5: {
      en: "Click L3 + R3 briefly on foot (or open Phone > WAiNK App and Press X) to log landmark intel",
      es: "Pulsa L3 + R3 brevemente a pie (o abre Teléfono > App WAiNK y Pulsa X) para escanear la zona"
    },
    xbox: {
      en: "Click LS + RS briefly on foot (or open Phone > WAiNK App and Press A) to log landmark intel",
      es: "Pulsa LS + RS brevemente a pie (o abre Teléfono > App WAiNK y Pulsa A) para escanear la zona"
    },
    ps5Keys: ["Click L3 + R3", "D-Pad Up"],
    xboxKeys: ["Click LS + RS", "D-Pad Up"],
    tip: {
      en: "Scanning 100 distinct landmarks and security zones across Leonida with WAiNK unlocks the 'You WAiNKer!' bronze trophy.",
      es: "Escanear 100 puntos de interés y zonas de seguridad en Leonida con la app WAiNK desbloquea el trofeo 'You WAiNKer!'."
    }
  },
  {
    id: "ctrl-dual-protagonist-switch",
    category: "On-Foot",
    title: {
      en: "Instant Jason ↔ Lucia Tactical Switch & Partner Call",
      es: "Cambio Táctico Instantáneo Jason ↔ Lucía y Llamar Pareja"
    },
    ps5: {
      en: "Hold D-Pad Down + Flick Right Stick Left (Jason), Right (Lucia), or Up (Request Partner Backup)",
      es: "Mantén Cruceta Abajo + Mueve Stick Derecho Izquierda (Jason), Derecha (Lucía) o Arriba (Pedir Apoyo)"
    },
    xbox: {
      en: "Hold D-Pad Down + Flick Right Stick Left (Jason), Right (Lucia), or Up (Request Partner Backup)",
      es: "Mantén Cruceta Abajo + Mueve Stick Derecho Izquierda (Jason), Derecha (Lucía) o Arriba (Pedir Apoyo)"
    },
    ps5Keys: ["Hold D-Pad Down", "Right Stick"],
    xboxKeys: ["Hold D-Pad Down", "Right Stick"],
    tip: {
      en: "When robbing stores together, switching between Jason and Lucia mid-holdup lets one control hostages while the other cracks the safe.",
      es: "Al asaltar tiendas en pareja, alternar entre Jason y Lucía permite que uno vigile a los rehenes mientras el otro abre la caja fuerte."
    }
  },
  {
    id: "ctrl-prone-low-crawl",
    category: "On-Foot",
    title: {
      en: "Crouch vs. Full Prone Low-Crawl Concealment",
      es: "Agacharse vs. Cuerpo a Tierra y Arrastre Táctico"
    },
    ps5: {
      en: "Tap L3 once to crouch; Hold L3 to drop flat into prone crawl through tall swamp grass",
      es: "Pulsa L3 una vez para agacharte; Mantén L3 para tirarte cuerpo a tierra entre la maleza"
    },
    xbox: {
      en: "Tap LS once to crouch; Hold LS to drop flat into prone crawl through tall swamp grass",
      es: "Pulsa LS una vez para agacharte; Mantén LS para tirarte cuerpo a tierra entre la maleza"
    },
    ps5Keys: ["Tap L3 (Crouch)", "Hold L3 (Prone)"],
    xboxKeys: ["Tap LS (Crouch)", "Hold LS (Prone)"],
    tip: {
      en: "Going full prone in Grassrivers sawgrass or behind rooftop ledges makes you nearly invisible to police helicopters.",
      es: "Ir cuerpo a tierra en los pastizales de Grassrivers o en azoteas te vuelve casi invisible ante los helicópteros policiales."
    }
  },
  {
    id: "ctrl-drop-contraband-bag",
    category: "On-Foot",
    title: {
      en: "Quick-Drop or Pass Contraband Duffel Bag",
      es: "Soltar o Pasar Rápido el Bolso de Botín / Contrabando"
    },
    ps5: {
      en: "Hold L1 + Press Triangle to toss your loot duffel bag to your partner or into an open car trunk",
      es: "Mantén L1 + Pulsa Triángulo para lanzar el bolso de botín a tu pareja o dentro de un maletero abierto"
    },
    xbox: {
      en: "Hold LB + Press Y to toss your loot duffel bag to your partner or into an open car trunk",
      es: "Mantén LB + Pulsa Y para lanzar el bolso de botín a tu pareja o dentro de un maletero abierto"
    },
    ps5Keys: ["Hold L1", "Triangle"],
    xboxKeys: ["Hold LB", "Y"],
    tip: {
      en: "Heavy narcotics or marked-bill bags slow your sprint—throw the bag into the trunk first so you can sprint at full speed.",
      es: "Los bolsos pesados de narcóticos o billetes marcados reducen tu velocidad: lánzalos al maletero o a tu pareja para correr libre."
    }
  },

  // ---- Combat & Weapons (7) ----
  {
    id: "ctrl-choke-out-grapple",
    category: "Combat & Weapons",
    title: {
      en: "Choke Out Enemies in Silent Melee Grapple",
      es: "Estrangular y Dormir Enemigos en Agarre Silencioso"
    },
    ps5: {
      en: "Approach from behind or grapple with Triangle, then Hold Circle to apply non-lethal sleeper hold",
      es: "Acércate por detrás o agarra con Triángulo, y Mantén Círculo para aplicar llave de estrangulamiento no letal"
    },
    xbox: {
      en: "Approach from behind or grapple with Y, then Hold B to apply non-lethal sleeper hold",
      es: "Acércate por detrás o agarra con Y, y Mantén B para aplicar llave de estrangulamiento no letal"
    },
    ps5Keys: ["Triangle (Grapple)", "Hold Circle"],
    xboxKeys: ["Y (Grapple)", "Hold B"],
    tip: {
      en: "Knocks guards unconscious silently without killing them—essential for keeping your Criminal Profile in the 'Professional' tier!",
      es: "Deja inconscientes a los guardias en silencio sin matarlos: clave para mantener tu Perfil Criminal en rango 'Profesional'."
    }
  },
  {
    id: "ctrl-switch-aim-shoulder",
    category: "Combat & Weapons",
    title: {
      en: "Switch Aiming Camera Shoulder (Left / Right)",
      es: "Cambiar Hombro de Cámara al Apuntar (Izquierdo / Derecho)"
    },
    ps5: {
      en: "While aiming with L2, Tap D-Pad Left (or Click L3 depending on preset) to swap shoulder angle",
      es: "Mientras apuntas con L2, Pulsa Cruceta Izquierda (o L3) para cambiar el ángulo sobre el hombro"
    },
    xbox: {
      en: "While aiming with LT, Tap D-Pad Left (or Click LS depending on preset) to swap shoulder angle",
      es: "Mientras apuntas con LT, Pulsa Cruceta Izquierda (o LS) para cambiar el ángulo sobre el hombro"
    },
    ps5Keys: ["Hold L2", "Tap D-Pad Left"],
    xboxKeys: ["Hold LT", "Tap D-Pad Left"],
    tip: {
      en: "Lets you pie tight left-hand doorways inside Vice City bank vaults and hotel corridors without exposing your torso.",
      es: "Te permite asomarte por esquinas izquierdas en bóvedas bancarias y pasillos estrechos sin exponer todo el cuerpo."
    }
  },
  {
    id: "ctrl-movable-fp-scope",
    category: "Combat & Weapons",
    title: {
      en: "Movable First-Person Scope & Weapon Inspect View",
      es: "Mira Móvil en Primera Persona e Inspección de Arma"
    },
    ps5: {
      en: "Aim with L2 + Click R3 for iron/optic sights, then use D-Pad Up/Down to shift eye relief or Hold R1 to inspect",
      es: "Apunta con L2 + Pulsa R3 para mira óptica, usa Cruceta Arriba/Abajo para zoom o Mantén R1 para inspeccionar"
    },
    xbox: {
      en: "Aim with LT + Click RS for iron/optic sights, then use D-Pad Up/Down to shift eye relief or Hold RB to inspect",
      es: "Apunta con LT + Pulsa RS para mira óptica, usa Cruceta Arriba/Abajo para zoom o Mantén RB para inspeccionar"
    },
    ps5Keys: ["Hold L2", "Click R3", "D-Pad Up/Down"],
    xboxKeys: ["Hold LT", "Click RS", "D-Pad Up/Down"],
    tip: {
      en: "In first-person view you can freely tilt and reposition your weapon optic or switch between top-mounted red dots and magnified scopes.",
      es: "En primera persona puedes ajustar la distancia de la mira o alternar entre punto rojo lateral y lente telescópico."
    }
  },
  {
    id: "ctrl-weapon-sling-swap",
    category: "Combat & Weapons",
    title: {
      en: "Instant Primary Rifle Sling Swap",
      es: "Cambio Rápido a Rifle Principal en Correa"
    },
    ps5: {
      en: "Double-Tap L1 to instantly whip out or sling your primary long gun without opening the weapon wheel",
      es: "Pulsa dos veces L1 para desenfundar o colgar al instante tu rifle principal sin abrir la rueda de armas"
    },
    xbox: {
      en: "Double-Tap LB to instantly whip out or sling your primary long gun without opening the weapon wheel",
      es: "Pulsa dos veces LB para desenfundar o colgar al instante tu rifle principal sin abrir la rueda de armas"
    },
    ps5Keys: ["2x Tap L1"],
    xboxKeys: ["2x Tap LB"],
    tip: {
      en: "Conceals your sidearm or drops your rifle cleanly onto its tactical sling before walking past uniformed LCPD officers.",
      es: "Oculta tu pistola o cuelga tu rifle rápidamente antes de pasar frente a oficiales de policía patrullando."
    }
  },
  {
    id: "ctrl-nonlethal-ziptie",
    category: "Combat & Weapons",
    title: {
      en: "Intimidate, Disarm & Zip-Tie Guards or Clerks",
      es: "Intimidar, Desarmar y Atar con Bridas a Guardias"
    },
    ps5: {
      en: "Aim weapon at close range (Hold L2) + Press Triangle to order surrender, then Hold Square to zip-tie",
      es: "Apunta de cerca (Mantén L2) + Pulsa Triángulo para ordenar rendición, luego Mantén Cuadrado para atar"
    },
    xbox: {
      en: "Aim weapon at close range (Hold LT) + Press Y to order surrender, then Hold X to zip-tie",
      es: "Apunta de cerca (Mantén LT) + Pulsa Y para ordenar rendición, luego Mantén X para atar"
    },
    ps5Keys: ["Hold L2", "Triangle", "Hold Square"],
    xboxKeys: ["Hold LT", "Y", "Hold X"],
    tip: {
      en: "Zip-tied store clerks and security guards cannot trigger silent alarms, giving you extra minutes to crack safes cleanly.",
      es: "Los cajeros y guardias atados con bridas no pueden activar la alarma silenciosa, dándote tiempo extra para vaciar la caja fuerte."
    }
  },
  {
    id: "ctrl-blindfire-cover",
    category: "Combat & Weapons",
    title: {
      en: "Blind-Fire Over Cover & Tactical Corner Transition",
      es: "Disparo a Ciegas desde Cobertura y Giro de Esquina"
    },
    ps5: {
      en: "In cover (R1), Hold R2 without L2 to blind-fire, or Hold X + Left Stick to swat-turn around a corner",
      es: "En cobertura (R1), Mantén R2 sin L2 para disparar a ciegas, o Mantén X + Stick Izquierdo para girar la esquina"
    },
    xbox: {
      en: "In cover (RB), Hold RT without LT to blind-fire, or Hold A + Left Stick to swat-turn around a corner",
      es: "En cobertura (RB), Mantén RT sin LT para disparar a ciegas, o Mantén A + Stick Izquierdo para girar la esquina"
    },
    ps5Keys: ["R1 (Cover)", "Hold R2", "Hold X"],
    xboxKeys: ["RB (Cover)", "Hold RT", "Hold A"],
    tip: {
      en: "Suppresses SWAT teams pinning you down during 4-star bank escapes while keeping your head protected behind concrete pillars.",
      es: "Mantiene a raya a los equipos SWAT durante huidas de 4 estrellas sin exponer la cabeza al fuego enemigo."
    }
  },
  {
    id: "ctrl-tactical-focus",
    category: "Combat & Weapons",
    title: {
      en: "Activate Tactical Focus Ability (Weak-Spot & Threat Sense)",
      es: "Activar Habilidad Táctica Focus (Puntos Débiles y Amenazas)"
    },
    ps5: {
      en: "Press L3 + R3 simultaneously while aiming or driving to trigger Jason or Lucia's Focus mode",
      es: "Pulsa L3 + R3 al mismo tiempo mientras apuntas o conduces para activar el modo Focus de Jason o Lucía"
    },
    xbox: {
      en: "Press LS + RS simultaneously while aiming or driving to trigger Jason or Lucia's Focus mode",
      es: "Pulsa LS + RS al mismo tiempo mientras apuntas o conduces para activar el modo Focus de Jason o Lucía"
    },
    ps5Keys: ["Hold L2", "Press L3 + R3"],
    xboxKeys: ["Hold LT", "Press LS + RS"],
    tip: {
      en: "Your Criminal Profile tier changes how Focus charges: Professional charges via stealth & alarms, while Violent charges via headshots.",
      es: "Tu nivel de Perfil Criminal cambia cómo se recarga Focus: Profesional recarga con sigilo y Violento recarga con tiros a la cabeza."
    }
  },

  // ---- Planes & Parachuting (4) ----
  {
    id: "ctrl-aircraft-landing-gear",
    category: "Planes & Parachuting",
    title: {
      en: "Retract or Deploy Aircraft Landing Gear",
      es: "Subir o Bajar el Tren de Aterrizaje del Avión"
    },
    ps5: {
      en: "Click L3 once airborne to retract wheels into the fuselage; Click L3 again on runway approach",
      es: "Pulsa L3 al despegar para guardar las ruedas en el fuselaje; Pulsa L3 de nuevo antes de aterrizar"
    },
    xbox: {
      en: "Click LS once airborne to retract wheels into the fuselage; Click LS again on runway approach",
      es: "Pulsa LS al despegar para guardar las ruedas en el fuselaje; Pulsa LS de nuevo antes de aterrizar"
    },
    ps5Keys: ["Click L3"],
    xboxKeys: ["Click LS"],
    tip: {
      en: "Leaving landing gear down causes severe aerodynamic drag and caps top airspeed by 35% during low-altitude smuggling runs.",
      es: "Dejar el tren de aterrizaje abajo genera resistencia al aire y reduce la velocidad máxima del avión un 35% en vuelos de contrabando."
    }
  },
  {
    id: "ctrl-parachute-precision-flare",
    category: "Planes & Parachuting",
    title: {
      en: "Parachute Precision Stall-Brake & Smoke Trail",
      es: "Frenado de Precisión en Paracaídas y Humo de Color"
    },
    ps5: {
      en: "Under open canopy, Hold L1 + R1 simultaneously for pinpoint landing flare; Hold X to release smoke",
      es: "Con el paracaídas abierto, Mantén L1 + R1 juntos para descenso de precisión; Mantén X para humo"
    },
    xbox: {
      en: "Under open canopy, Hold LB + RB simultaneously for pinpoint landing flare; Hold A to release smoke",
      es: "Con el paracaídas abierto, Mantén LB + RB juntos para descenso de precisión; Mantén A para humo"
    },
    ps5Keys: ["Hold L1 + R1", "Hold X"],
    xboxKeys: ["Hold LB + RB", "Hold A"],
    tip: {
      en: "Essential for landing directly on small Vice City penthouse helipads or moving yacht decks without tumbling on impact.",
      es: "Indispensable para aterrizar con exactitud sobre helipuertos de penthouses en Vice City o cubiertas de yates en movimiento."
    }
  },
  {
    id: "ctrl-heli-hover-rappel",
    category: "Planes & Parachuting",
    title: {
      en: "Helicopter Auto-Hover Lock & Tactical Rope Rappel",
      es: "Vuelo Estacionario de Helicóptero y Descenso en Rápel"
    },
    ps5: {
      en: "Hold R3 to stabilize helicopter hover; passengers Hold Square near side doors to drop rappel lines",
      es: "Mantén R3 para fijar vuelo estacionario; los pasajeros Mantienen Cuadrado para bajar por cuerda en rápel"
    },
    xbox: {
      en: "Hold RS to stabilize helicopter hover; passengers Hold X near side doors to drop rappel lines",
      es: "Mantén RS para fijar vuelo estacionario; los pasajeros Mantienen X para bajar por cuerda en rápel"
    },
    ps5Keys: ["Hold R3 (Hover)", "Hold Square (Rappel)"],
    xboxKeys: ["Hold RS (Hover)", "Hold X (Rappel)"],
    tip: {
      en: "Lets you infiltrate high-security Vice City skyscrapers or extract your partner from rooftops without needing a landing pad.",
      es: "Permite infiltrarte en azoteas de rascacielos en Vice City sin necesidad de aterrizar el helicóptero."
    }
  },
  {
    id: "ctrl-plane-wing-level-autopilot",
    category: "Planes & Parachuting",
    title: {
      en: "Aircraft Altitude Hold & Radar-Low Cruise",
      es: "Mantener Altitud de Avión y Vuelo Bajo Anti-Radar"
    },
    ps5: {
      en: "Level wings and Hold Touchpad (or Hold L1 + R1 + Click R3) to lock current altitude above ocean waves",
      es: "Nivela las alas y Mantén Panel Táctil (o L1 + R1 + R3) para fijar la altitud actual sobre el mar"
    },
    xbox: {
      en: "Level wings and Hold View Button (or Hold LB + RB + Click RS) to lock current altitude above ocean waves",
      es: "Nivela las alas y Mantén Botón Vista (o LB + RB + RS) para fijar la altitud actual sobre el mar"
    },
    ps5Keys: ["Hold Touchpad", "L1 + R1 + R3"],
    xboxKeys: ["Hold View", "LB + RB + RS"],
    tip: {
      en: "Keeps your smuggling seaplane skimming below Coast Guard radar altitude while you check the tactical map.",
      es: "Mantiene tu hidroavión volando a baja altura por debajo del radar de la Guardia Costera mientras revisas el mapa táctico."
    }
  }
];
