import type { LocalizedText } from "@/types/vicelink";

export type LegalSection = {
  heading: LocalizedText;
  paragraphs: LocalizedText[];
};

export type LegalPolicy = {
  id: "terms" | "refunds" | "privacy" | "dmca";
  title: LocalizedText;
  summary: LocalizedText;
  updatedAt: string;
  sections: LegalSection[];
};

export const LEGAL_LAST_UPDATED = "2026-11-22";

export const UNOFFICIAL_DISCLAIMER: LocalizedText = {
  en: "ViceLink is an unofficial fan-made companion tool. It is not affiliated with, endorsed, sponsored or approved by Rockstar Games, Inc. or Take-Two Interactive Software, Inc. Grand Theft Auto, GTA VI, Vice City, Leonida and all related names, logos and trademarks are the property of their respective owners and are used here only for identification and commentary.",
  es: "ViceLink es una herramienta complementaria no oficial creada por fans. No está afiliada, respaldada, patrocinada ni aprobada por Rockstar Games, Inc. ni por Take-Two Interactive Software, Inc. Grand Theft Auto, GTA VI, Vice City, Leonida y todos los nombres, logotipos y marcas relacionados son propiedad de sus respectivos dueños y se usan aquí únicamente con fines de identificación y comentario.",
};

export const TERMS_POLICY: LegalPolicy = {
  id: "terms",
  title: { en: "Terms of Service", es: "Términos y Condiciones" },
  summary: {
    en: "The rules for using ViceLink and purchasing a one-time digital access pass (All Sales Final / Strict No-Refund Policy upon immediate digital unlock).",
    es: "Las reglas para usar ViceLink y adquirir un pase digital de pago único (Todas las Ventas son Finales / Política Estricta de No Reembolso tras el desbloqueo digital inmediato).",
  },
  updatedAt: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: { en: "1. Acceptance", es: "1. Aceptación" },
      paragraphs: [
        {
          en: "By creating an account, signing in, redeeming a promo code, or purchasing a pass you agree to these Terms of Service and our Strict No-Refund Policy. If you do not agree, please do not use ViceLink.",
          es: "Al crear una cuenta, iniciar sesión, canjear un código promocional o comprar un pase aceptas estos Términos y Condiciones y nuestra Política Estricta de No Reembolso. Si no estás de acuerdo, por favor no uses ViceLink.",
        },
      ],
    },
    {
      heading: { en: "2. Unofficial fan tool", es: "2. Herramienta no oficial de fans" },
      paragraphs: [
        {
          en: "ViceLink is not affiliated with Rockstar Games or Take-Two Interactive. All game names and trademarks belong to their owners. Game information may change after patches and is provided as-is, without any guarantee of accuracy.",
          es: "ViceLink no está afiliada con Rockstar Games ni Take-Two Interactive. Todos los nombres y marcas del juego pertenecen a sus dueños. La información del juego puede cambiar tras los parches y se ofrece tal cual, sin garantía de exactitud.",
        },
      ],
    },
    {
      heading: { en: "3. Access tiers and one-time digital pricing", es: "3. Niveles de acceso y precios digitales de pago único" },
      paragraphs: [
        {
          en: "Free Recruit ($0 USD): cheat codes and unlock guide, Easter Eggs board, starter map (10 pins), 6 starter vehicles, and 3 AI advisor questions per day (ad-supported).",
          es: "Free Recruit ($0 USD): trucos y guía de desbloqueo, foro de Easter Eggs, mapa inicial (10 pines), 6 vehículos iniciales y 3 preguntas diarias al asesor IA (con anuncios).",
        },
        {
          en: "Street Pass ($1.99 USD, one-time software utility pass): 100% ad-free HUD experience, interactive coordinate planner across all 32 tactical Leonida locations ($250K/hr cash & supercar routes), Single-Player Sandbox Techniques & Patch Status Tracker (story mode only — never online exploits), all 55 Trophy roadmaps, and the full vehicle and property ROI planner.",
          es: "Street Pass ($1.99 USD, pase único de utilidad de software): experiencia HUD 100% sin anuncios, planificador interactivo en 32 coordenadas tácticas de Leonida (rutas de $250K/h y superautos), Rastreador de Técnicas Sandbox y Parches (solo modo historia — nunca exploits online), las 55 guías de Trofeos y el planificador completo de vehículos y propiedades.",
        },
        {
          en: "Kingpin VIP ($4.99 USD, one-time software utility pass): everything in Street Pass plus unlimited AI Mission Advisor queries, cross-device cloud progress sync, Console Link & Screenshot Progress Importer, verified Gold Kingpin forum badge, and the TikTok & Instagram 9:16 Card Studio.",
          es: "Kingpin VIP ($4.99 USD, pase único de utilidad de software): todo lo incluido en Street Pass más consultas ilimitadas al Asesor IA de Misiones, sincronización de progreso en la nube entre dispositivos, Importador por Captura y Vinculación de Consola, insignia dorada Kingpin en el foro y Estudio de Tarjetas 9:16 para TikTok e Instagram.",
        },
        {
          en: "All prices are one-time payments in US dollars (USD). There are no subscriptions, no recurring monthly fees, and no 24-hour trial periods.",
          es: "Todos los precios son pagos únicos en dólares estadounidenses (USD). No existen suscripciones, ni cargos mensuales recurrentes, ni periodos de prueba de 24 horas.",
        },
      ],
    },
    {
      heading: { en: "4. Lifetime, non-transferable license", es: "4. Licencia de por vida e intransferible" },
      paragraphs: [
        {
          en: "A paid pass grants you a personal, lifetime, non-transferable license to access the unlocked digital content for as long as ViceLink is operated. The license is tied to your authenticated account and cannot be sold, shared, lent or transferred to another person or account.",
          es: "Un pase de pago te otorga una licencia personal, de por vida e intransferible para acceder al contenido digital desbloqueado mientras ViceLink esté en operación. La licencia está ligada a tu cuenta autenticada y no puede venderse, compartirse, prestarse ni transferirse a otra persona o cuenta.",
        },
        {
          en: "\"Lifetime\" refers to the operational life of the ViceLink service. If ViceLink is ever discontinued we will give reasonable advance notice.",
          es: "\"De por vida\" se refiere a la vida útil operativa del servicio ViceLink. Si ViceLink llegara a discontinuarse daremos un aviso previo razonable.",
        },
      ],
    },
    {
      heading: { en: "5. Acceptable use", es: "5. Uso aceptable" },
      paragraphs: [
        {
          en: "You agree not to scrape, resell or redistribute paid digital content, share your account credentials, bypass access controls, or post unlawful, hateful or infringing content on the community board. We may remove content or permanently suspend accounts that violate these rules.",
          es: "Aceptas no extraer datos masivamente, revender ni redistribuir contenido digital de pago, compartir las credenciales de tu cuenta, evadir controles de acceso ni publicar contenido ilegal, de odio o que infrinja derechos en el foro de la comunidad. Podemos eliminar contenido o suspender permanentemente cuentas que incumplan estas reglas.",
        },
      ],
    },
    {
      heading: {
        en: "6. Payments, Immediate Digital Delivery & Strict No-Refund Waiver",
        es: "6. Pagos, Entrega Digital Inmediata y Renuncia Estricta a Reembolsos",
      },
      paragraphs: [
        {
          en: "Payments are processed by certified third-party gateways (Banco General Yappy Comercial V2 for Panama, and Stripe / Visa / Mastercard card processors internationally). ViceLink never sees or stores your full card number or banking credentials.",
          es: "Los pagos son procesados por pasarelas certificadas de terceros (Yappy Comercial V2 de Banco General para Panamá y procesadores internacionales Stripe / Visa / Mastercard). ViceLink nunca ve ni almacena el número completo de tu tarjeta ni tus credenciales bancarias.",
        },
        {
          en: "ALL SALES ARE FINAL: Because Street Pass ($1.99 USD) and Kingpin VIP ($4.99 USD) unlock proprietary digital intelligence, map coordinates, money routes, and glitches immediately upon checkout confirmation, you expressly consent to immediate digital performance before checkout and waive any statutory cooling-off or withdrawal right once unlocked, in compliance with Panama Ley 45 de 2007 (ACODECO) & Ley 81 de 2019, EU Consumer Rights Directive 2011/83/EU Article 16(m), UK Consumer Contracts Regulations 2013 Regulation 37, US FTC Digital Goods rules, Colombia Ley 1480 Art. 47, and Mexico PROFECO digital delivery standards.",
          es: "TODAS LAS VENTAS SON FINALES: Dado que Street Pass ($1.99 USD) y Kingpin VIP ($4.99 USD) desbloquean inteligencia digital, coordenadas del mapa, rutas de dinero y glitches de forma inmediata tras confirmarse el pago, otorgas tu consentimiento expreso previo para la ejecución digital inmediata y renuncias a cualquier derecho de retracto o enfriamiento una vez desbloqueado el acceso, en cumplimiento con la Ley 45 de 2007 (ACODECO) y Ley 81 de 2019 de Panamá, Directiva de la UE 2011/83/UE Artículo 16(m), Regulación 37 del Reino Unido (UK Consumer Contracts Regulations 2013), normas FTC de EE. UU., Ley 1480 Art. 47 de Colombia y disposiciones PROFECO de México.",
        },
        {
          en: "Fraudulent chargebacks or payment disputes filed after digital access has been delivered constitute a material breach of these Terms. Under Visa and Mastercard Compelling Evidence 3.0 standards, ViceLink submits server-logged timestamped waiver acceptance, authenticated session logs, and account delivery telemetry, and permanently bans accounts (`is_banned = true`) that initiate illegitimate chargebacks.",
          es: "Los contracargos fraudulentos o disputas de pago iniciadas después de haberse entregado el acceso digital constituyen un incumplimiento grave de estos Términos. Bajo los estándares Compelling Evidence 3.0 de Visa y Mastercard, ViceLink presenta el registro con sello de tiempo de aceptación de la renuncia, registros de sesión autenticada y telemetría de entrega en cuenta, y suspende permanentemente las cuentas (`is_banned = true`) que inicien contracargos ilegítimos.",
        },
      ],
    },
    {
      heading: { en: "7. Liability", es: "7. Responsabilidad" },
      paragraphs: [
        {
          en: "ViceLink is provided \"as is\". To the maximum extent permitted by law, our total liability is limited to the amount you paid for your pass ($1.99 USD or $4.99 USD). We are not responsible for lost game progress, Rockstar Games patch changes, bans or other consequences of using exploits or glitches in the game.",
          es: "ViceLink se ofrece \"tal cual\". En la máxima medida permitida por la ley, nuestra responsabilidad total se limita al monto que pagaste por tu pase ($1.99 USD o $4.99 USD). No somos responsables por pérdida de progreso, cambios por parches de Rockstar Games, sanciones u otras consecuencias de usar exploits o glitches en el juego.",
        },
      ],
    },
    {
      heading: { en: "8. Governing law and contact", es: "8. Ley aplicable y contacto" },
      paragraphs: [
        {
          en: "These terms are governed by the laws of the Republic of Panama (including Ley 45 de 2007 and Ley 81 de 2019) alongside applicable international digital commerce treaties. We may update these terms; continued use after an update means you accept the new version.",
          es: "Estos términos se rigen por las leyes de la República de Panamá (incluyendo la Ley 45 de 2007 y la Ley 81 de 2019) junto con las normas internacionales aplicables de comercio electrónico digital. Podemos actualizar estos términos; el uso continuado tras una actualización implica que aceptas la nueva versión.",
        },
      ],
    },
  ],
};

export const REFUND_POLICY: LegalPolicy = {
  id: "refunds",
  title: {
    en: "Refund Policy — All Sales Final on Immediate Digital Access",
    es: "Política de Reembolso — Todas las Ventas son Finales en Acceso Digital Inmediato",
  },
  summary: {
    en: "All sales of Street Pass ($1.99 USD) and Kingpin VIP ($4.99 USD) are final upon immediate digital delivery. No cooling-off refunds apply once tactical intel is unlocked.",
    es: "Todas las ventas de Street Pass ($1.99 USD) y Kingpin VIP ($4.99 USD) son definitivas tras la entrega digital inmediata. No aplican reembolsos por retracto una vez desbloqueada la inteligencia táctica.",
  },
  updatedAt: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: {
        en: "1. All Sales Final — Immediate One-Time Digital Delivery",
        es: "1. Todas las Ventas son Finales — Entrega Digital Única e Inmediata",
      },
      paragraphs: [
        {
          en: "Street Pass ($1.99 USD) and Kingpin VIP ($4.99 USD) are one-time digital access passes delivered immediately upon payment confirmation (no subscriptions, no 24-hour trials, and no recurring fees). The moment your checkout completes, your account is permanently upgraded and full digital intelligence—including all 32 tactical Leonida map coordinates, $250K/hr cash routes, 5 working money glitches, 55 Platinum trophy roadmaps, and AI Mission Advisor perks—is immediately unlocked and consumable.",
          es: "Street Pass ($1.99 USD) y Kingpin VIP ($4.99 USD) son pases de acceso digital de pago único entregados inmediatamente al confirmarse el pago (sin suscripciones, sin pruebas de 24 horas y sin cargos recurrentes). En el instante en que se completa tu pago, tu cuenta se actualiza permanentemente y toda la inteligencia digital —incluyendo las 32 coordenadas del mapa táctico de Leonida, rutas de $250K/h, 5 glitches de dinero activos, las 55 guías de trofeos de Platino y el Asesor IA de Misiones— queda desbloqueada y consumible al instante.",
        },
        {
          en: "Because consumable digital coordinates, cheat sequences, and exploit guides cannot be \"returned\" once viewed or unlocked, ALL SALES ARE FINAL AND NON-REFUNDABLE once digital access is granted to your account.",
          es: "Debido a que las coordenadas digitales, secuencias de trucos y guías de exploits no pueden \"devolverse\" una vez visualizadas o desbloqueadas, TODAS LAS VENTAS SON FINALES Y NO REEMBOLSABLES una vez otorgado el acceso digital a tu cuenta.",
        },
      ],
    },
    {
      heading: {
        en: "2. Panama & International Digital Goods Legal Framework",
        es: "2. Marco Legal de Bienes Digitales en Panamá e Internacional",
      },
      paragraphs: [
        {
          en: "Panama (Ley 45 de 2007 ACODECO & Ley 81 de 2019): Under Republic of Panama consumer protection rules (Ley 45 de 2007 supervised by ACODECO) and personal data audit rules (Ley 81 de 2019 / Law 81), digital content and intangible informational access delivered immediately with the consumer's prior informed consent are exempt from right-of-withdrawal returns once unlocked.",
          es: "Panamá (Ley 45 de 2007 ACODECO y Ley 81 de 2019): Conforme a la legislación de protección al consumidor de la República de Panamá (Ley 45 de 2007 supervisada por ACODECO) y protección de datos (Ley 81 de 2019 / Law 81), los contenidos digitales e información intangible entregados de manera inmediata con el consentimiento previo e informado del usuario están exentos de devolución o derecho de retracto una vez desbloqueados.",
        },
        {
          en: "European Union & United Kingdom (Directive 2011/83/EU Article 16(m) & UK Regulation 37): For users in the EU, EEA, and UK, pursuant to Article 16(m) of EU Consumer Rights Directive 2011/83/EU and Regulation 37 of the UK Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, checking the mandatory pre-checkout waiver box constitutes your express prior consent to immediate performance of digital content not supplied on a tangible medium and your explicit acknowledgment that you thereby lose your 14-day right of withdrawal.",
          es: "Unión Europea y Reino Unido (Directiva 2011/83/UE Artículo 16(m) y Regulación 37 del Reino Unido): Para usuarios en la UE, EEE y Reino Unido, conforme al Artículo 16(m) de la Directiva de Derechos del Consumidor 2011/83/UE y la Regulación 37 de las UK Consumer Contracts Regulations 2013, marcar la casilla obligatoria previa al pago constituye tu consentimiento expreso previo para el suministro inmediato de contenido digital no prestado en soporte material y tu reconocimiento explícito de que con ello pierdes el derecho de desistimiento de 14 días.",
        },
        {
          en: "United States & Latin America (FTC Digital Goods, Colombia Ley 1480 Art. 47 & Mexico PROFECO): In accordance with US Federal Trade Commission (FTC) digital commerce disclosure standards, Colombia Statute of the Consumer (Ley 1480 de 2011 Artículo 47 numeral 4 on digital goods executed immediately), and Mexico PROFECO electronic commerce guidelines, clearly disclosed all-sales-final terms accepted prior to purchase govern immediate digital access passes.",
          es: "Estados Unidos y Latinoamérica (FTC Digital Goods, Colombia Ley 1480 Art. 47 y México PROFECO): De conformidad con las normas de divulgación comercial digital de la FTC de EE. UU., el Estatuto del Consumidor de Colombia (Ley 1480 de 2011 Artículo 47 numeral 4 sobre bienes digitales de consumo inmediato) y los lineamientos de comercio electrónico de PROFECO en México, los términos de venta final claramente informados y aceptados antes de la compra rigen los pases de acceso digital inmediato.",
        },
      ],
    },
    {
      heading: {
        en: "3. Non-Refundable Circumstances",
        es: "3. Circunstancias No Reembolsables",
      },
      paragraphs: [
        {
          en: "No refunds, credits, or partial reversals are issued for: (a) buyer's remorse or change of mind after digital access is unlocked; (b) Rockstar Games title updates or patches that modify or patch in-game glitches, vehicle stats, or economy values; (c) user dissimilarity with community theories; or (d) account suspension (`is_banned = true`) resulting from Terms of Service violations.",
          es: "No se emiten reembolsos, créditos ni devoluciones parciales por: (a) arrepentimiento de compra o cambio de opinión tras desbloquearse el acceso digital; (b) actualizaciones o parches de Rockstar Games que modifiquen o corrijan glitches, estadísticas de vehículos o valores económicos dentro del juego; (c) desacuerdo con teorías de la comunidad; o (d) suspensión de cuenta (`is_banned = true`) derivada del incumplimiento de los Términos y Condiciones.",
        },
      ],
    },
    {
      heading: {
        en: "4. Chargeback Defense (Visa / Mastercard Compelling Evidence 3.0)",
        es: "4. Defensa contra Contracargos (Visa / Mastercard Compelling Evidence 3.0)",
      },
      paragraphs: [
        {
          en: "Before any Yappy or Card payment session is created, ViceLink records your authenticated user ID, timestamped pre-checkout no-refund waiver acceptance (`waiverAccepted = true`), IP/session metadata, and immediate tier entitlement activation in our immutable payment audit log.",
          es: "Antes de crear cualquier sesión de pago por Yappy o Tarjeta, ViceLink registra tu ID de usuario autenticado, la aceptación con sello de tiempo de la renuncia previa al pago (`waiverAccepted = true`), metadatos de sesión y la activación inmediata de tu nivel de acceso en nuestro registro inmutable de auditoría.",
        },
        {
          en: "If a fraudulent chargeback or bank dispute is opened after digital delivery, ViceLink provides full Visa and Mastercard Compelling Evidence 3.0 documentation to the acquiring processor and immediately revokes all pass privileges and permanently bans the offending account (`is_banned = true`).",
          es: "Si se inicia un contracargo fraudulento o disputa bancaria después de la entrega digital, ViceLink presenta la documentación completa de Compelling Evidence 3.0 de Visa y Mastercard ante el procesador adquirente, revoca de inmediato todos los privilegios del pase y bloquea permanentemente la cuenta infractora (`is_banned = true`).",
        },
      ],
    },
    {
      heading: {
        en: "5. Billing Errors Only (Duplicate Charges or Server Non-Delivery)",
        es: "5. Únicamente Errores de Facturación (Cobros Duplicados o Falta de Entrega del Servidor)",
      },
      paragraphs: [
        {
          en: "Our sole exceptions apply to verified billing errors: (a) if a technical gateway error causes you to be charged twice for the exact same tier pass on the same account, we will reverse the duplicate charge within 7 business days; or (b) if your payment settled but a server outage prevented tier activation, our administrators will immediately activate your paid tier (or issue a reversal if activation is impossible).",
          es: "Nuestras únicas excepciones aplican a errores verificados de facturación: (a) si un error técnico de la pasarela provoca un cobro duplicado por exactamente el mismo pase en la misma cuenta, revertiremos el cargo duplicado dentro de 7 días hábiles; o (b) si tu pago fue procesado pero una falla del servidor impidió la activación del nivel, nuestros administradores activarán de inmediato tu pase pagado (o emitirán la reversión si la activación fuera imposible).",
        },
        {
          en: "To report a verified duplicate charge or unactivated receipt, contact support from your registered account email with your @handle and the transaction order ID displayed in your Account receipts ledger.",
          es: "Para reportar un cobro duplicado verificado o un recibo no activado, contacta a soporte desde el correo registrado en tu cuenta indicando tu @usuario y el ID de orden de transacción que aparece en el historial de recibos de tu Cuenta.",
        },
      ],
    },
  ],
};

export const PRIVACY_POLICY: LegalPolicy = {
  id: "privacy",
  title: { en: "Privacy Policy", es: "Política de Privacidad" },
  summary: {
    en: "We collect the minimum personal data needed, in line with Panama Law 81 of 2019.",
    es: "Recopilamos el mínimo de datos personales necesarios, conforme a la Ley 81 de 2019 de Panamá.",
  },
  updatedAt: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: { en: "1. Legal framework", es: "1. Marco legal" },
      paragraphs: [
        {
          en: "ViceLink processes personal data in accordance with Panama Law 81 of 2019 on Personal Data Protection and its regulations.",
          es: "ViceLink trata los datos personales de acuerdo con la Ley 81 de 2019 de Protección de Datos Personales de Panamá y su reglamentación.",
        },
      ],
    },
    {
      heading: { en: "2. Data we collect", es: "2. Datos que recopilamos" },
      paragraphs: [
        {
          en: "Only the minimum required to run your account: your email address, your public @username, your optional marketing opt-in preference, your saved progress (favorites, unlocked cheats, found pins, planned vehicles, properties, and trophies), and the transaction IDs and waiver timestamps of your purchases.",
          es: "Solo lo mínimo necesario para operar tu cuenta: tu correo electrónico, tu @usuario público, tu preferencia opcional de correos promocionales, tu progreso guardado (favoritos, trucos desbloqueados, pines encontrados, vehículos, propiedades y trofeos) y los IDs de transacción y sellos de tiempo de aceptación de tus compras.",
        },
      ],
    },
    {
      heading: { en: "3. Payments", es: "3. Pagos" },
      paragraphs: [
        {
          en: "Card and Yappy payments are processed by certified payment gateways. ViceLink does not receive, see or store your card number or Yappy credentials; we only keep the transaction ID, waiver confirmation, and status.",
          es: "Los pagos con tarjeta y Yappy son procesados por pasarelas de pago certificadas. ViceLink no recibe, ve ni almacena tu número de tarjeta ni tus credenciales de Yappy; solo guardamos el ID de transacción, la confirmación de renuncia y el estado.",
        },
      ],
    },
    {
      heading: { en: "4. How we use your data", es: "4. Cómo usamos tus datos" },
      paragraphs: [
        {
          en: "To authenticate you, sync your progress across devices, deliver the pass you purchased, send promotional intel only when you opt in, publish your @username on community posts, and prevent fraud and abuse. We do not sell your personal data.",
          es: "Para autenticarte, sincronizar tu progreso entre dispositivos, entregar el pase que compraste, enviarte novedades promocionales solo cuando lo autorices, mostrar tu @usuario en publicaciones de la comunidad y prevenir fraude y abuso. No vendemos tus datos personales.",
        },
      ],
    },
    {
      heading: { en: "5. Your rights (ARCO)", es: "5. Tus derechos (ARCO)" },
      paragraphs: [
        {
          en: "You have the right to access, rectify, delete and export your data. Use the Account menu: edit your @username, profile, and marketing email toggle, and press \"Export My Data (Law 81)\" to download a copy of your data. You can also ask us to delete your account and associated data.",
          es: "Tienes derecho a acceder, rectificar, eliminar y exportar tus datos. Usa el menú Cuenta: edita tu @usuario, perfil y preferencia de correos promocionales, y presiona \"Exportar Mis Datos (Ley 81)\" para descargar una copia. También puedes pedirnos eliminar tu cuenta y los datos asociados.",
        },
      ],
    },
    {
      heading: { en: "6. Security and retention", es: "6. Seguridad y conservación" },
      paragraphs: [
        {
          en: "Data is stored with row-level security and encrypted in transit. We keep your data while your account is active and keep transaction records as long as required by tax and accounting obligations.",
          es: "Los datos se almacenan con seguridad a nivel de fila y se cifran en tránsito. Conservamos tus datos mientras tu cuenta esté activa y los registros de transacciones el tiempo que exijan las obligaciones fiscales y contables.",
        },
      ],
    },
    {
      heading: { en: "7. Contact", es: "7. Contacto" },
      paragraphs: [
        {
          en: "To exercise your rights or ask privacy questions, contact support from the email linked to your account. We reply within 10 business days.",
          es: "Para ejercer tus derechos o hacer consultas de privacidad, escribe a soporte desde el correo vinculado a tu cuenta. Respondemos en un máximo de 10 días hábiles.",
        },
      ],
    },
  ],
};

export const DMCA_POLICY: LegalPolicy = {
  id: "dmca",
  title: { en: "Copyright, Fair-Use Facts & DMCA Safe Harbor", es: "Derechos de Autor, Uso Justo y Puerto Seguro DMCA" },
  summary: {
    en: "Original software utility, factual game intel boundary, and 17 U.S.C. § 512 / Panama Law 64 takedown channel.",
    es: "Utilidad de software original, frontera de datos factuales y canal formal DMCA (17 U.S.C. § 512 / Ley 64 de Panamá).",
  },
  updatedAt: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: { en: "1. Independent Software & Original Assets", es: "1. Software Independiente y Activos Originales" },
      paragraphs: [
        {
          en: "ViceLink (vicelink.app) is an independent companion software utility created with 100% original TypeScript source code, Neo-Glass UI components, original SVG tactical maps, and community editorial commentary. ViceLink does not redistribute Rockstar Games binaries, copyrighted artwork, audio files, texture rips, or proprietary source code.",
          es: "ViceLink (vicelink.app) es una utilidad de software complementaria independiente creada con código fuente TypeScript 100% original, interfaz Neo-Glass propia, mapas vectoriales SVG originales y guías editoriales de la comunidad. ViceLink no redistribuye binarios, arte protegido, archivos de audio, texturas extraídas ni código propietario de Rockstar Games.",
        },
      ],
    },
    {
      heading: { en: "2. Factual Reference vs. Copyrighted Expression", es: "2. Datos Factuales vs. Expresión Protegida" },
      paragraphs: [
        {
          en: "Under international copyright doctrine (U.S. 17 U.S.C. § 102(b) and Panama Law 64 of 2012 on Copyright and Related Rights), copyright protects creative expression but does not monopolize underlying facts, coordinates, patch observations, button sequences, or transformable utility software. Paid passes compensate exclusively for ViceLink's cloud infrastructure, ad-free HUD utility, AI indexing, route computation, and cross-device synchronization.",
          es: "Conforme a la doctrina internacional de derechos de autor (17 U.S.C. § 102(b) de EE. UU. y Ley 64 de 2012 de Panamá sobre Derecho de Autor), el copyright protege la expresión creativa, pero no monopoliza hechos objetivos, coordenadas, historial de parches, secuencias de botones ni software utilitario independiente. Los pases de pago remuneran exclusivamente la infraestructura cloud de ViceLink, interfaz sin anuncios, indexación IA, cálculo de rutas y sincronización entre dispositivos.",
        },
      ],
    },
    {
      heading: { en: "3. Strictly Single-Player & Official TOS Boundaries", es: "3. Límites Estrictos de Solo Historia y TOS Oficiales" },
      paragraphs: [
        {
          en: "ViceLink strictly prohibits monetization or distribution of online multiplayer cheats, griefing tools, account mods, or automated scrapers. All Sandbox Techniques & Patch Tracker notes document single-player story mode behavior only. Console Screenshot Sync analyzes player-submitted screenshots strictly via user-initiated upload or OS Share Sheet — never requiring PlayStation, Xbox, or Rockstar credentials.",
          es: "ViceLink prohíbe estrictamente monetizar o distribuir trampas para modos online multijugador, modificación de cuentas o scrapers automatizados. Todas las notas de Técnicas Sandbox y Parches documentan únicamente el modo historia para un jugador. La sincronización por captura analiza únicamente imágenes subidas voluntariamente por el jugador o mediante Share Sheet del sistema operativo, sin pedir nunca contraseñas de PlayStation, Xbox o Rockstar.",
        },
      ],
    },
    {
      heading: { en: "4. DMCA & Rightsholder Takedown Desk (48-Hour Expedited Review)", es: "4. Canal de Notificación DMCA y Titulares (Revisión en 48 Horas)" },
      paragraphs: [
        {
          en: "If you are a copyright or trademark owner (including Rockstar Games, Take-Two Interactive, Sony Interactive Entertainment, or Microsoft) and believe any user post, community submission, or guide item infringes your rights, submit a notice compliant with 17 U.S.C. § 512(c)(3) to dmca@vicelink.app specifying the exact URL/item ID, proof of ownership, and contact details. Verified notices receive expedited removal within 48 hours.",
          es: "Si eres titular de derechos de autor o marca (incluyendo Rockstar Games, Take-Two Interactive, Sony Interactive Entertainment o Microsoft) y consideras que algún contenido o aporte comunitario vulnera tus derechos, envía una notificación conforme al 17 U.S.C. § 512(c)(3) a dmca@vicelink.app indicando la URL exacta o ID del elemento, acreditación de titularidad y datos de contacto. Las solicitudes verificadas se revisan y retiran en un plazo máximo de 48 horas.",
        },
      ],
    },
  ],
};

export const LEGAL_POLICIES = {
  terms: TERMS_POLICY,
  refunds: REFUND_POLICY,
  privacy: PRIVACY_POLICY,
  dmca: DMCA_POLICY,
  disclaimer: UNOFFICIAL_DISCLAIMER,
} as const;
