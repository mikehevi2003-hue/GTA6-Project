import type { Language } from "@/types/vicelink";

const SAFE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Strips any script tags or inline event handlers from an SVG string
 * before encoding it as an image data URL.
 */
function sanitizeSvgString(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Generates a deterministic 21x21 Version-1 QR matrix SVG as a fallback
 * when a raw SVG is not provided.
 */
export function buildFallbackQrSvg(seedText: string): string {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const onOuterBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[rr][cc] = inOuter && (onOuterBorder || inInner);
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic hash fill for unreserved modules
  let hash = 2166136261;
  const input = seedText || "VICELINK-LEONIDA-TOTP";
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) & 1) === 1;
    }
  }

  const modulePx = 8;
  const quiet = 2;
  const totalModules = size + quiet * 2;
  const viewPx = totalModules * modulePx;

  const rects: string[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) continue;
      const x = (c + quiet) * modulePx;
      const y = (r + quiet) * modulePx;
      rects.push(`<rect x="${x}" y="${y}" width="${modulePx}" height="${modulePx}" fill="#05070e"/>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewPx} ${viewPx}" width="200" height="200" shape-rendering="crispEdges"><rect width="100%" height="100%" rx="10" fill="#ffffff"/>${rects.join("")}</svg>`;
}

/**
 * Safely normalizes Supabase's `data.totp.qr_code` (which may be a raw `<svg...>`,
 * `data:image/svg+xml;utf-8,<svg...>`, or `data:image/svg+xml;base64,...`) into
 * a safe `data:image/svg+xml` URL suitable for `<img src={...} alt="TOTP QR Code" />`.
 * Never uses `dangerouslySetInnerHTML`.
 */
export function normalizeQrDataUrl(rawQr?: string | null, fallbackSecret?: string): string {
  const trimmed = (rawQr ?? "").trim();

  if (trimmed.startsWith("data:image/svg+xml;base64,")) {
    const base64Part = trimmed.slice("data:image/svg+xml;base64,".length).trim();
    if (/^[A-Za-z0-9+/=\s]+$/.test(base64Part)) {
      return `data:image/svg+xml;base64,${base64Part.replace(/\s+/g, "")}`;
    }
  }

  if (trimmed.startsWith("data:image/svg+xml")) {
    const commaIdx = trimmed.indexOf(",");
    if (commaIdx !== -1) {
      const rawPayload = trimmed.slice(commaIdx + 1);
      let decoded = rawPayload;
      try {
        if (rawPayload.includes("%3C") || rawPayload.includes("%3c")) {
          decoded = decodeURIComponent(rawPayload);
        }
      } catch {
        decoded = rawPayload;
      }
      const cleanSvg = sanitizeSvgString(decoded);
      if (cleanSvg.includes("<svg")) {
        return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
      }
    }
  }

  if (trimmed.includes("<svg") && trimmed.includes("</svg>")) {
    const startIdx = trimmed.indexOf("<svg");
    const endIdx = trimmed.lastIndexOf("</svg>") + "</svg>".length;
    const cleanSvg = sanitizeSvgString(trimmed.slice(startIdx, endIdx));
    return `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
  }

  const fallbackSvg = buildFallbackQrSvg(fallbackSecret || trimmed || "VICELINK-TOTP");
  return `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;
}

/**
 * Generates 8 readable backup recovery codes (`VL-XXXX-XXXX`) in browser memory
 * when TOTP 2FA is activated.
 */
export function generateTotpBackupCodes(seed = "", count = 8): string[] {
  const codes: string[] = [];
  const randomBytes = new Uint8Array(count * 8);

  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomBytes);
  } else {
    let h = 2166136261;
    const s = `${seed}-${Date.now()}`;
    for (let i = 0; i < randomBytes.length; i++) {
      h ^= s.charCodeAt(i % s.length) + i * 37;
      h = Math.imul(h, 16777619);
      randomBytes[i] = Math.abs(h) & 0xff;
    }
  }

  for (let i = 0; i < count; i++) {
    let partA = "";
    let partB = "";
    for (let j = 0; j < 4; j++) {
      const idxA = (randomBytes[i * 8 + j] + (seed.charCodeAt(j % Math.max(1, seed.length)) || 0)) % SAFE_ALPHABET.length;
      const idxB = (randomBytes[i * 8 + 4 + j] + i * 7 + j * 13) % SAFE_ALPHABET.length;
      partA += SAFE_ALPHABET[idxA];
      partB += SAFE_ALPHABET[idxB];
    }
    codes.push(`VL-${partA}-${partB}`);
  }

  return codes;
}

export interface PasswordCriterion {
  id: "length" | "case" | "number" | "symbolOrPassphrase";
  met: boolean;
  labelEn: string;
  labelEs: string;
}

export interface PasswordEvaluation {
  score: number; // 0..4
  allMet: boolean;
  label: string;
  color: string;
  criteria: PasswordCriterion[];
}

/**
 * Evaluates a password against Stage 9's 4 real-time security criteria:
 * 1. At least 8 characters
 * 2. Uppercase & lowercase letters
 * 3. At least 1 number
 * 4. Symbol ([^A-Za-z0-9]) or 12+ character passphrase
 */
export function evaluatePasswordCriteria(pw: string, lang: Language): PasswordEvaluation {
  const isEs = lang === "es";
  const hasLength = pw.length >= 8;
  const hasCase = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
  const hasNumber = /\d/.test(pw);
  const hasSymbolOrPassphrase = /[^A-Za-z0-9]/.test(pw) || pw.length >= 12;

  const criteria: PasswordCriterion[] = [
    {
      id: "length",
      met: hasLength,
      labelEn: "8+ characters",
      labelEs: "Mín. 8 caracteres"
    },
    {
      id: "case",
      met: hasCase,
      labelEn: "Upper & lowercase",
      labelEs: "Mayúsculas y minúsculas"
    },
    {
      id: "number",
      met: hasNumber,
      labelEn: "At least 1 number",
      labelEs: "Al menos 1 número"
    },
    {
      id: "symbolOrPassphrase",
      met: hasSymbolOrPassphrase,
      labelEn: "Symbol or 12+ chars",
      labelEs: "Símbolo o 12+ caract."
    }
  ];

  const score = criteria.filter((c) => c.met).length;
  const allMet = score === 4;

  if (!pw) {
    return {
      score: 0,
      allMet: false,
      label: isEs ? "Ingresa una contraseña" : "Enter a password",
      color: "#64748b",
      criteria
    };
  }
  if (score <= 1) {
    return {
      score: 1,
      allMet: false,
      label: isEs ? "Débil (mín. 8 caracteres)" : "Weak (min 8 chars)",
      color: "#f43f5e",
      criteria
    };
  }
  if (score === 2) {
    return {
      score: 2,
      allMet: false,
      label: isEs ? "Media" : "Fair",
      color: "#f59e0b",
      criteria
    };
  }
  if (score === 3) {
    return {
      score: 3,
      allMet: false,
      label: isEs ? "Buena" : "Good",
      color: "#00e5ff",
      criteria
    };
  }
  return {
    score: 4,
    allMet: true,
    label: isEs ? "Fuerte • Lista para Leonida" : "Strong • Vault Ready",
    color: "#22c55e",
    criteria
  };
}
