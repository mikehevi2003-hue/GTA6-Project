/**
 * Input sanitisation helpers shared by API routes.
 * The UI renders everything as React text nodes (no dangerouslySetInnerHTML),
 * these helpers add defence in depth before anything is persisted.
 */

export const HANDLE_PATTERN = /^@[A-Za-z0-9_]{2,24}$/;

// C0/C1 control characters except \n and \t, plus zero-width / bidi overrides.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g;

/**
 * Normalises a user handle to `@[A-Za-z0-9_]{2,24}`.
 * Leading `@` characters and disallowed characters are stripped; the body is
 * truncated to 24 characters. Returns "" when fewer than 2 valid characters
 * remain (callers must treat "" as invalid).
 */
export function normalizeHandle(input: string): string {
  if (typeof input !== "string") return "";
  const body = input
    .normalize("NFKC")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^A-Za-z0-9_]/g, "")
    .slice(0, 24);
  if (body.length < 2) return "";
  const handle = `@${body}`;
  return HANDLE_PATTERN.test(handle) ? handle : "";
}

export function isValidHandle(input: string): boolean {
  return typeof input === "string" && HANDLE_PATTERN.test(input);
}

/**
 * Strips control characters and angle brackets, collapses runs of 3+ newlines,
 * trims and truncates to `maxLen` characters.
 */
export function sanitizePlainText(input: string, maxLen: number): string {
  if (typeof input !== "string") return "";
  const limit = Number.isFinite(maxLen) && maxLen > 0 ? Math.floor(maxLen) : 0;
  return input
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/[<>]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, limit)
    .trim();
}

const DISALLOWED_MARKUP = [
  /<\s*\/?\s*[a-z!?][^>]*>/i, // any HTML-ish tag
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon[a-z]+\s*=/i, // inline event handlers
  /&#x?[0-9a-f]+;?/i, // encoded entities used to smuggle markup
  /\[url\s*=|\[img\]/i // BBCode
];

export function containsDisallowedMarkup(input: string): boolean {
  if (typeof input !== "string") return false;
  return DISALLOWED_MARKUP.some((re) => re.test(input));
}
