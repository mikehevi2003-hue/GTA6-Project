import "server-only";

import type { CheatItem } from "@/types/vicelink";

export const CHEATS_DATA: CheatItem[] = [
  {
    id: "cash-250k",
    title: { en: "+$250,000 Instant Cash", es: "+$250,000 Dinero Instantáneo" },
    category: "Player",
    unlock: { en: "Finish all 91 story missions", es: "Completa las 91 misiones de la historia" },
    howToUnlock: {
      en: "Beat the main storyline (91 missions). Open Pause > Progress > Cheats. Only money cheat in GTA 6.",
      es: "Termina la historia principal (91 misiones). Abre Pausa > Progreso > Trucos. Es el único truco de dinero.",
    },
    desc: {
      en: "Immediately deposits $250,000 into your active character's balance.",
      es: "Deposita $250,000 inmediatamente en la cuenta de tu personaje activo.",
    },
    seq: ["UP","RIGHT","DOWN","LEFT","UP","LEFT","DOWN","RIGHT"],
  },
  {
    id: "unlimited-focus",
    title: { en: "Unlimited Focus Ability", es: "Habilidad Focus Ilimitada" },
    category: "Player",
    unlock: { en: "Finish the main story campaign", es: "Termina la campaña principal" },
    howToUnlock: {
      en: "Beat the final story mission. Jason and Lucia's tactical Focus meter never drains.",
      es: "Completa la última misión. La barra táctica Focus de Jason y Lucía nunca se agota.",
    },
    desc: {
      en: "Prevents your tactical focus meter from draining during combat and driving.",
      es: "Evita que el medidor táctico Focus se gaste al disparar o conducir.",
    },
    seq: ["DOWN","UP","UP","DOWN","UP","DOWN","UP","DOWN","UP","RIGHT"],
  },
  {
    id: "body-armor",
    title: { en: "Full Body Armor Loadout", es: "Blindaje Corporal Completo" },
    category: "Player",
    unlock: { en: "Complete 100 gym / beach workouts", es: "Completa 100 entrenamientos en gimnasio" },
    howToUnlock: {
      en: "Visit Muscle Sands outdoor gym on Ocean Beach or any fitness club and complete 100 sets.",
      es: "Visita el gimnasio de Ocean Beach o cualquier club deportivo y haz 100 series de ejercicio.",
    },
    desc: {
      en: "Equips maximum heavy ballistic armor immediately.",
      es: "Equipa el chaleco antibalas pesado al máximo al instante.",
    },
    seq: ["DOWN","UP","LEFT","UP","UP","UP","UP","UP","DOWN","DOWN"],
  },
  {
    id: "raise-heat",
    title: { en: "Raise Map Heat Level", es: "Aumentar Nivel de Calor Regional" },
    category: "Player",
    unlock: { en: "Lose a 3-star wanted level 25 times", es: "Escapa de 3 estrellas de policía 25 veces" },
    howToUnlock: {
      en: "Trigger a 3-star LCPD pursuit and escape out of the search cone 25 times.",
      es: "Provoca una persecución policial de 3 estrellas y escapa 25 veces.",
    },
    desc: {
      en: "Pushes your regional heat level higher across Leonida.",
      es: "Aumenta la alerta policial regional en toda Leonida.",
    },
    seq: ["LEFT","DOWN","RIGHT","DOWN","UP","DOWN","UP"],
  },
  {
    id: "raise-wanted",
    title: { en: "Raise Wanted Level (+1 Star)", es: "Subir Nivel de Búsqueda (+1 Estrella)" },
    category: "Player",
    unlock: { en: "Lose a 3-star wanted level 50 times", es: "Escapa de 3 estrellas de policía 50 veces" },
    howToUnlock: {
      en: "Escape 50 separate 3-star police chases (Pay 'n' Spray speeds this up).",
      es: "Escapa de 50 persecuciones de 3 estrellas (pintar el auto en Pay 'n' Spray acelera esto).",
    },
    desc: {
      en: "Immediately escalates LCPD police pursuit intensity.",
      es: "Aumenta inmediatamente las estrellas de búsqueda policial.",
    },
    seq: ["LEFT","DOWN","RIGHT","DOWN","UP","RIGHT","UP"],
  },
  {
    id: "max-ammo",
    title: { en: "Max Ammo (All Weapons)", es: "Munición Máxima (Todas las Armas)" },
    category: "Combat",
    unlock: {
      en: "Win 25 Bronze medals at shooting ranges",
      es: "Gana 25 medallas de Bronce en campos de tiro",
    },
    howToUnlock: {
      en: "Visit gun club shooting ranges and score at least Bronze in 25 weapon trials.",
      es: "Visita los campos de tiro y logra al menos Bronce en 25 pruebas de armas.",
    },
    desc: {
      en: "Fills ammunition reserves for every weapon in your wheel.",
      es: "Llena al máximo las balas de todas tus armas.",
    },
    seq: ["DOWN","UP","RIGHT","DOWN","LEFT","LEFT","UP","UP","DOWN","LEFT"],
  },
  {
    id: "infinite-ammo",
    title: { en: "Infinite Ammo", es: "Munición Infinita" },
    category: "Combat",
    unlock: {
      en: "Win 25 Silver medals at shooting ranges",
      es: "Gana 25 medallas de Plata en campos de tiro",
    },
    howToUnlock: {
      en: "Score Silver or higher across 25 shooting range challenges.",
      es: "Consigue medalla de Plata o superior en 25 desafíos de tiro.",
    },
    desc: {
      en: "Weapons never consume reserve ammunition when firing.",
      es: "Tus armas nunca gastan munición de reserva al disparar.",
    },
    seq: ["DOWN","UP","RIGHT","DOWN","LEFT","LEFT","UP","DOWN","DOWN","DOWN"],
  },
  {
    id: "no-reload",
    title: { en: "No Reload (Bottomless Clip)", es: "Sin Recarga (Cargador Infinito)" },
    category: "Combat",
    unlock: { en: "Win 25 Gold medals at shooting ranges", es: "Gana 25 medallas de Oro en campos de tiro" },
    howToUnlock: {
      en: "Achieve Gold medal accuracy/speed scores in 25 shooting range trials.",
      es: "Logra medalla de Oro en precisión y velocidad en 25 pruebas de tiro.",
    },
    desc: {
      en: "Fire continuously without ever pausing to reload magazines.",
      es: "Dispara sin parar sin tener que recargar nunca el cargador.",
    },
    seq: ["DOWN","UP","RIGHT","DOWN","LEFT","LEFT","UP","DOWN","DOWN","UP"],
  },
  {
    id: "attack-force",
    title: { en: "Super Attack Force", es: "Súper Fuerza de Impacto" },
    category: "Combat",
    unlock: { en: "Finish the main story campaign", es: "Completa la historia principal" },
    howToUnlock: {
      en: "Complete all 91 story missions to unlock super-knockback melee and gunfire.",
      es: "Termina las 91 misiones para desbloquear golpes y disparos explosivos.",
    },
    desc: {
      en: "Melee strikes and bullets send targets flying across the street.",
      es: "Los golpes cuerpo a cuerpo y balas lanzan a los enemigos por los aires.",
    },
    seq: ["DOWN","UP","LEFT","LEFT","RIGHT","DOWN","DOWN","UP","DOWN"],
  },
  {
    id: "exploding-balls",
    title: { en: "Exploding Sports Balls", es: "Balones Deportivos Explosivos" },
    category: "Combat",
    unlock: { en: "Hit 20 enemies with explosive damage", es: "Golpea a 20 enemigos con explosivos" },
    howToUnlock: {
      en: "Damage 20 enemies using grenades, RPGs, or sticky bombs.",
      es: "Daña a 20 enemigos usando granadas, lanzacohetes o bombas adhesivas.",
    },
    desc: {
      en: "Basketballs and beach balls detonate like grenades on impact.",
      es: "Los balones de baloncesto y playa explotan como granadas al chocar.",
    },
    seq: ["DOWN","UP","LEFT","LEFT","RIGHT","DOWN","DOWN","UP","RIGHT"],
  },
  {
    id: "vehicle-force",
    title: { en: "Super Vehicle Ram Force", es: "Súper Impacto de Vehículos" },
    category: "Combat",
    unlock: { en: "Eliminate 25 enemies with a vehicle", es: "Elimina 25 enemigos con un vehículo" },
    howToUnlock: {
      en: "Run over or ram 25 hostile enemies using any car or truck.",
      es: "Atropella o embiste a 25 enemigos hostiles con cualquier auto.",
    },
    desc: {
      en: "Anything your vehicle collides with launches into the air.",
      es: "Cualquier vehículo que choques saldrá volando por los aires.",
    },
    seq: ["DOWN","UP","LEFT","LEFT","RIGHT","DOWN","LEFT","UP","DOWN"],
  },
  {
    id: "spawn-boomazoom",
    title: { en: "Spawn Maibatsu Boomazoom", es: "Generar Maibatsu Boomazoom" },
    category: "Vehicles",
    unlock: { en: "Complete 5 Shopping Challenges", es: "Completa 5 Desafíos de Compras" },
    howToUnlock: {
      en: "Buy clothing and gear across 5 different Vice City & Port Gellhorn stores.",
      es: "Compra ropa y accesorios en 5 tiendas distintas de Vice City y Port Gellhorn.",
    },
    desc: {
      en: "Spawns a compact Maibatsu Boomazoom directly beside you.",
      es: "Genera un auto compacto Maibatsu Boomazoom justo a tu lado.",
    },
    seq: ["LEFT","UP","RIGHT","DOWN","LEFT","LEFT","UP","LEFT"],
  },
  {
    id: "spawn-pumper",
    title: { en: "Spawn MTL Fire Pumper", es: "Generar Camión de Bomberos MTL" },
    category: "Vehicles",
    unlock: { en: "Discover MTL Pumper in Progress menu", es: "Descubre el camión MTL en Progreso" },
    howToUnlock: {
      en: "Drive an MTL Fire Truck once in free roam so it registers in Progress > Vehicles.",
      es: "Conduce un camión de bomberos una vez para registrarlo en Progreso > Vehículos.",
    },
    desc: {
      en: "Spawns a heavy fire truck with a working water cannon.",
      es: "Genera un camión de bomberos con cañón de agua funcional.",
    },
    seq: ["LEFT","UP","RIGHT","DOWN","LEFT","RIGHT","RIGHT","UP"],
  },
  {
    id: "spawn-bulldozer",
    title: { en: "Spawn HVY Bulldozer", es: "Generar Excavadora HVY Bulldozer" },
    category: "Vehicles",
    unlock: { en: "Discover HVY Bulldozer in Progress menu", es: "Descubre la excavadora HVY en Progreso" },
    howToUnlock: {
      en: "Enter an HVY Bulldozer at a Vice City or Ambrosia construction site.",
      es: "Sube a una excavadora HVY en una obra de Vice City o Ambrosia.",
    },
    desc: {
      en: "Spawns an industrial yellow construction bulldozer.",
      es: "Genera una excavadora industrial amarilla de construcción.",
    },
    seq: ["LEFT","UP","RIGHT","DOWN","LEFT","RIGHT","RIGHT","DOWN"],
  },
  {
    id: "spawn-flamingo",
    title: { en: "Spawn Inflatable Flamingo", es: "Generar Flamenco Inflable" },
    category: "Vehicles",
    unlock: { en: "Destroy all 50 Cocaine Flamingos", es: "Destruye los 50 Flamencos de Cocaína" },
    howToUnlock: {
      en: "Find and shoot all 50 hidden pink Cocaine Flamingos across Leonida's 6 regions.",
      es: "Encuentra y dispara a los 50 flamencos rosas ocultos en las 6 regiones de Leonida.",
    },
    desc: {
      en: "Spawns a rideable giant pink pool flamingo.",
      es: "Genera un flamenco rosa inflable gigante que puedes conducir.",
    },
    seq: [],
  },
  {
    id: "cycle-weather",
    title: { en: "Cycle Leonida Weather", es: "Cambiar Clima de Leonida" },
    category: "World",
    unlock: { en: "Finish the main story / Reveal 100% map", es: "Termina la historia / Revela 100% del mapa" },
    howToUnlock: {
      en: "Beat the story or uncover 100% of the Leonida map.",
      es: "Completa la historia o descubre todo el mapa de Leonida.",
    },
    desc: {
      en: "Cycles through Vice Sun, Tropical Storm, Overcast, and Sunset.",
      es: "Alterna entre sol de Vice City, tormenta tropical, nublado y atardecer.",
    },
    seq: ["DOWN","RIGHT","UP","DOWN","RIGHT","UP","RIGHT"],
  },
  {
    id: "filter-cataclysm",
    title: { en: "Screen Filter: Cataclysm", es: "Filtro de Pantalla: Cataclismo" },
    category: "World",
    unlock: { en: "Discover Martha's Vamos in Progress menu", es: "Descubre el Vamos de Martha en Progreso" },
    howToUnlock: {
      en: "Locate Martha's custom Declasse Vamos in the world to register it.",
      es: "Encuentra el Declasse Vamos personalizado de Martha en el mapa.",
    },
    desc: {
      en: "Covers Leonida in dark, apocalyptic murky smoke.",
      es: "Cubre Leonida con una atmósfera oscura y humo apocalíptico.",
    },
    seq: ["DOWN","DOWN","UP","RIGHT","RIGHT","UP","LEFT","LEFT","RIGHT","RIGHT"],
  },
  {
    id: "filter-dollhouse",
    title: { en: "Screen Filter: Dollhouse", es: "Filtro de Pantalla: Casa de Muñecas" },
    category: "World",
    unlock: {
      en: "Hang out with your partner for 8 hours",
      es: "Sal con tu pareja durante 8 horas en el juego",
    },
    howToUnlock: {
      en: "Invite Jason or Lucia on free-roam hangouts for 8 cumulative in-game hours.",
      es: "Invita a Jason o Lucía a actividades libres durante 8 horas acumuladas.",
    },
    desc: {
      en: "Applies hyper-saturated miniature colors in a narrow frame.",
      es: "Aplica colores hiper-saturados estilo miniatura.",
    },
    seq: ["DOWN","DOWN","UP","RIGHT","RIGHT","UP","LEFT","LEFT","DOWN","RIGHT"],
  },
  {
    id: "filter-faded",
    title: { en: "Screen Filter: Faded Glory (CRT)", es: "Filtro de Pantalla: Gloria Pasada (CRT)" },
    category: "World",
    unlock: { en: "Rob 50 stores with your partner", es: "Roba 50 tiendas junto a tu pareja" },
    howToUnlock: {
      en: "Bring your partner along and hold up 50 stores across Leonida.",
      es: "Lleva a tu pareja y asalta 50 tiendas o casas de empeño en Leonida.",
    },
    desc: {
      en: "Applies a retro 1980s Vice City CRT television visual filter.",
      es: "Aplica un filtro retro de televisor CRT de los años 80.",
    },
    seq: ["DOWN","DOWN","UP","RIGHT","RIGHT","UP","LEFT","LEFT","LEFT","RIGHT"],
  },
];
