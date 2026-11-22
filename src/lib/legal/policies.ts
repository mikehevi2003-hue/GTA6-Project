import type { LocalizedText } from "@/types/vicelink";

export type LegalSection = {
  heading: LocalizedText;
  paragraphs: LocalizedText[];
};

export type LegalPolicy = {
  id: "terms" | "refunds" | "privacy";
  title: LocalizedText;
  summary: LocalizedText;
  updatedAt: string;
  sections: LegalSection[];
};

export const LEGAL_LAST_UPDATED = "2026-11-21";

export const UNOFFICIAL_DISCLAIMER: LocalizedText = {
  en: "ViceLink is an unofficial fan-made companion tool. It is not affiliated with, endorsed, sponsored or approved by Rockstar Games, Inc. or Take-Two Interactive Software, Inc. Grand Theft Auto, GTA VI, Vice City, Leonida and all related names, logos and trademarks are the property of their respective owners and are used here only for identification and commentary.",
  es: "ViceLink es una herramienta complementaria no oficial creada por fans. No está afiliada, respaldada, patrocinada ni aprobada por Rockstar Games, Inc. ni por Take-Two Interactive Software, Inc. Grand Theft Auto, GTA VI, Vice City, Leonida y todos los nombres, logotipos y marcas relacionados son propiedad de sus respectivos dueños y se usan aquí únicamente con fines de identificación y comentario.",
};

export const TERMS_POLICY: LegalPolicy = {
  id: "terms",
  title: { en: "Terms of Service", es: "Términos y Condiciones" },
  summary: {
    en: "The rules for using ViceLink and for buying a one-time lifetime pass.",
    es: "Las reglas para usar ViceLink y para comprar un pase único de por vida.",
  },
  updatedAt: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: { en: "1. Acceptance", es: "1. Aceptación" },
      paragraphs: [
        {
          en: "By creating an account, signing in or purchasing a pass you agree to these Terms of Service. If you do not agree, please do not use ViceLink.",
          es: "Al crear una cuenta, iniciar sesión o comprar un pase aceptas estos Términos y Condiciones. Si no estás de acuerdo, por favor no uses ViceLink.",
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
      heading: { en: "3. Access tiers and pricing", es: "3. Niveles de acceso y precios" },
      paragraphs: [
        {
          en: "Free Recruit ($0): cheat codes and unlock guide, Easter Eggs board, starter map and 3 AI advisor questions per day (ad-supported).",
          es: "Free Recruit ($0): trucos y guía de desbloqueo, foro de Easter Eggs, mapa inicial y 3 preguntas diarias al asesor IA (con anuncios).",
        },
        {
          en: "Street Pass ($1.99, one-time): ad-free experience, the full tactical map, the Glitches & Exploits hub and the full vehicle and property planner.",
          es: "Street Pass ($1.99, pago único): experiencia sin anuncios, mapa táctico completo, centro de Glitches y Exploits y planificador completo de vehículos y propiedades.",
        },
        {
          en: "Kingpin VIP ($4.99, one-time): everything in Street Pass plus unlimited AI advisor questions, cloud sync and the TikTok & Instagram 9:16 Card Studio.",
          es: "Kingpin VIP ($4.99, pago único): todo lo de Street Pass más consultas ilimitadas al asesor IA, sincronización en la nube y el Estudio de Tarjetas 9:16 para TikTok e Instagram.",
        },
        {
          en: "Prices are in US dollars. There are no subscriptions and no recurring charges.",
          es: "Los precios están en dólares estadounidenses. No hay suscripciones ni cobros recurrentes.",
        },
      ],
    },
    {
      heading: { en: "4. Lifetime, non-transferable license", es: "4. Licencia de por vida e intransferible" },
      paragraphs: [
        {
          en: "A paid pass grants you a personal, lifetime, non-transferable license to access the unlocked content for as long as ViceLink is operated. The license is tied to your account and cannot be sold, shared, lent or transferred to another person or account.",
          es: "Un pase de pago te otorga una licencia personal, de por vida e intransferible para acceder al contenido desbloqueado mientras ViceLink esté en operación. La licencia está ligada a tu cuenta y no puede venderse, compartirse, prestarse ni transferirse a otra persona o cuenta.",
        },
        {
          en: "\"Lifetime\" refers to the life of the service, not to your own lifetime. If ViceLink is ever discontinued we will give reasonable advance notice.",
          es: "\"De por vida\" se refiere a la vida útil del servicio, no a tu propia vida. Si ViceLink llegara a discontinuarse daremos un aviso previo razonable.",
        },
      ],
    },
    {
      heading: { en: "5. Acceptable use", es: "5. Uso aceptable" },
      paragraphs: [
        {
          en: "You agree not to scrape, resell or redistribute paid content, share your account, bypass access controls, or post unlawful, hateful or infringing content on the community board. We may remove content or suspend accounts that violate these rules.",
          es: "Aceptas no extraer datos masivamente, revender ni redistribuir contenido de pago, compartir tu cuenta, evadir controles de acceso ni publicar contenido ilegal, de odio o que infrinja derechos en el foro de la comunidad. Podemos eliminar contenido o suspender cuentas que incumplan estas reglas.",
        },
      ],
    },
    {
      heading: { en: "6. Payments", es: "6. Pagos" },
      paragraphs: [
        {
          en: "Payments are processed by certified third-party gateways (Yappy for Panama, and card processors for Visa and Mastercard). ViceLink never sees or stores your full card number.",
          es: "Los pagos son procesados por pasarelas certificadas de terceros (Yappy para Panamá y procesadores de tarjeta para Visa y Mastercard). ViceLink nunca ve ni almacena el número completo de tu tarjeta.",
        },
      ],
    },
    {
      heading: { en: "7. Liability", es: "7. Responsabilidad" },
      paragraphs: [
        {
          en: "ViceLink is provided \"as is\". To the maximum extent permitted by law, our total liability is limited to the amount you paid for your pass. We are not responsible for lost game progress, bans or other consequences of using exploits or glitches in the game.",
          es: "ViceLink se ofrece \"tal cual\". En la máxima medida permitida por la ley, nuestra responsabilidad total se limita al monto que pagaste por tu pase. No somos responsables por pérdida de progreso, sanciones u otras consecuencias de usar exploits o glitches en el juego.",
        },
      ],
    },
    {
      heading: { en: "8. Governing law and contact", es: "8. Ley aplicable y contacto" },
      paragraphs: [
        {
          en: "These terms are governed by the laws of the Republic of Panama. We may update these terms; continued use after an update means you accept the new version.",
          es: "Estos términos se rigen por las leyes de la República de Panamá. Podemos actualizar estos términos; el uso continuado tras una actualización implica que aceptas la nueva versión.",
        },
      ],
    },
  ],
};

export const REFUND_POLICY: LegalPolicy = {
  id: "refunds",
  title: { en: "Refund Policy", es: "Política de Reembolso" },
  summary: {
    en: "Digital delivery is immediate. Refunds are available for verified duplicate charges or technical failure.",
    es: "La entrega digital es inmediata. Hay reembolsos por cobros duplicados verificados o falla técnica.",
  },
  updatedAt: LEGAL_LAST_UPDATED,
  sections: [
    {
      heading: { en: "1. Immediate digital delivery", es: "1. Entrega digital inmediata" },
      paragraphs: [
        {
          en: "Street Pass ($1.99) and Kingpin VIP ($4.99) are digital goods delivered immediately: your account is upgraded as soon as the payment is confirmed. Because access is granted instantly, purchases are generally final.",
          es: "Street Pass ($1.99) y Kingpin VIP ($4.99) son bienes digitales de entrega inmediata: tu cuenta se mejora en cuanto se confirma el pago. Como el acceso se otorga al instante, las compras son definitivas en general.",
        },
      ],
    },
    {
      heading: { en: "2. When we refund", es: "2. Cuándo reembolsamos" },
      paragraphs: [
        {
          en: "We refund within 7 business days when: (a) you were charged more than once for the same pass (verified duplicate charge), or (b) you paid but the pass could not be delivered or the content is unavailable because of a technical failure on our side that we cannot fix.",
          es: "Reembolsamos dentro de 7 días hábiles cuando: (a) se te cobró más de una vez por el mismo pase (cobro duplicado verificado), o (b) pagaste pero el pase no pudo entregarse o el contenido no está disponible por una falla técnica de nuestra parte que no podemos corregir.",
        },
      ],
    },
    {
      heading: { en: "3. How to request a refund", es: "3. Cómo solicitar un reembolso" },
      paragraphs: [
        {
          en: "Contact support from the email linked to your account and include your @username and the transaction ID shown in your Account receipts (or the Yappy / card confirmation). Approved refunds are returned to the original payment method within 7 business days of verification.",
          es: "Escribe a soporte desde el correo vinculado a tu cuenta e incluye tu @usuario y el ID de transacción que aparece en los recibos de tu Cuenta (o la confirmación de Yappy / tarjeta). Los reembolsos aprobados se devuelven al método de pago original dentro de 7 días hábiles tras la verificación.",
        },
      ],
    },
    {
      heading: { en: "4. Not refundable", es: "4. No reembolsable" },
      paragraphs: [
        {
          en: "Changes in game content after a patch, glitches that stop working, change of mind after access was delivered, or account suspension for violating the Terms of Service are not eligible for a refund.",
          es: "No aplican reembolsos por cambios en el contenido del juego tras un parche, glitches que dejen de funcionar, arrepentimiento después de entregado el acceso o suspensión de cuenta por incumplir los Términos y Condiciones.",
        },
      ],
    },
    {
      heading: { en: "5. Refunded passes", es: "5. Pases reembolsados" },
      paragraphs: [
        {
          en: "When a purchase is refunded, the associated pass is revoked and your account returns to the previous tier.",
          es: "Cuando una compra es reembolsada, el pase asociado se revoca y tu cuenta vuelve al nivel anterior.",
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
          en: "Only the minimum required to run your account: your email address, your public @username, your saved progress (favorites, unlocked cheats, found pins, planned vehicles and properties), and the transaction IDs of your purchases.",
          es: "Solo lo mínimo necesario para operar tu cuenta: tu correo electrónico, tu @usuario público, tu progreso guardado (favoritos, trucos desbloqueados, pines encontrados, vehículos y propiedades planificados) y los IDs de transacción de tus compras.",
        },
      ],
    },
    {
      heading: { en: "3. Payments", es: "3. Pagos" },
      paragraphs: [
        {
          en: "Card and Yappy payments are processed by certified payment gateways. ViceLink does not receive, see or store your card number or Yappy credentials; we only keep the transaction ID and status.",
          es: "Los pagos con tarjeta y Yappy son procesados por pasarelas de pago certificadas. ViceLink no recibe, ve ni almacena tu número de tarjeta ni tus credenciales de Yappy; solo guardamos el ID y el estado de la transacción.",
        },
      ],
    },
    {
      heading: { en: "4. How we use your data", es: "4. Cómo usamos tus datos" },
      paragraphs: [
        {
          en: "To authenticate you, sync your progress across devices, deliver the pass you purchased, publish your @username on community posts, and prevent fraud and abuse. We do not sell your personal data.",
          es: "Para autenticarte, sincronizar tu progreso entre dispositivos, entregar el pase que compraste, mostrar tu @usuario en publicaciones de la comunidad y prevenir fraude y abuso. No vendemos tus datos personales.",
        },
      ],
    },
    {
      heading: { en: "5. Your rights (ARCO)", es: "5. Tus derechos (ARCO)" },
      paragraphs: [
        {
          en: "You have the right to access, rectify, delete and export your data. Use the Account menu: edit your @username and profile, and press \"Export My Data (Law 81)\" to download a copy of your data. You can also ask us to delete your account and associated data.",
          es: "Tienes derecho a acceder, rectificar, eliminar y exportar tus datos. Usa el menú Cuenta: edita tu @usuario y perfil, y presiona \"Exportar Mis Datos (Ley 81)\" para descargar una copia. También puedes pedirnos eliminar tu cuenta y los datos asociados.",
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

export const LEGAL_POLICIES = {
  terms: TERMS_POLICY,
  refunds: REFUND_POLICY,
  privacy: PRIVACY_POLICY,
  disclaimer: UNOFFICIAL_DISCLAIMER,
} as const;
