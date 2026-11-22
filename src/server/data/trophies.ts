import "server-only";

import type { CriminalProfileTier, TrophyItem } from "@/types/vicelink";

export const CRIMINAL_PROFILE_TIERS: CriminalProfileTier[] = [
  {
    id: "professional",
    rank: 1,
    name: {
      en: "1. Professional",
      es: "1. Profesional"
    },
    badgeColor: "#facc15",
    icon: "🎯",
    permanent: false,
    behavior: {
      en: "Earned through non-lethal sleeper-hold takedowns, zip-tying witnesses, disabling silent alarms, and zero civilian casualties.",
      es: "Se obtiene mediante derribos no letales, atando testigos con bridas, desactivando alarmas silenciosas y sin bajas civiles."
    },
    focusPerk: {
      en: "Focus meter charges rapidly from stealth takedowns, lockpicking, and alarm bypasses; highlights security cameras & guard cones.",
      es: "El medidor Focus se carga rápido con derribos sigilosos y hackeo de alarmas; resalta cámaras de seguridad y conos de visión."
    },
    policeResponse: {
      en: "LCPD officers prioritize negotiation and allow surrender on 1–2 stars; fences pay a +10% Clean Heat bonus on heist loot.",
      es: "La policía LCPD prioriza negociar y permite rendirse con 1–2 estrellas; los fences pagan +10% de bono por botín limpio."
    }
  },
  {
    id: "hardened",
    rank: 2,
    name: {
      en: "2. Hardened",
      es: "2. Curtido"
    },
    badgeColor: "#38bdf8",
    icon: "🕶️",
    permanent: false,
    behavior: {
      en: "Maintained by using disciplined force, firing only in self-defense against armed gang members, and avoiding unnecessary collateral damage.",
      es: "Se mantiene usando fuerza disciplinada, disparando solo en defensa propia contra bandas armadas y evitando daños colaterales."
    },
    focusPerk: {
      en: "Balanced Focus regeneration during both tactical cover firefights and high-speed getaway driving.",
      es: "Regeneración equilibrada de Focus tanto en tiroteos desde cobertura como en huidas a alta velocidad."
    },
    policeResponse: {
      en: "Standard LCPD patrol pursuit protocols; officers issue verbal warnings before opening fire at 1 star.",
      es: "Protocolo estándar de persecución policial; los oficiales dan advertencias verbales antes de disparar con 1 estrella."
    }
  },
  {
    id: "violent",
    rank: 3,
    name: {
      en: "3. Violent",
      es: "3. Violento"
    },
    badgeColor: "#fb923c",
    icon: "🔫",
    permanent: false,
    behavior: {
      en: "Triggered by frequent lethal shootouts, armored van ambushes, and LCPD officer casualties during getaways.",
      es: "Se activa por tiroteos letales frecuentes, emboscadas a camiones blindados y bajas policiales durante las huidas."
    },
    focusPerk: {
      en: "Headshots and vehicle ramming rapidly charge the Focus meter, boosting weapon reload speed and recoil control.",
      es: "Los tiros a la cabeza y embestidas con vehículos cargan rápido el Focus, mejorando la velocidad de recarga y el retroceso."
    },
    policeResponse: {
      en: "Police skip 1-star arrest warnings and open fire immediately; tactical spike-strip roadblocks deploy at 3 stars.",
      es: "La policía omite la opción de arresto y dispara de inmediato; despliegan barricadas con pinchos desde 3 estrellas."
    }
  },
  {
    id: "psycho",
    rank: 4,
    name: {
      en: "4. Psycho",
      es: "4. Psicópata"
    },
    badgeColor: "#ff2a85",
    icon: "🔥",
    permanent: false,
    behavior: {
      en: "Caused by heavy civilian casualties, explosive rampages, and executing surrendered store clerks or guards.",
      es: "Causado por altas bajas civiles, uso masivo de explosivos y atacar a cajeros o guardias que ya se habían rendido."
    },
    focusPerk: {
      en: "Explosions and multi-kills extend Focus duration and grant temporary incoming damage resistance during shootouts.",
      es: "Las explosiones y bajas múltiples extienden la duración de Focus y otorgan resistencia temporal al daño en combate."
    },
    policeResponse: {
      en: "Police refuse surrender completely; SWAT air units and armored BearCats deploy rapidly with extended regional heat memory.",
      es: "La policía rechaza cualquier rendición; helicópteros SWAT y blindados se despliegan rápido con alerta regional prolongada."
    }
  },
  {
    id: "irredeemable",
    rank: 5,
    name: {
      en: "5. Irredeemable",
      es: "5. Irredimible"
    },
    badgeColor: "#ef4444",
    icon: "💀",
    permanent: true,
    behavior: {
      en: "PERMANENT LOWEST TIER: Reached after sustained mass-casualty rampages across Leonida. Once locked in, there is NO way back to higher tiers.",
      es: "NIVEL PERMANENTE SIN RETORNO: Se alcanza tras masacres continuas en Leonida. Una vez bloqueado en Irredimible, NO puedes volver a subir."
    },
    focusPerk: {
      en: "Maximum lethal damage boost during Focus, but stealth alarm bonuses and peaceful store intimidation permanently lock out.",
      es: "Máximo bono de daño letal durante Focus, pero pierdes para siempre los bonos de sigilo y la rendición pacífica en tiendas."
    },
    policeResponse: {
      en: "Instant shoot-on-sight escalation, maximum regional heat retention, and elite NOOSE tactical squads dispatched at 3+ stars.",
      es: "Fuego a matar inmediato, retención máxima de calor regional y escuadrones tácticos de élite NOOSE desde 3 estrellas."
    }
  }
];

export const TROPHIES_DATA: TrophyItem[] = [
  // ---- PLATINUM (1) ----
  {
    id: "t-plat-1",
    grade: "platinum",
    secret: false,
    missable: false,
    title: {
      en: "Vice Got a Price!",
      es: "Vice Got a Price! (¡Todo Tiene su Precio en Vice!)"
    },
    desc: {
      en: "Unlock all other 54 Grand Theft Auto VI trophies across Leonida.",
      es: "Desbloquea los otros 54 trofeos de Grand Theft Auto VI en Leonida."
    },
    guide: {
      en: "Complete all story chapters without missing 'Positive Mental Attitude' in Chapter 1, achieve 100% completion, and never activate cheat codes on your trophy save.",
      es: "Completa la historia sin perder 'Positive Mental Attitude' en el Capítulo 1, logra el 100% de progreso y nunca actives trucos en tu partida principal."
    }
  },

  // ---- GOLD (2) ----
  {
    id: "t-gold-1",
    grade: "gold",
    secret: false,
    missable: false,
    title: {
      en: "A Long Road",
      es: "A Long Road (Un Largo Camino)"
    },
    desc: {
      en: "Achieve 100% Game Completion in Grand Theft Auto VI.",
      es: "Alcanza el 100% de Progreso Total en Grand Theft Auto VI."
    },
    guide: {
      en: "Finish all 91 story missions, 50 Cocaine Flamingos, 32 tactical map locations, 5 Empire properties, all Stranger encounters, and shooting range challenges.",
      es: "Completa las 91 misiones principales, los 50 Flamencos de Cocaína, 32 ubicaciones clave, 5 propiedades del imperio y eventos de extraños."
    }
  },
  {
    id: "t-gold-2",
    grade: "gold",
    secret: true,
    missable: false,
    chapter: "Endgame",
    title: {
      en: "Till Leonida Do Us Part",
      es: "Till Leonida Do Us Part (Hasta que Leonida nos Separe)"
    },
    desc: {
      en: "Complete all 91 main story missions and survive the final Vice City Federal Reserve showdown.",
      es: "Completa las 91 misiones principales de la historia y sobrevive al golpe final en Vice City."
    },
    guide: {
      en: "Unlocks automatically upon finishing the final story mission with Jason and Lucia.",
      es: "Se desbloquea automáticamente al terminar la misión final de la campaña principal con Jason y Lucía."
    }
  },

  // ---- SILVER (6) ----
  {
    id: "t-silv-1",
    grade: "silver",
    secret: false,
    missable: false,
    title: {
      en: "Maximum Withdrawal",
      es: "Maximum Withdrawal (Retiro Máximo)"
    },
    desc: {
      en: "Successfully crack and rob 5 major bank vaults across Leonida.",
      es: "Abre y roba con éxito 5 bóvedas de bancos principales en Leonida."
    },
    guide: {
      en: "Buy bank vault security tips from Yasmani in Little Cuba (Chapter 3+), bring thermite or heavy drills in your car trunk, and escape the 4-star pursuit.",
      es: "Compra pistas de bóvedas bancarias con Yasmani en Little Cuba (Cap. 3+), lleva termita en el maletero de tu auto y escapa de 4 estrellas."
    }
  },
  {
    id: "t-silv-2",
    grade: "silver",
    secret: false,
    missable: false,
    title: {
      en: "Dime on the Dollar",
      es: "Dime on the Dollar (Dinero Limpio)"
    },
    desc: {
      en: "Launder $250,000 in stolen Marked Bills into clean spendable cash.",
      es: "Lava $250,000 en Billetes Marcados robados para convertirlos en efectivo limpio."
    },
    guide: {
      en: "Take dye-tagged cash bags from armored vans and ATM heists to Yasmani in Little Cuba or cycle them through your owned Vice City businesses.",
      es: "Lleva los bolsos de billetes marcados de camiones blindados y cajeros ATM a Yasmani en Little Cuba o lávalos en tus propiedades."
    }
  },
  {
    id: "t-silv-3",
    grade: "silver",
    secret: false,
    missable: false,
    title: {
      en: "Keys to the Empire",
      es: "Keys to the Empire (Llaves del Imperio)"
    },
    desc: {
      en: "Purchase all 5 revenue-generating properties and unlock every garage slot in Leonida.",
      es: "Compra las 5 propiedades generadoras de ingresos y desbloquea todos los espacios de garaje en Leonida."
    },
    guide: {
      en: "Acquire Key Lento Smuggler's Dock, Port Gellhorn Auto Chop Shop, Little Cuba Laundromat Front, Ocean Beach Nightclub, and Starfish Island Penthouse.",
      es: "Adquiere el Muelle de Key Lento, el Taller de Port Gellhorn, la Lavandería de Little Cuba, el Club de Ocean Beach y el Penthouse de Starfish Island."
    }
  },
  {
    id: "t-silv-4",
    grade: "silver",
    secret: false,
    missable: false,
    title: {
      en: "Flamingo Fallout",
      es: "Flamingo Fallout (Exterminio Rosa)"
    },
    desc: {
      en: "Find and destroy all 50 hidden Cocaine Flamingos across Leonida's 6 regions.",
      es: "Encuentra y destruye los 50 Flamencos de Cocaína ocultos en las 6 regiones de Leonida."
    },
    guide: {
      en: "Use the Interactive Leonida Tactical Map to track all 50 pink smuggling flamingos; destroying all 50 also unlocks the Inflatable Flamingo vehicle.",
      es: "Usa el Mapa Táctico de Leonida para localizar los 50 flamencos rosas; destruirlos todos también desbloquea el Flamenco Inflable."
    }
  },
  {
    id: "t-silv-5",
    grade: "silver",
    secret: false,
    missable: false,
    title: {
      en: "Solid Gold Baby!",
      es: "Solid Gold Baby! (¡Oro Puro!)"
    },
    desc: {
      en: "Earn 50 Gold Medals across Story Missions and Strangers & Freaks encounters.",
      es: "Consigue 50 Medallas de Oro en Misiones de Historia y encuentros de Extraños y Locos."
    },
    guide: {
      en: "You can replay any completed mission from Pause > Progress > Missions to check off missed accuracy, time, or stealth objectives.",
      es: "Puedes repetir cualquier misión desde Pausa > Progreso > Misiones para cumplir los objetivos de precisión, tiempo o sigilo."
    }
  },
  {
    id: "t-silv-6",
    grade: "silver",
    secret: false,
    missable: false,
    title: {
      en: "Leonida Legend",
      es: "Leonida Legend (Leyenda de Leonida)"
    },
    desc: {
      en: "Accumulate $5,000,000 in combined clean cash and empire asset value.",
      es: "Acumula $5,000,000 combinando efectivo limpio y valor de activos de tu imperio."
    },
    guide: {
      en: "Combine passive daily property income, Tyrone narcotics sales from the Apollo Red Barn, and Randy's exotic car wish-list deliveries.",
      es: "Combina los ingresos diarios de tus 5 propiedades, ventas de narcóticos con Tyrone y entregas de superautos exóticos a Randy."
    }
  },

  // ---- BRONZE (46) ----
  {
    id: "t-brnz-01",
    grade: "bronze",
    secret: false,
    missable: true,
    chapter: "Chapter 1",
    title: {
      en: "Positive Mental Attitude",
      es: "Positive Mental Attitude (Actitud Mental Positiva)"
    },
    desc: {
      en: "MISSABLE: Clear your head on the balcony of Jason's House in the Leonida Keys before finishing Chapter 1.",
      es: "PERDIBLE: Despeja tu mente meditando en el balcón de la casa de Jason en Leonida Keys antes de terminar el Capítulo 1."
    },
    guide: {
      en: "CRITICAL MISSABLE! During Chapter 1 while playing as Jason, walk onto the wooden back balcony overlooking the Keys water and Hold D-Pad Right to lean & meditate for 30 seconds BEFORE starting theChapter 1 finale ('Tourist Trap'). Jason's house becomes inaccessible afterward!",
      es: "¡TROFEO PERDIBLE CRÍTICO! En el Capítulo 1 jugando con Jason, sal al balcón trasero de madera frente al mar en su casa de Leonida Keys y Mantén Cruceta Derecha para apoyarte y meditar 30 segundos ANTES de la misión final del Cap. 1 ('Tourist Trap'). ¡La casa se pierde después!"
    }
  },
  {
    id: "t-brnz-02",
    grade: "bronze",
    secret: true,
    missable: false,
    title: {
      en: "The Truth Is Out There",
      es: "The Truth Is Out There (La Verdad Está Ahí Fuera)"
    },
    desc: {
      en: "Experience an extraterrestrial close encounter in Kelly County at 2:00 AM.",
      es: "Experimenta un encuentro cercano extraterrestre en el Condado Kelly a las 2:00 AM."
    },
    guide: {
      en: "Travel to the abandoned barn clearing in northern Kelly County between 2:00 AM and 3:00 AM during stormy weather and step into the green tractor beam.",
      es: "Viaja al claro del granero abandonado al norte del Condado Kelly entre las 2:00 AM y 3:00 AM con clima de tormenta y entra en el rayo de luz verde."
    }
  },
  {
    id: "t-brnz-03",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "You WAiNKer!",
      es: "You WAiNKer! (¡Explorador WAiNK!)"
    },
    desc: {
      en: "Scan and log 100 points of interest across Leonida using the WAiNK phone app.",
      es: "Escanea y registra 100 puntos de interés en Leonida usando la aplicación móvil WAiNK."
    },
    guide: {
      en: "Click L3 + R3 (or open the WAiNK app on your phone) whenever the radar pulse icon flashes near landmarks, street art, or security hubs.",
      es: "Pulsa L3 + R3 (o abre la app WAiNK en el teléfono) cada vez que parpadee el icono de radar cerca de monumentos, murales o zonas clave."
    }
  },
  {
    id: "t-brnz-04",
    grade: "bronze",
    secret: true,
    missable: false,
    chapter: "Chapter 1",
    title: {
      en: "Tourist Trap",
      es: "Tourist Trap (Trampa para Turistas)"
    },
    desc: {
      en: "Escape the Key Lento raid and complete Chapter 1.",
      es: "Escapa de la redada en Key Lento y completa el Capítulo 1."
    },
    guide: {
      en: "WARNING: This mission wipes all pocket cash on hand! Deposit your money into the BuckMe Savings app on your phone before starting 'Tourist Trap'.",
      es: "¡ADVERTENCIA! Esta misión borra todo tu efectivo en mano. Deposita tu dinero en la app BuckMe Savings del teléfono antes de iniciar 'Tourist Trap'."
    }
  },
  {
    id: "t-brnz-05",
    grade: "bronze",
    secret: false,
    missable: true,
    chapter: "Chapter 2",
    title: {
      en: "Ghost of Port Gellhorn",
      es: "Ghost of Port Gellhorn (Fantasma de Port Gellhorn)"
    },
    desc: {
      en: "MISSABLE: Extract the Port Gellhorn customs ledger in Chapter 2 without alerting a single guard.",
      es: "PERDIBLE: Extrae el libro contable de la aduana de Port Gellhorn en el Cap. 2 sin alertar a ningún guardia."
    },
    guide: {
      en: "During the Chapter 2 dockyard infiltration, use non-lethal sleeper holds (Hold Circle/B) and cut the main breaker box before entering the office.",
      es: "Durante la infiltración al puerto en el Cap. 2, usa llaves de estrangulamiento no letales (Círculo/B) y corta la caja eléctrica antes de entrar."
    }
  },
  {
    id: "t-brnz-06",
    grade: "bronze",
    secret: false,
    missable: true,
    chapter: "Chapter 3",
    title: {
      en: "Strictly Professional",
      es: "Strictly Professional (Estrictamente Profesional)"
    },
    desc: {
      en: "MISSABLE: Complete three consecutive story heist setups while holding the 'Professional' Criminal Profile tier.",
      es: "PERDIBLE: Completa tres preparativos de golpe seguidos manteniendo el nivel 'Profesional' en tu Perfil Criminal."
    },
    guide: {
      en: "Avoid civilian casualties and use zip-ties/sleeper holds during Chapter 3 heist prep missions; do not drop into Violent or Irredeemable!",
      es: "Evita bajas civiles y usa bridas o derribos no letales en los preparativos del Capítulo 3; ¡nunca caigas al nivel permanente Irredimible!"
    }
  },
  {
    id: "t-brnz-07",
    grade: "bronze",
    secret: true,
    missable: false,
    chapter: "Chapter 2",
    title: {
      en: "West Coast Hustle",
      es: "West Coast Hustle (Negocios en la Costa Oeste)"
    },
    desc: {
      en: "Establish your safe house and chop-shop network in Port Gellhorn to finish Chapter 2.",
      es: "Establece tu piso franco y red de talleres en Port Gellhorn para completar el Capítulo 2."
    },
    guide: {
      en: "Story progression trophy unlocked after completing Moses and Dunk's final Port Gellhorn assignments.",
      es: "Trofeo de historia que se desbloquea automáticamente al terminar las misiones de Moses y Dunk en Port Gellhorn."
    }
  },
  {
    id: "t-brnz-08",
    grade: "bronze",
    secret: true,
    missable: false,
    chapter: "Chapter 3",
    title: {
      en: "Neon Homecoming",
      es: "Neon Homecoming (Regreso al Neón)"
    },
    desc: {
      en: "Take over the Little Cuba and Ocean Beach syndicates to complete Chapter 3.",
      es: "Toma el control de las redes de Little Cuba y Ocean Beach para completar el Capítulo 3."
    },
    guide: {
      en: "Unlocks automatically upon finishing the Chapter 3 finale in Vice City.",
      es: "Se desbloquea automáticamente al completar el final del Capítulo 3 en Vice City."
    }
  },
  {
    id: "t-brnz-09",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Ten-Second Car",
      es: "Ten-Second Car (Auto de Diez Segundos)"
    },
    desc: {
      en: "Find and claim the abandoned custom green sports eclipse in the Vice City parking garage.",
      es: "Encuentra y reclama el deportivo verde personalizado oculto en el estacionamiento de Vice City."
    },
    guide: {
      en: "Head to the top level of the Vice Beach multi-story parking deck (Pin #1 on the Tactical Map) and rip out the dashboard tracker.",
      es: "Sube al último piso del estacionamiento techado de Vice Beach (Pin #1 del Mapa Táctico) y llévate el auto homenaje a Paul Walker."
    }
  },
  {
    id: "t-brnz-10",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Tonight's the Night",
      es: "Tonight's the Night (Esta Es la Noche)"
    },
    desc: {
      en: "Discover the hidden trophy box inside the Trinity Apartments Bay Harbor condo.",
      es: "Descubre la caja oculta detrás del aire acondicionado en los apartamentos Trinity de Vice City."
    },
    guide: {
      en: "Enter the ground-floor corner unit at Trinity Apartments in Vice Beach and inspect the blood-slide air conditioner Easter egg.",
      es: "Entra al apartamento de la planta baja en Trinity Apartments (Vice Beach) e inspecciona el aire acondicionado del Easter egg de Dexter."
    }
  },
  {
    id: "t-brnz-11",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Literal Easter Egg",
      es: "Literal Easter Egg (Huevo de Pascua Literal)"
    },
    desc: {
      en: "Climb the tallest broadcast radio tower in Leonida and inspect the bird's nest at the summit.",
      es: "Escala la torre de radio más alta de Leonida e inspecciona el nido de pájaros en la cima."
    },
    guide: {
      en: "Climb the service ladders or parachute onto the central broadcast mast platform to find the nest holding three giant painted eggs.",
      es: "Sube por las escaleras de mantenimiento o aterriza en paracaídas en la cima de la torre de radio para ver el nido con huevos gigantes."
    }
  },
  {
    id: "t-brnz-12",
    grade: "bronze",
    secret: true,
    missable: false,
    title: {
      en: "Skunk Ape Sighting",
      es: "Skunk Ape Sighting (Avistamiento del Skunk Ape)"
    },
    desc: {
      en: "Photograph or track the legendary Cottonmouth Skunk Ape deep in the Grassrivers swamp.",
      es: "Fotografía o rastrea al legendario Skunk Ape en lo profundo de los pantanos de Grassrivers."
    },
    guide: {
      en: "Visit the foggy cypress grove in western Grassrivers between midnight and 4:00 AM and scan the creature with your camera or WAiNK app.",
      es: "Visita el bosque de cipreses con niebla al oeste de Grassrivers entre medianoche y las 4:00 AM y fotografía a la criatura."
    }
  },
  {
    id: "t-brnz-13",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Good Boy on Board",
      es: "Good Boy on Board (BuenChico a Bordo)"
    },
    desc: {
      en: "Rescue the stranded sunglasses-wearing dog on a Jet Ski off the Leonida Keys.",
      es: "Rescata al perro con gafas de sol varado en una moto de agua frente a Leonida Keys."
    },
    guide: {
      en: "Pull your boat or Jet Ski alongside the barking Golden Retriever ('Cool Dog') floating near Key Lento and escort him back to the marina dock.",
      es: "Acércate en moto de agua al perro con gafas de sol ('Cool Dog') cerca de Key Lento para que salte contigo y llévalo al muelle."
    }
  },
  {
    id: "t-brnz-14",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Outlaw Heritage",
      es: "Outlaw Heritage (Herencia Forajida)"
    },
    desc: {
      en: "Find and equip the weathered 1899 outlaw gambler's hat in Mount Kalaga National Park.",
      es: "Encuentra y equipa el sombrero desgastado de forajido de 1899 en el Parque Nacional Mount Kalaga."
    },
    guide: {
      en: "Search the old hunting cabin attic on the northern ridge of Mount Kalaga to find Arthur Morgan's leather hat.",
      es: "Registra el ático de la cabaña antigua en la cresta norte de Mount Kalaga para encontrar el sombrero de cuero de Arthur Morgan."
    }
  },
  {
    id: "t-brnz-15",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "ATM Rip & Tow",
      es: "ATM Rip & Tow (Cajero Remolcado)"
    },
    desc: {
      en: "Rip a reinforced wall ATM loose using a heavy pickup winch cable and crack it open.",
      es: "Arranca un cajero ATM de la pared usando el cable de remolque de una camioneta pesada."
    },
    guide: {
      en: "Back a winch-equipped truck up to an exterior convenience store ATM, attach the tow hook (Hold D-Pad Right), and floor the accelerator.",
      es: "Retrocede una camioneta con cabrestante frente a un cajero ATM exterior, engancha el cable (Mantén Cruceta Derecha) y acelera a fondo."
    }
  },
  {
    id: "t-brnz-16",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Skimmer Specialist",
      es: "Skimmer Specialist (Especialista en Clonación)"
    },
    desc: {
      en: "Hack 10 high-traffic Vice City ATMs using an electronic skimmer without triggering a police dispatch.",
      es: "Hackea 10 cajeros ATM en Vice City usando un skimmer electrónico sin activar una alerta policial."
    },
    guide: {
      en: "Purchase a Flipper Skimmer from Brian or Dunk, match the frequency waveform within the timer, and walk away calmly.",
      es: "Compra un Skimmer electrónico con un fence, iguala la onda de frecuencia dentro del límite de tiempo y aléjate caminando."
    }
  },
  {
    id: "t-brnz-17",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Red Barn Harvest",
      es: "Red Barn Harvest (Cosecha del Granero Rojo)"
    },
    desc: {
      en: "Clear out the Apollo Aggregates Red Barn stash and sell the narcotics to Tyrone in La Perle.",
      es: "Vacía el alijo del Granero Rojo de Apollo Aggregates y vende los narcóticos a Tyrone en La Perle."
    },
    guide: {
      en: "Breach the Apollo Aggregates barn in Ambrosia, load the high-purity duffel bags into your trunk, and deliver them to Tyrone for maximum payout.",
      es: "Entra al Granero Rojo en Ambrosia, guarda los paquetes en el maletero de tu auto y véndelos a Tyrone en La Perle al precio máximo."
    }
  },
  {
    id: "t-brnz-18",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Gone in 45 Seconds",
      es: "Gone in 45 Seconds (En 45 Segundos)"
    },
    desc: {
      en: "Rip out the GPS tracker from a stolen exotic supercar and register it with Moses in Port Gellhorn.",
      es: "Arranca el rastreador GPS de un superauto robado y regístralo con Moses en Port Gellhorn."
    },
    guide: {
      en: "Hold L1 + Square (LB + X) within 45 seconds of stealing a luxury vehicle to disable satellite tracking, then drive it into Moses' bay.",
      es: "Mantén L1 + Cuadrado (LB + X) durante los primeros 45 segundos tras robar un auto de lujo para cortar el GPS y llévalo al taller de Moses."
    }
  },
  {
    id: "t-brnz-19",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Randy's Wish List",
      es: "Randy's Wish List (La Lista de Randy)"
    },
    desc: {
      en: "Deliver 10 pristine exotic vehicles requested on Randy's Balsero export board.",
      es: "Entrega 10 vehículos exóticos impecables de la lista de exportación de Randy en Balsero."
    },
    guide: {
      en: "Check Randy's text messages in Chapter 3+ and deliver the requested Starfish Island and Vice Beach supercars without body damage.",
      es: "Revisa los mensajes de Randy desde el Capítulo 3 y entrega los superautos solicitados sin abolladuras en su muelle de Balsero."
    }
  },
  {
    id: "t-brnz-20",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "BuckMe Millionaire",
      es: "BuckMe Millionaire (Millonario en BuckMe)"
    },
    desc: {
      en: "Hold $1,000,000 inside your protected BuckMe Savings phone account at one time.",
      es: "Mantén $1,000,000 guardados dentro de tu cuenta protegida BuckMe Savings en el teléfono."
    },
    guide: {
      en: "Money stored in BuckMe Savings is 100% protected from police arrest confiscations and Chapter 1 story resets.",
      es: "El dinero depositado en la app BuckMe Savings está 100% protegido contra confiscaciones por arresto y reinicios de historia."
    }
  },
  {
    id: "t-brnz-21",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Muscle Sands Regular",
      es: "Muscle Sands Regular (Habitual de Muscle Sands)"
    },
    desc: {
      en: "Complete 50 outdoor gym workouts at Muscle Sands on Ocean Beach.",
      es: "Completa 50 entrenamientos en el gimnasio al aire libre Muscle Sands de Ocean Beach."
    },
    guide: {
      en: "Bench press, pull-ups, and heavy bag drills build your character's melee knockout power and stamina bar.",
      es: "Las pesas, dominadas y saco de boxeo en la playa aumentan la masa muscular, fuerza de golpeo y resistencia de tu personaje."
    }
  },
  {
    id: "t-brnz-22",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Two Guns, One Trunk",
      es: "Two Guns, One Trunk (Dos Armas y un Maletero)"
    },
    desc: {
      en: "Customize and fill every weapon slot inside your personal vehicle's trunk rack.",
      es: "Personaliza y llena todos los espacios del armero dentro del maletero de tu vehículo personal."
    },
    guide: {
      en: "Stand behind your personal car trunk and Hold L1 / LB to store heavy rifles, a shotgun, an RPG, and extra body armor plates.",
      es: "Párate detrás del maletero de tu auto personal y Mantén L1 / LB para guardar rifles pesados, escopeta, lanzacohetes y blindaje."
    }
  },
  {
    id: "t-brnz-23",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Partner in Crime",
      es: "Partner in Crime (Cómplices)"
    },
    desc: {
      en: "Rob 15 stores alongside your partner without either character getting downed.",
      es: "Asalta 15 tiendas junto a tu pareja sin que ninguno de los dos caiga herido."
    },
    guide: {
      en: "Call Jason or Lucia to hang out, enter convenience stores or pawn shops together, zip-tie the clerk, and split the register & safe cash.",
      es: "Llama a Jason o Lucía para salir, entren juntos a tiendas o casas de empeño, aten al cajero y vacíen la caja registradora."
    }
  },
  {
    id: "t-brnz-24",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Couples Therapy",
      es: "Couples Therapy (Terapia de Pareja)"
    },
    desc: {
      en: "Spend 4 cumulative hours on free-roam hangouts, clubs, or boat cruises with your partner.",
      es: "Pasa 4 horas acumuladas en salidas libres, discotecas o paseos en bote con tu pareja."
    },
    guide: {
      en: "Take your partner to Club Eleven, Ocean Beach bars, or a sunset speedboat ride across the Leonida Keys.",
      es: "Lleva a tu pareja a Club Eleven, bares de Ocean Beach o a navegar al atardecer por los Cayos de Leonida."
    }
  },
  {
    id: "t-brnz-25",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Airboat Ace",
      es: "Airboat Ace (As del Hidrodeslizador)"
    },
    desc: {
      en: "Jump 60 meters off a Grassrivers mangrove ramp in a modified V8 Airboat.",
      es: "Salta 60 metros desde una rampa de manglar en Grassrivers usando un hidrodeslizador V8."
    },
    guide: {
      en: "Hit the wooden smuggling dock ramps in central Grassrivers at full throttle in a custom airboat.",
      es: "Acelera a fondo hacia las rampas de madera de los contrabandistas en el centro de Grassrivers."
    }
  },
  {
    id: "t-brnz-26",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Swamp Apex Predator",
      es: "Swamp Apex Predator (Depredador del Pantano)"
    },
    desc: {
      en: "Survive an alligator ambush in Grassrivers while carrying a heavy loot duffel bag.",
      es: "Sobrevive al ataque de un caimán en Grassrivers mientras cargas un bolso pesado de botín."
    },
    guide: {
      en: "Use Focus mode or a high-caliber sidearm when wading through shallow Grassrivers marshes at night.",
      es: "Usa el modo Focus o una pistola de alto calibre al cruzar aguas poco profundas de Grassrivers de noche."
    }
  },
  {
    id: "t-brnz-27",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Trailer Park Launch",
      es: "Trailer Park Launch (Lanzamiento desde Remolque)"
    },
    desc: {
      en: "Tow a speedboat across two regions on a truck trailer and launch it cleanly at a marina ramp.",
      es: "Remolca una lancha a través de dos regiones en tráiler y lánzala al agua en una rampa de marina."
    },
    guide: {
      en: "Hitch a boat trailer in Port Gellhorn, drive to Leonida Keys, back down the slipway, and Hold D-Pad Right to release the winch.",
      es: "Engancha un remolque con bote en Port Gellhorn, conduce hasta Leonida Keys, retrocede en la rampa y Mantén Cruceta Derecha."
    }
  },
  {
    id: "t-brnz-28",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Pirate Frequency",
      es: "Pirate Frequency (Frecuencia Pirata)"
    },
    desc: {
      en: "Collect all hidden Vault Media Sticks and unlock Vault Radio on your stereo dial.",
      es: "Recolecta todas las memorias USB ocultas y desbloquea la emisora secreta Vault Radio."
    },
    guide: {
      en: "Locate the hidden pirate broadcast media sticks at radio towers, nightclub DJ booths, and smuggling docks to unlock Vault Radio.",
      es: "Encuentra las memorias USB piratas en torres de radio, cabinas de DJ y muelles de contrabando para activar Vault Radio."
    }
  },
  {
    id: "t-brnz-29",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Earbuds & Ocean Breeze",
      es: "Earbuds & Ocean Breeze (Audífonos y Brisa Marina)"
    },
    desc: {
      en: "Listen to Leonida radio stations on foot with earbuds for 60 cumulative minutes.",
      es: "Escucha emisoras de radio de Leonida a pie con audífonos durante 60 minutos acumulados."
    },
    guide: {
      en: "Hold L1 + Tap D-Pad Left (or use the Phone Music App) while walking or jogging along Vice Beach.",
      es: "Mantén L1 + Cruceta Izquierda (o usa la App de Música del teléfono) mientras caminas o entrenas por Vice Beach."
    }
  },
  {
    id: "t-brnz-30",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Hood Slider",
      es: "Hood Slider (Deslizamiento de Película)"
    },
    desc: {
      en: "Slide across 25 car hoods during active police foot pursuits.",
      es: "Deslízate sobre el capó de 25 autos durante persecuciones policiales a pie."
    },
    guide: {
      en: "Sprint toward the front fender of any stopped car during a chase and Tap Square (PS5) / X (Xbox) to hood-slide.",
      es: "Corre hacia la parte delantera de cualquier auto detenido durante una persecución y Pulsa Cuadrado (PS5) / X (Xbox)."
    }
  },
  {
    id: "t-brnz-31",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Door Check!",
      es: "Door Check! (¡Puertazo!)"
    },
    desc: {
      en: "Knock 10 pursuing bikers or enemies down by kicking your car door open.",
      es: "Derriba a 10 motociclistas o enemigos pateando la puerta de tu auto al conducir."
    },
    guide: {
      en: "Hold L2 + Press Circle (PS5) or Hold LT + Press B (Xbox) right as a pursuing motorcycle pulls beside your door.",
      es: "Mantén L2 + Pulsa Círculo (PS5) o Mantén LT + Pulsa B (Xbox) justo cuando una moto enemiga se empareje con tu puerta."
    }
  },
  {
    id: "t-brnz-32",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Put Your Back Into It",
      es: "Put Your Back Into It (Fuerza Bruta)"
    },
    desc: {
      en: "Flip an overturned vehicle back onto its tires or push a beached boat back into deep water.",
      es: "Voltea un auto volcado sobre sus ruedas o empuja una lancha encallada de regreso al mar."
    },
    guide: {
      en: "Approach any flipped car or sandbar-stranded boat on foot and Hold Square / X + Left Stick Up to push it upright.",
      es: "Acércate a pie a un auto volcado o bote encallado y Mantén Cuadrado / X + Stick Izquierdo hacia adelante para empujarlo."
    }
  },
  {
    id: "t-brnz-33",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Sleeper Agent",
      es: "Sleeper Agent (Agente Durmiente)"
    },
    desc: {
      en: "Silently choke out 25 armed guards without triggering a single alarm.",
      es: "Deja inconscientes en silencio a 25 guardias armados sin activar ninguna alarma."
    },
    guide: {
      en: "Sneak behind guards in crouch/prone stance, grapple with Triangle/Y, and Hold Circle/B for a silent non-lethal takedown.",
      es: "Acércate en sigilo por detrás, agarra con Triángulo/Y y Mantén Círculo/B para aplicar una llave no letal en silencio."
    }
  },
  {
    id: "t-brnz-34",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Zip-Tie Tycoon",
      es: "Zip-Tie Tycoon (Maestro de las Bridas)"
    },
    desc: {
      en: "Intimidate and zip-tie 20 guards or store clerks without firing a single bullet.",
      es: "Intimida y ata con bridas a 20 guardias o cajeros sin disparar una sola bala."
    },
    guide: {
      en: "Aim at close range (L2/LT), Press Triangle/Y to force surrender, then Hold Square/X to secure their wrists with heavy zip-ties.",
      es: "Apunta de cerca (L2/LT), Pulsa Triángulo/Y para ordenar que se rindan y Mantén Cuadrado/X para asegurarlos con bridas."
    }
  },
  {
    id: "t-brnz-35",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Armored Ambush",
      es: "Armored Ambush (Emboscada Blindada)"
    },
    desc: {
      en: "Breach 5 Gruppe Sechs armored security vans and escape with the Marked Bills cases.",
      es: "Asalta 5 camiones blindados Gruppe Sechs y escapa con los maletines de Billetes Marcados."
    },
    guide: {
      en: "Buy armored van route schedules from Yasmani, blow the rear doors with a sticky charge, and launder the Marked Bills immediately.",
      es: "Compra las rutas de camiones blindados con Yasmani, vuela las puertas traseras con explosivo adhesivo y lava los billetes."
    }
  },
  {
    id: "t-brnz-36",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Seven Bridges Run",
      es: "Seven Bridges Run (A Todo Gas por los Cayos)"
    },
    desc: {
      en: "Drive from Downtown Vice City to South Key Lento in under 4 minutes without crashing.",
      es: "Conduce desde el centro de Vice City hasta el sur de Key Lento en menos de 4 minutos sin chocar."
    },
    guide: {
      en: "Use a fully upgraded Cheetah Classic or Banshee 900R at night when Overseas Highway bridge traffic is lightest.",
      es: "Usa un Cheetah Classic o Banshee 900R mejorado al máximo de madrugada cuando hay poco tráfico en los puentes hacia los Cayos."
    }
  },
  {
    id: "t-brnz-37",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Kalaga Peak Base Jump",
      es: "Kalaga Peak Base Jump (Salto Base en Mount Kalaga)"
    },
    desc: {
      en: "Parachute from the highest summit of Mount Kalaga and land on a moving train or flatbed truck.",
      es: "Salta en paracaídas desde la cima de Mount Kalaga y aterriza sobre un tren o camión en movimiento."
    },
    guide: {
      en: "Hold L1 + R1 (LB + RB) during final descent for precision stall-braking onto the freight cars passing below the ridge.",
      es: "Mantén L1 + R1 (LB + RB) en el descenso final para frenar con precisión sobre los vagones de carga que pasan bajo la montaña."
    }
  },
  {
    id: "t-brnz-38",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Sunken Contraband",
      es: "Sunken Contraband (Contrabando Hundido)"
    },
    desc: {
      en: "Drop anchor and recover 10 sunken smuggling crates from Leonida Keys coral reefs.",
      es: "Echa el ancla y recupera 10 cajas de contrabando hundidas en los arrecifes de Leonida Keys."
    },
    guide: {
      en: "Stop your boat over reef markers, Hold R1 + D-Pad Down to anchor & equip scuba gear, and pry open the waterproof cases.",
      es: "Detén tu bote sobre los arrecifes, Mantén R1 + Cruceta Abajo para anclar y equipar buceo, y abre las cajas sumergidas."
    }
  },
  {
    id: "t-brnz-39",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Range Master",
      es: "Range Master (Maestro del Polígono)"
    },
    desc: {
      en: "Earn a Gold Medal in every weapon category at a Leonida Gun Club shooting range.",
      es: "Consigue una Medalla de Oro en cada categoría de armas en cualquier campo de tiro de Leonida."
    },
    guide: {
      en: "Winning 25 Gold Medals at shooting ranges also unlocks the 'No Reload' cheat challenge after completing the campaign.",
      es: "Ganar medallas de Oro en el polígono de tiro también progresa el desafío del truco 'Sin Recarga' tras terminar la historia."
    }
  },
  {
    id: "t-brnz-40",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Under the Radar",
      es: "Under the Radar (Bajo el Radar)"
    },
    desc: {
      en: "Fly a smuggling seaplane under 5 Leonida highway bridges in a single flight.",
      es: "Vuela un hidroavión de contrabando por debajo de 5 puentes de Leonida en un solo vuelo."
    },
    guide: {
      en: "Retract your landing gear (Click L3 / LS) right after takeoff and skim under the high-span Overseas Highway bridges.",
      es: "Sube el tren de aterrizaje (Pulsa L3 / LS) al despegar y pasa bajo los tramos altos de los puentes hacia Leonida Keys."
    }
  },
  {
    id: "t-brnz-41",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Heat Wave Survivor",
      es: "Heat Wave Survivor (Sobreviviente de 5 Estrellas)"
    },
    desc: {
      en: "Escape a 5-star LCPD and NOOSE tactical pursuit alive without using Pay 'n' Spray.",
      es: "Escapa con vida de una persecución policial de 5 estrellas sin usar talleres de pintura."
    },
    guide: {
      en: "Use thedowntown Vice City subway storm drains or disappear deep into the Grassrivers mangrove canopy in prone stance.",
      es: "Usa los túneles de drenaje subterráneos de Vice City o piérdete bajo los manglares de Grassrivers cuerpo a tierra."
    }
  },
  {
    id: "t-brnz-42",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Black Market Network",
      es: "Black Market Network (Red del Mercado Negro)"
    },
    desc: {
      en: "Complete a verified transaction with all 7 Black-Market Fences across Leonida.",
      es: "Completa al menos una venta con cada uno de los 7 Fences del mercado negro de Leonida."
    },
    guide: {
      en: "Sell loot to Brian and Donnie in Chapter 1 before they close, then deal with Moses, Dunk, Tyrone, Yasmani, and Randy!",
      es: "Vende mercancía a Brian y Donnie en el Cap. 1 antes de que cierren, y luego negocia con Moses, Dunk, Tyrone, Yasmani y Randy."
    }
  },
  {
    id: "t-brnz-43",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Keypad Cracker",
      es: "Keypad Cracker (Experto en Códigos)"
    },
    desc: {
      en: "Open 10 keypad-locked stash rooms and safes using discovered combination codes.",
      es: "Abre 10 puertas con teclado y cajas fuertes usando códigos descubiertos en el mundo."
    },
    guide: {
      en: "Start with Brian's South Key Lento backroom keypad (code: 7700) in Chapter 1 and inspect office whiteboards during robberies.",
      es: "Empieza con el teclado de Brian en el sur de Key Lento (código: 7700) en el Cap. 1 y revisa pizarras y notas en oficinas."
    }
  },
  {
    id: "t-brnz-44",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Vice City High Roller",
      es: "Vice City High Roller (Magnate Nocturno)"
    },
    desc: {
      en: "Earn $100,000 in daily passive income from your owned Leonida properties.",
      es: "Genera $100,000 acumulados en ingresos pasivos diarios gracias a tus propiedades en Leonida."
    },
    guide: {
      en: "Purchase the Ocean Beach Nightclub and Starfish Island Penthouse early in Chapter 3 to maximize daily passive cash flow.",
      es: "Compra el Club Nocturno de Ocean Beach y el Penthouse de Starfish Island en el Cap. 3 para maximizar tus ganancias diarias."
    }
  },
  {
    id: "t-brnz-45",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Stunt Devil of Leonida",
      es: "Stunt Devil of Leonida (Acróbata de Leonida)"
    },
    desc: {
      en: "Complete 25 Unique Stunt Jumps across all 6 Leonida regions.",
      es: "Completa 25 Saltos Acrobáticos Únicos en las 6 regiones de Leonida."
    },
    guide: {
      en: "Use a fast motorcycle or nitro-equipped sports car on rooftop parking ramps, canal drawbridges, and quarry cliffs.",
      es: "Usa una motocicleta rápida o deportivo en rampas de estacionamientos, puentes levadizos y canteras de Ambrosia."
    }
  },
  {
    id: "t-brnz-46",
    grade: "bronze",
    secret: false,
    missable: false,
    title: {
      en: "Strangers in Paradise",
      es: "Strangers in Paradise (Extraños en el Paraíso)"
    },
    desc: {
      en: "Complete 15 Strangers & Freaks side-mission chains across Leonida.",
      es: "Completa 15 cadenas de misiones secundarias de Extraños y Locos en toda Leonida."
    },
    guide: {
      en: "Look for cyan '?' question-mark radar blips across Vice Beach, Port Gellhorn, and Grassrivers as you progress each chapter.",
      es: "Busca los iconos '?' de color cian en el radar por Vice Beach, Port Gellhorn y Grassrivers al avanzar en cada capítulo."
    }
  }
];
