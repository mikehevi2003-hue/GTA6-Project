import "server-only";

import type { RadioStation } from "@/types/vicelink";

export const RADIO_STATIONS_DATA: RadioStation[] = [
  // 1. Cocoteo FM
  {
    id: "radio-cocoteo-fm",
    name: "Cocoteo FM 99.1",
    genre: "Urbano / Reggaeton",
    hosts: "Bad Bunny (El Martillo) & RaiNao (La Gata)",
    vibe: {
      en: "High-voltage Caribbean reggaeton, Latin trap, and dembow booming from Little Cuba to Ocean Beach.",
      es: "Reggaetón caribeño de alto voltaje, trap latino y dembow retumbando desde Little Cuba hasta Ocean Beach."
    },
    tracks: [
      { id: "coc-1", title: "MONACO", artist: "Bad Bunny", year: "2023", featured: true },
      { id: "coc-2", title: "TITÍ ME PREGUNTÓ", artist: "Bad Bunny", year: "2022", featured: true },
      { id: "coc-3", title: "tentretiene", artist: "RaiNao", year: "2024", featured: true },
      { id: "coc-4", title: "LUNA", artist: "Feid & ATL Jacob", year: "2023", featured: true },
      { id: "coc-5", title: "OKI DOKI", artist: "Karol G", year: "2023", featured: true },
      { id: "coc-6", title: "LALA", artist: "Myke Towers", year: "2023", featured: true }
    ]
  },

  // 2. Worldwide FM
  {
    id: "radio-worldwide-fm",
    name: "Worldwide FM",
    genre: "World / Jazz",
    hosts: "Gilles Peterson",
    vibe: {
      en: "Eclectic global soul, yacht groove, acid jazz, and crate-dug rarities curated for coastal sunset drives.",
      es: "Soul global ecléctico, acid jazz, groove costero y joyas de vinilo seleccionadas para conducir al atardecer."
    },
    tracks: [
      { id: "ww-1", title: "What You Won't Do For Love", artist: "Bobby Caldwell", year: "1978", featured: true },
      { id: "ww-2", title: "Smile", artist: "Jamiroquai", year: "2006", featured: true },
      { id: "ww-3", title: "Rebirth of Slick (Cool Like Dat)", artist: "Digable Planets", year: "1992", featured: true },
      { id: "ww-4", title: "Lion", artist: "Little Simz & Obongjayar", year: "2025", featured: true },
      { id: "ww-5", title: "Del Oro", artist: "Floating Points", year: "2024", featured: true },
      { id: "ww-6", title: "Kamikazi", artist: "D'Angelo", year: "2000", featured: true },
      { id: "ww-7", title: "Qué es lo que Haré para Amarte", artist: "Luis Antonio Diaz y Su Sol Banda", year: "1981", featured: true }
    ]
  },

  // 3. AfroBank FM
  {
    id: "radio-afrobank-fm",
    name: "AfroBank FM 104.3",
    genre: "Afrobeats",
    hosts: "Burna Boy",
    vibe: {
      en: "Infectious Lagos Afrobeats, Amapiano log-drums, and vintage Afro-synth classics hosted by the African Giant.",
      es: "Afrobeats de Lagos, percusiones Amapiano y clásicos de afro-synth presentados directamente por Burna Boy."
    },
    tracks: [
      { id: "ab-1", title: "Giza", artist: "Burna Boy ft. Seyi Vibez", year: "2023", featured: true },
      { id: "ab-2", title: "Joha", artist: "Asake", year: "2022", featured: true },
      { id: "ab-3", title: "Holy Ghost", artist: "Omah Lay", year: "2023", featured: true },
      { id: "ab-4", title: "Wadibusa", artist: "Uncle Waffles", year: "2023", featured: true },
      { id: "ab-5", title: "YAWA", artist: "Fireboy DML", year: "2023", featured: true },
      { id: "ab-6", title: "SEX BILLS BASS THRILLS", artist: "Ayra Starr", year: "2025", featured: true },
      { id: "ab-7", title: "Fantastic Man", artist: "William Onyeabor", year: "1979", featured: true }
    ]
  },

  // 4. Back Country Radio
  {
    id: "radio-back-country",
    name: "Back Country Radio 94.7",
    genre: "Country",
    hosts: "Morgan Wallen & Lana Del Rey",
    vibe: {
      en: "Southern gothic ballads, whiskey-soaked modern country, and dusty highway anthems from Port Gellhorn to Ambrosia.",
      es: "Baladas góticas sureñas, country moderno y clásicos de carretera polvorienta desde Port Gellhorn hasta Ambrosia."
    },
    tracks: [
      { id: "bc-1", title: "Last Night", artist: "Morgan Wallen", year: "2023", featured: true },
      { id: "bc-2", title: "Tough", artist: "Quavo & Lana Del Rey", year: "2024", featured: true },
      { id: "bc-3", title: "Ride", artist: "Lana Del Rey", year: "2012", featured: true },
      { id: "bc-4", title: "Fast Car", artist: "Luke Combs", year: "2023" },
      { id: "bc-5", title: "Seminole Wind", artist: "John Anderson", year: "1992", featured: true }
    ]
  },

  // 5. The Chamber 106.6
  {
    id: "radio-the-chamber",
    name: "The Chamber 106.6",
    genre: "Rock / Metal",
    hosts: "Kerry King & Tom Araya (Slayer)",
    vibe: {
      en: "Unrelenting thrash metal, Florida death metal heritage, and blistering hardcore riffs for 5-star rampages.",
      es: "Thrash metal implacable, herencia death metal de Florida y riffs brutales para persecuciones de 5 estrellas."
    },
    tracks: [
      { id: "ch-1", title: "Raining Blood", artist: "Slayer", year: "1986", featured: true },
      { id: "ch-2", title: "South of Heaven", artist: "Slayer", year: "1988", featured: true },
      { id: "ch-3", title: "Idle Hands", artist: "Kerry King", year: "2024", featured: true },
      { id: "ch-4", title: "Crystal Mountain", artist: "Death", year: "1995" },
      { id: "ch-5", title: "Davidian", artist: "Machine Head", year: "1994" }
    ]
  },

  // 6. Flash FM
  {
    id: "radio-flash-fm",
    name: "Flash FM",
    genre: "80s Pop",
    hosts: "Toni",
    vibe: {
      en: "Vice City's legendary neon-drenched 1980s synth-pop, new wave, and stadium rock time capsule.",
      es: "La legendaria emisora de Vice City con synth-pop de los años 80, new wave y clásicos bañados en neón."
    },
    tracks: [
      { id: "fl-1", title: "Love Is A Long Road", artist: "Tom Petty", year: "1989", featured: true },
      { id: "fl-2", title: "Self Control", artist: "Laura Branigan", year: "1984", featured: true },
      { id: "fl-3", title: "Out of Touch", artist: "Hall & Oates", year: "1984", featured: true },
      { id: "fl-4", title: "Dance Hall Days", artist: "Wang Chung", year: "1984" },
      { id: "fl-5", title: "Run to You", artist: "Bryan Adams", year: "1984" }
    ]
  },

  // 7. Vault Radio
  {
    id: "radio-vault-radio",
    name: "Vault Radio",
    genre: "Unlockable",
    hosts: "DJ Laz & Pirate Broadcast Signal",
    vibe: {
      en: "Secret pirate frequency broadcasting unreleased Rockstar vault mixes, Vice City bass anthems, and hidden lore tapes.",
      es: "Frecuencia pirata secreta con mezclas inéditas de Rockstar, clásicos de Miami Bass y cintas ocultas de Leonida."
    },
    unlockNote: {
      en: "Unlocked by collecting hidden Vault Media Sticks & Vintage Audio Reels scattered across Leonida's 6 regions.",
      es: "Se desbloquea recolectando las memorias USB (Media Sticks) y cintas de audio ocultas en las 6 regiones de Leonida."
    },
    tracks: [
      { id: "vr-1", title: "Vice City Theme (Leonida 2026 Redux)", artist: "Lex Luger & Rockstar Sound Lab", year: "2026", featured: true },
      { id: "vr-2", title: "Esa Morena", artist: "DJ Laz", year: "1998", featured: true },
      { id: "vr-3", title: "Silver Lining (Key Lento Session)", artist: "The Alchemist", year: "2026", featured: true },
      { id: "vr-4", title: "Midnight Over Kelly County", artist: "Tangerine Dream", year: "2026" }
    ]
  },

  // 8. Dirty South 305 FM
  {
    id: "radio-dirty-south-305",
    name: "Dirty South 305 FM",
    genre: "Hip-Hop / Dirty South",
    hosts: "Trick Daddy & Trina",
    vibe: {
      en: "Trunk-rattling 808 bass, Dade County classics, and raw Florida street anthems built for custom donks.",
      es: "Bajos 808 que hacen vibrar el maletero, clásicos del sur de Florida e himnos callejeros para autos modificados."
    },
    tracks: [
      { id: "ds-1", title: "Nann Nigga", artist: "Trick Daddy ft. Trina", year: "1998", featured: true },
      { id: "ds-2", title: "First Day Out", artist: "Kodak Black", year: "2017", featured: true },
      { id: "ds-3", title: "Ultimate", artist: "Denzel Curry", year: "2015", featured: true },
      { id: "ds-4", title: "Hustlin'", artist: "Rick Ross", year: "2006", featured: true }
    ]
  },

  // 9. Vice Beach Underground 101.5
  {
    id: "radio-vice-beach-underground",
    name: "Vice Beach Underground 101.5",
    genre: "Electronic / Club",
    hosts: "Peggy Gou & Danny Tenaglia",
    vibe: {
      en: "4 AM Ocean Drive rooftop tech-house, Balearic sunrise rollers, and deep club euphoria.",
      es: "Tech-house de azotea a las 4 AM en Ocean Drive, electrónica de amanecer y euforia de club nocturno."
    },
    tracks: [
      { id: "vb-1", title: "(It Goes Like) Nanana", artist: "Peggy Gou", year: "2023", featured: true },
      { id: "vb-2", title: "Music Is the Answer", artist: "Danny Tenaglia", year: "1998", featured: true },
      { id: "vb-3", title: "Rumble", artist: "Skrillex, Fred again.. & Flowdan", year: "2023" }
    ]
  },

  // 10. Leonida Public Radio (WCTR South)
  {
    id: "radio-leonida-public",
    name: "WCTR Leonida Talk 88.5",
    genre: "Talk & News",
    hosts: "Lazlow Jones & Fernando Martinez",
    vibe: {
      en: "Unhinged Florida call-in shows, conspiracy theories, crypto-bro meltdowns, and live breaking crime alerts.",
      es: "Llamadas en vivo delirantes de ciudadanos de Leonida, conspiraciones, estafas cripto y alertas policiales."
    },
    tracks: [
      { id: "lp-1", title: "Florida Man Hour: Alligator in the Drive-Thru", artist: "WCTR Talk Desk", year: "2026", featured: true },
      { id: "lp-2", title: "Fernando's Passion Palace Live from Vice Beach", artist: "Fernando Martinez", year: "2026", featured: true },
      { id: "lp-3", title: "Mount Kalaga Truthers & The 2 AM Lights", artist: "Omega & Callers", year: "2026" }
    ]
  },

  // 11. Calle Ocho 92.5 (Espantoso)
  {
    id: "radio-calle-ocho",
    name: "Radio Espantoso 92.5",
    genre: "World / Jazz",
    hosts: "DJ Pepe & Cachao Jr.",
    vibe: {
      en: "Blazing Little Cuba salsa dura, Afro-Cuban mambo, Latin jazz brass, and domino-park classics.",
      es: "Salsa dura de Little Cuba, mambo afrocubano, metales de jazz latino y clásicos de parque de dominó."
    },
    tracks: [
      { id: "re-1", title: "La Vida Es Un Carnaval", artist: "Celia Cruz", year: "1998", featured: true },
      { id: "re-2", title: "Aguanile", artist: "Héctor Lavoe & Willie Colón", year: "1972", featured: true },
      { id: "re-3", title: "Ran Kan Kan", artist: "Tito Puente", year: "1958" }
    ]
  },

  // 12. V-Rock 103.1
  {
    id: "radio-v-rock",
    name: "V-Rock 103.1",
    genre: "Rock / Metal",
    hosts: "Couzin Ed",
    vibe: {
      en: "Classic hard rock, 80s hair metal solos, and roaring highway guitars across the Leonida Keys causeways.",
      es: "Hard rock clásico, solos de guitarra de los 80 y himnos de carretera para cruzar los puentes de los Cayos."
    },
    tracks: [
      { id: "vrk-1", title: "Kickstart My Heart", artist: "Mötley Crüe", year: "1989", featured: true },
      { id: "vrk-2", title: "Peace Sells", artist: "Megadeth", year: "1986", featured: true },
      { id: "vrk-3", title: "Bark at the Moon", artist: "Ozzy Osbourne", year: "1983" }
    ]
  },

  // 13. Fever 105
  {
    id: "radio-fever-105",
    name: "Fever 105",
    genre: "80s Pop",
    hosts: "Oliver 'Ladykiller' Biscuit",
    vibe: {
      en: "Silky 80s boogie, post-disco funk, and late-night R&B grooves for neon penthouse cruises.",
      es: "Boogie de los 80, funk post-disco y R&B nocturno para recorrer la bahía bajo las luces de neón."
    },
    tracks: [
      { id: "fev-1", title: "And the Beat Goes On", artist: "The Whispers", year: "1979", featured: true },
      { id: "fev-2", title: "Act Like You Know", artist: "Fat Larry's Band", year: "1982", featured: true },
      { id: "fev-3", title: "Never Too Much", artist: "Luther Vandross", year: "1981" }
    ]
  },

  // 14. Port Gellhorn Bass 96.3
  {
    id: "radio-gellhorn-bass",
    name: "Gellhorn Bass 96.3",
    genre: "Hip-Hop / Dirty South",
    hosts: "Uncle Luke & City Girls",
    vibe: {
      en: "Unapologetic Miami Bass, fast-tempo booty-shake classics, and Gulf Coast strip-club bangers.",
      es: "Auténtico Miami Bass de alta velocidad y éxitos explosivos de la costa oeste de Leonida."
    },
    tracks: [
      { id: "gb-1", title: "I Wanna Rock", artist: "Luke", year: "1992", featured: true },
      { id: "gb-2", title: "Act Up", artist: "City Girls", year: "2018", featured: true },
      { id: "gb-3", title: "C'mon N' Ride It (The Train)", artist: "Quad City DJ's", year: "1996" }
    ]
  },

  // 15. Wave 103
  {
    id: "radio-wave-103",
    name: "Wave 103",
    genre: "80s Pop",
    hosts: "Adam First",
    vibe: {
      en: "British synth-pop, dark new wave, and post-punk classics for rainy midnight drives.",
      es: "Synth-pop británico, new wave oscuro y clásicos post-punk para noches lluviosas en la autopista."
    },
    tracks: [
      { id: "wv-1", title: "Blue Monday", artist: "New Order", year: "1983", featured: true },
      { id: "wv-2", title: "Sunglasses at Night", artist: "Corey Hart", year: "1984", featured: true },
      { id: "wv-3", title: "Obsession", artist: "Animotion", year: "1984" }
    ]
  },

  // 16. Grassrivers Swamp & Honky-Tonk 90.9
  {
    id: "radio-grassrivers-honkytonk",
    name: "Swamp & Steel 90.9",
    genre: "Country",
    hosts: "Hank Williams III & Sierra Ferrell",
    vibe: {
      en: "Outlaw honky-tonk, bluegrass banjo picking, and southern swamp rock built for airboat chases.",
      es: "Country forajido, bluegrass de banjo rápido y rock sureño de pantano ideal para persecuciones en hidrodeslizador."
    },
    tracks: [
      { id: "ss-1", title: "Born on the Bayou", artist: "Creedence Clearwater Revival", year: "1969", featured: true },
      { id: "ss-2", title: "Gimme Three Steps", artist: "Lynyrd Skynyrd", year: "1973", featured: true },
      { id: "ss-3", title: "Dollar Bill Bar", artist: "Sierra Ferrell", year: "2024" }
    ]
  },

  // 17. Perreo 24/7 FM
  {
    id: "radio-perreo-247",
    name: "Perreo 24/7 FM",
    genre: "Urbano / Reggaeton",
    hosts: "DJ Luian & Ivy Queen",
    vibe: {
      en: "Old-school underground San Juan reggaeton clasicos mixed with modern Vice City club perreo.",
      es: "Clásicos underground de la vieja escuela del reggaetón mezclados con perreo moderno de discoteca."
    },
    tracks: [
      { id: "pr-1", title: "Quiero Bailar", artist: "Ivy Queen", year: "2003", featured: true },
      { id: "pr-2", title: "Gasolina", artist: "Daddy Yankee", year: "2004", featured: true },
      { id: "pr-3", title: "Safaera", artist: "Bad Bunny, Jowell & Randy & Ñengo Flow", year: "2020", featured: true }
    ]
  },

  // 18. Club Eleven 107.9
  {
    id: "radio-club-eleven",
    name: "Club Eleven 107.9",
    genre: "Electronic / Club",
    hosts: "John Summit & Disclosure",
    vibe: {
      en: "Non-stop 24-hour downtown Vice City superclub anthems, melodic techno, and festival mainstage drops.",
      es: "Éxitos ininterrumpidos de las megadiscotecas del centro de Vice City, techno melódico y house de festival."
    },
    tracks: [
      { id: "ce-1", title: "Where You Are", artist: "John Summit & Hayla", year: "2023", featured: true },
      { id: "ce-2", title: "She's Gone, Dance On", artist: "Disclosure", year: "2024", featured: true },
      { id: "ce-3", title: "Strobe", artist: "deadmau5", year: "2009" }
    ]
  },

  // 19. Emotion 98.3
  {
    id: "radio-emotion-983",
    name: "Emotion 98.3",
    genre: "80s Pop",
    hosts: "Fernando Martinez",
    vibe: {
      en: "Power ballads, heartbreak anthems, and dramatic slow-motion getaway soundtracks.",
      es: "Baladas poderosas de los 80, himnos de desamor y canciones dramáticas para huidas en cámara lenta."
    },
    tracks: [
      { id: "em-1", title: "Africa", artist: "Toto", year: "1982", featured: true },
      { id: "em-2", title: "Waiting for a Girl Like You", artist: "Foreigner", year: "1981", featured: true },
      { id: "em-3", title: "Broken Wings", artist: "Mr. Mister", year: "1985" }
    ]
  },

  // 20. Kalaga Outlaw Rock 97.5
  {
    id: "radio-kalaga-outlaw",
    name: "Kalaga Rock 97.5",
    genre: "Rock / Metal",
    hosts: "Josh Homme & Iggy Pop",
    vibe: {
      en: "Fuzzy desert-meets-swamp stoner rock, garage punk, and mountain highway overdrive.",
      es: "Rock alternativo pesado, garage punk y guitarras distorsionadas para las rutas de Mount Kalaga."
    },
    tracks: [
      { id: "kr-1", title: "No One Knows", artist: "Queens of the Stone Age", year: "2002", featured: true },
      { id: "kr-2", title: "The Passenger", artist: "Iggy Pop", year: "1977", featured: true },
      { id: "kr-3", title: "Rooster", artist: "Alice in Chains", year: "1992" }
    ]
  },

  // 21. La Perle Creole & Konpa 100.7
  {
    id: "radio-la-perle-konpa",
    name: "Radio La Perle 100.7",
    genre: "World / Jazz",
    hosts: "Wyclef Jean & Michaël Brun",
    vibe: {
      en: "Vibrant Haitian Konpa, Zouk, Rabòday rhythms, and French-Caribbean street carnival energy from La Perle.",
      es: "Vibrante Konpa haitiano, Zouk, ritmos Rabòday y energía de carnaval caribeño desde el barrio La Perle."
    },
    tracks: [
      { id: "lp-k1", title: "Guantanamera", artist: "Wyclef Jean ft. Celia Cruz", year: "1997", featured: true },
      { id: "lp-k2", title: "Positif", artist: "Michaël Brun & Shirazee", year: "2023", featured: true },
      { id: "lp-k3", title: "Mwen Renmen W", artist: "Carimi", year: "2009" }
    ]
  },

  // 22. Ambrosia Trap & Drill 102.9
  {
    id: "radio-ambrosia-trap",
    name: "Ambrosia 102.9 FM",
    genre: "Hip-Hop / Dirty South",
    hosts: "Future & Metro Boomin",
    vibe: {
      en: "Cinematic dark trap beats, heavy sub-bass, and high-stakes heist music across central Leonida.",
      es: "Trap oscuro cinematográfico, bajos profundos y música de alto riesgo para golpes bancarios en Leonida."
    },
    tracks: [
      { id: "am-1", title: "Like That", artist: "Future, Metro Boomin & Kendrick Lamar", year: "2024", featured: true },
      { id: "am-2", title: "Superhero (Heroes & Villains)", artist: "Metro Boomin & Future", year: "2022", featured: true },
      { id: "am-3", title: "Mask Off", artist: "Future", year: "2017" }
    ]
  },

  // 23. Lagos to Leonida 95.5
  {
    id: "radio-lagos-to-leonida",
    name: "Lagos to Leonida 95.5",
    genre: "Afrobeats",
    hosts: "Tems & Wizkid",
    vibe: {
      en: "Smooth Afro-fusion, Alté R&B, and palm-tree beach lounge rhythms for marina yacht parties.",
      es: "Afro-fusión suave, R&B alternativo y ritmos relajados frente al mar para fiestas en yates y marinas."
    },
    tracks: [
      { id: "ll-1", title: "Love Me JeJe", artist: "Tems", year: "2024", featured: true },
      { id: "ll-2", title: "Essence", artist: "Wizkid ft. Tems", year: "2020", featured: true },
      { id: "ll-3", title: "Calm Down", artist: "Rema", year: "2022" }
    ]
  },

  // 24. Vice Financial & Crypto Talk 1080 AM
  {
    id: "radio-vice-financial-am",
    name: "BuckMe Financial 1080 AM",
    genre: "Talk & News",
    hosts: "Chad 'DiamondHands' Sterling",
    vibe: {
      en: "Satirical 24/7 money-laundering advice, real-estate bubble hype, and BuckMe Savings commercials.",
      es: "Sátira financiera 24/7 sobre burbujas inmobiliarias, consejos dudosos y comerciales de BuckMe Savings."
    },
    tracks: [
      { id: "bf-1", title: "Why Your Cash Is Safe in BuckMe Savings (Before Arrest!)", artist: "BuckMe Financial Desk", year: "2026", featured: true },
      { id: "bf-2", title: "Flipping Condos in Starfish Island for Fun & Profit", artist: "Chad Sterling", year: "2026", featured: true },
      { id: "bf-3", title: "Marked Bills & Car Washes: A Hypothetical Discussion", artist: "Yasmani Guest Segment", year: "2026" }
    ]
  },

  // 25. Neon Horizon Synthwave 87.9 (Unlockable #2)
  {
    id: "radio-neon-horizon",
    name: "Neon Horizon 87.9",
    genre: "Electronic / Club",
    hosts: "Kavinsky & The Midnight",
    vibe: {
      en: "Outrun synthwave, retro arpeggios, and cyber-noir instrumentals built for midnight Cheetah Classic sprints.",
      es: "Synthwave retrofuturista, arpegios analógicos e instrumentales nocturnos para correr en un Cheetah Classic."
    },
    tracks: [
      { id: "nh-1", title: "Nightcall", artist: "Kavinsky", year: "2010", featured: true },
      { id: "nh-2", title: "Sunset", artist: "The Midnight", year: "2016", featured: true },
      { id: "nh-3", title: "Tech Noir", artist: "GUNSHIP", year: "2015" }
    ]
  }
];
