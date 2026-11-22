// Server-side module (node:crypto + server env). Intentionally NOT marked
// `import "server-only"` so `tsx --test` can unit-test the hash helpers in
// plain Node; it holds no secrets itself and is only imported by API routes.
import crypto from "node:crypto";

/**
 * Banco General — Yappy Comercial "Botón de Pago V2" server integration.
 *
 * Flow:
 *  1. POST {YAPPY_API_URL}/payments/validate/merchant { merchantId, urlDomain }
 *       -> body.token (short-lived auth token) + body.epochTime
 *  2. POST {YAPPY_API_URL}/payments/payment-wc (Authorization: token)
 *       { merchantId, orderId, domain, paymentDate, ipnUrl, discount, taxes, subtotal, total }
 *       -> body.transactionId, body.token, body.documentName
 *     The browser hands { transactionId, token, documentName } to the Yappy
 *     web component (bt-cdn.yappy.cloud), which completes payment in-app.
 *  3. Yappy calls our IPN (GET /api/webhooks/yappy?orderId&status&hash&domain).
 *     hash = HMAC-SHA256(orderId + status + domain) keyed with the first
 *     segment of the base64-decoded secret key. status E = executed/paid.
 */

export const YAPPY_DEFAULT_API_URL = "https://apipagosbg.bgeneral.cloud";

export type YappyIpnStatus = "E" | "R" | "C" | "X";

export type YappyIpnParams = {
  orderId: string;
  status: string;
  hash: string;
  domain: string;
};

export type YappyCheckoutInit = {
  transactionId: string;
  token: string;
  documentName: string;
};

export class YappyApiError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "YappyApiError";
    this.code = code;
  }
}

export function isYappyConfigured(): boolean {
  return Boolean(process.env.YAPPY_MERCHANT_ID && process.env.YAPPY_SECRET_KEY);
}

export function getYappyApiUrl(): string {
  return (process.env.YAPPY_API_URL || YAPPY_DEFAULT_API_URL).replace(/\/+$/, "");
}

/** Order ids: uppercase alphanumeric, max 15 chars (Yappy limit). */
export function generateYappyOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase(); // 8 chars until ~2059
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomLen = Math.max(1, 15 - 2 - ts.length);
  const bytes = crypto.randomBytes(randomLen);
  let rand = "";
  for (let i = 0; i < randomLen; i++) {
    rand += alphabet[bytes[i]! % alphabet.length];
  }
  return `VL${ts}${rand}`.slice(0, 15);
}

/**
 * Yappy secret keys are delivered base64-encoded; the HMAC key is the first
 * "."-separated segment of the decoded value. Raw (non-encoded) keys are
 * accepted as-is for test environments.
 */
export function deriveYappyHmacKey(secretKey: string): string {
  const trimmed = secretKey.trim();
  if (/^[A-Za-z0-9+/=_-]+$/.test(trimmed)) {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8");
    // eslint-disable-next-line no-control-regex
    if (decoded.includes(".") && !/[\u0000-\u001F\uFFFD]/.test(decoded)) {
      const first = decoded.split(".")[0];
      if (first) return first;
    }
  }
  return trimmed;
}

export function computeYappyIpnHash(
  params: Pick<YappyIpnParams, "orderId" | "status" | "domain">,
  secretKey: string
): string {
  return crypto
    .createHmac("sha256", deriveYappyHmacKey(secretKey))
    .update(`${params.orderId}${params.status}${params.domain}`)
    .digest("hex");
}

export function verifyYappyIpnHash(params: YappyIpnParams, secretKey: string): boolean {
  if (!secretKey || !params.orderId || !params.status || !params.hash) return false;
  if (typeof params.domain !== "string") return false;

  const expected = computeYappyIpnHash(params, secretKey);
  const provided = params.hash.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(provided)) return false;

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

type YappyEnvelope<T> = {
  status?: { code?: string; description?: string };
  body?: T | null;
};

async function postYappy<T>(path: string, payload: Record<string, unknown>, token?: string): Promise<YappyEnvelope<T>> {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = token;

  let res: Response;
  try {
    res = await fetch(`${getYappyApiUrl()}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000)
    });
  } catch (err) {
    throw new YappyApiError("YAPPY_UNREACHABLE", err instanceof Error ? err.message : "Yappy API unreachable");
  }

  let json: YappyEnvelope<T>;
  try {
    json = (await res.json()) as YappyEnvelope<T>;
  } catch {
    throw new YappyApiError("YAPPY_BAD_RESPONSE", `Yappy ${path} returned non-JSON (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new YappyApiError(
      json.status?.code || `HTTP_${res.status}`,
      json.status?.description || `Yappy ${path} failed (HTTP ${res.status})`
    );
  }
  return json;
}

export async function initiateYappyCheckout(input: {
  orderId: string;
  amountUsd: number;
  domainUrl: string;
}): Promise<YappyCheckoutInit> {
  const merchantId = process.env.YAPPY_MERCHANT_ID;
  if (!merchantId || !process.env.YAPPY_SECRET_KEY) {
    throw new YappyApiError("YAPPY_NOT_CONFIGURED", "Yappy merchant credentials are not configured");
  }

  const domain = input.domainUrl.replace(/\/+$/, "");
  const amount = input.amountUsd.toFixed(2);

  const validation = await postYappy<{ token?: string; epochTime?: number }>("/payments/validate/merchant", {
    merchantId,
    urlDomain: domain
  });
  const authToken = validation.body?.token;
  const epochTime = validation.body?.epochTime;
  if (!authToken) {
    throw new YappyApiError(
      validation.status?.code || "YAPPY_MERCHANT_INVALID",
      validation.status?.description || "Yappy merchant validation failed"
    );
  }

  const order = await postYappy<{ transactionId?: string; token?: string; documentName?: string }>(
    "/payments/payment-wc",
    {
      merchantId,
      orderId: input.orderId,
      domain,
      paymentDate: epochTime ?? Math.floor(Date.now() / 1000),
      aliasYappy: "",
      ipnUrl: `${domain}/api/webhooks/yappy`,
      discount: "0.00",
      taxes: "0.00",
      subtotal: amount,
      total: amount
    },
    authToken
  );

  const body = order.body;
  if (!body?.transactionId || !body.token || !body.documentName) {
    throw new YappyApiError(
      order.status?.code || "YAPPY_ORDER_FAILED",
      order.status?.description || "Yappy order creation failed"
    );
  }

  return { transactionId: body.transactionId, token: body.token, documentName: body.documentName };
}
