import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import Module from "node:module";
import type {
  CheatItem,
  GlitchCategory,
  GlitchItem,
  Language,
  LocalizedText,
  MapPin,
  SpoilerChapter,
  UserTier
} from "../src/types/vicelink";

// Intercept `import "server-only"` in both CJS and ESM loaders so Next.js server data modules run cleanly under `tsx --test`
const mod = Module as unknown as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
  registerHooks?: (hooks: {
    load?: (
      url: string,
      context: unknown,
      nextLoad: (url: string, context: unknown) => unknown
    ) => unknown;
  }) => void;
};
const originalLoad = mod._load;
mod._load = function patchedLoad(request: string, parent: unknown, isMain: boolean): unknown {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, parent, isMain);
};
if (typeof mod.registerHooks === "function") {
  mod.registerHooks({
    load(url, context, nextLoad) {
      if (url.includes("/node_modules/server-only/")) {
        return {
          format: "module",
          shortCircuit: true,
          source: "export {};"
        };
      }
      return nextLoad(url, context);
    }
  });
}

async function importProjectModule<T>(relativePath: string): Promise<T> {
  const url = new URL(relativePath, import.meta.url).href;
  return (await import(url)) as T;
}

function collectLocalizedText(node: unknown, lang: Language): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) {
    return node.map((item) => collectLocalizedText(item, lang)).join(" ");
  }
  if (typeof node === "object") {
    const rec = node as Record<string, unknown>;
    if (typeof rec[lang] === "string") {
      return rec[lang] as string;
    }
    if (Array.isArray(rec[lang])) {
      return (rec[lang] as unknown[])
        .map((item) => collectLocalizedText(item, lang))
        .join(" ");
    }
    return Object.values(rec)
      .map((val) => collectLocalizedText(val, lang))
      .join(" ");
  }
  return "";
}

describe("ViceLink Stage E — Automated Security, Data & Bilingual Logic Suite", () => {
  it("1. TRANSLATIONS.en and TRANSLATIONS.es have 100% identical key sets and no '61 Total' / '61 Cheat' mismatch", async () => {
    const { TRANSLATIONS } = await importProjectModule<{
      TRANSLATIONS: Record<Language, Record<string, string>>;
    }>("../src/lib/i18n/translations.ts");

    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const esKeys = Object.keys(TRANSLATIONS.es).sort();

    assert.ok(enKeys.length > 50, `Expected rich translation table, got ${enKeys.length} keys`);
    assert.deepEqual(
      enKeys,
      esKeys,
      "TRANSLATIONS.en and TRANSLATIONS.es must have 100% identical key sets"
    );

    for (const key of enKeys) {
      const enVal = TRANSLATIONS.en[key];
      const esVal = TRANSLATIONS.es[key];
      assert.ok(
        typeof enVal === "string" && enVal.trim().length > 0,
        `Missing or empty EN translation for key "${key}"`
      );
      assert.ok(
        typeof esVal === "string" && esVal.trim().length > 0,
        `Missing or empty ES translation for key "${key}"`
      );
      assert.ok(
        !/61\s*(total|cheat|truco)/i.test(enVal),
        `EN translation key "${key}" contains outdated hardcoded 61 count: "${enVal}"`
      );
      assert.ok(
        !/61\s*(total|cheat|truco)/i.test(esVal),
        `ES translation key "${key}" contains outdated hardcoded 61 count: "${esVal}"`
      );
    }
  });

  it("2. LEGAL_POLICIES includes non-empty EN & ES text for Terms, Refunds, Privacy (Law 81 / Ley 81), and Unofficial Fan Disclaimer", async () => {
    const { LEGAL_POLICIES } = await importProjectModule<{
      LEGAL_POLICIES: {
        terms: unknown;
        refunds: unknown;
        privacy: unknown;
        disclaimer: LocalizedText | unknown;
      };
    }>("../src/lib/legal/policies.ts");

    assert.ok(LEGAL_POLICIES, "LEGAL_POLICIES must be exported");

    for (const section of ["terms", "refunds", "privacy", "disclaimer"] as const) {
      const enText = collectLocalizedText(LEGAL_POLICIES[section], "en").trim();
      const esText = collectLocalizedText(LEGAL_POLICIES[section], "es").trim();
      assert.ok(enText.length > 30, `Expected non-empty EN text for LEGAL_POLICIES.${section}`);
      assert.ok(esText.length > 30, `Expected non-empty ES text for LEGAL_POLICIES.${section}`);
    }

    const privacyEn = collectLocalizedText(LEGAL_POLICIES.privacy, "en");
    const privacyEs = collectLocalizedText(LEGAL_POLICIES.privacy, "es");
    assert.match(privacyEn, /Law 81/i, "EN Privacy Policy must reference Panama Law 81");
    assert.match(privacyEs, /Ley 81/i, "ES Privacy Policy must reference Panama Ley 81");

    const disclaimerEn = collectLocalizedText(LEGAL_POLICIES.disclaimer, "en");
    const disclaimerEs = collectLocalizedText(LEGAL_POLICIES.disclaimer, "es");
    assert.match(disclaimerEn, /Rockstar Games/i);
    assert.match(disclaimerEs, /Rockstar Games/i);
  });

  it("3. LEONIDA_PINS has 32 pins, ZERO duplicate leading emojis in name.en/name.es, and minimum pairwise Euclidean distance >= 3.8", async () => {
    const { LEONIDA_PINS } = await importProjectModule<{
      LEONIDA_PINS: MapPin[];
    }>("../src/server/data/pins.ts");

    assert.equal(LEONIDA_PINS.length, 32, "LEONIDA_PINS must contain exactly 32 locations");

    for (const pin of LEONIDA_PINS) {
      const nameEn = pin.name.en.trim();
      const nameEs = pin.name.es.trim();
      assert.ok(
        !nameEn.startsWith(pin.icon),
        `Pin ${pin.id} name.en ("${nameEn}") must not start with duplicate icon "${pin.icon}"`
      );
      assert.ok(
        !nameEs.startsWith(pin.icon),
        `Pin ${pin.id} name.es ("${nameEs}") must not start with duplicate icon "${pin.icon}"`
      );
      assert.ok(
        !/^[\p{Extended_Pictographic}\uFE0F]+\s+/u.test(nameEn),
        `Pin ${pin.id} name.en ("${nameEn}") should not have a leading emoji prefix`
      );
      assert.ok(
        !/^[\p{Extended_Pictographic}\uFE0F]+\s+/u.test(nameEs),
        `Pin ${pin.id} name.es ("${nameEs}") should not have a leading emoji prefix`
      );
    }

    let minDistance = Infinity;
    let closestPair = "";
    for (let i = 0; i < LEONIDA_PINS.length; i++) {
      for (let j = i + 1; j < LEONIDA_PINS.length; j++) {
        const a = LEONIDA_PINS[i];
        const b = LEONIDA_PINS[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < minDistance) {
          minDistance = dist;
          closestPair = `${a.id} (${a.x},${a.y}) <-> ${b.id} (${b.x},${b.y})`;
        }
      }
    }

    assert.ok(
      minDistance >= 3.8,
      `Expected minimum pairwise Euclidean distance >= 3.8 across all 32 pins, but got ${minDistance.toFixed(
        3
      )} between ${closestPair}`
    );
  });

  it("4. GLITCHES_DATA has >= 1 glitch in every category (Money, Camera, Stealth, Physics) and CHEATS_DATA has 19 items", async () => {
    const { GLITCHES_DATA } = await importProjectModule<{
      GLITCHES_DATA: GlitchItem[];
    }>("../src/server/data/glitches.ts");
    const { CHEATS_DATA } = await importProjectModule<{
      CHEATS_DATA: CheatItem[];
    }>("../src/server/data/cheats.ts");

    assert.equal(CHEATS_DATA.length, 19, "CHEATS_DATA must contain all 19 cheats");

    const requiredCategories: GlitchCategory[] = ["Money", "Camera", "Stealth", "Physics"];
    for (const category of requiredCategories) {
      const matches = GLITCHES_DATA.filter((g) => g.category === category);
      assert.ok(
        matches.length >= 1,
        `Expected >= 1 glitch in category "${category}", found ${matches.length}`
      );
    }
  });

  it("5. getBuiltInLeonidaReply returns dedicated Easter Eggs intel in EN & ES (never trunk fallback) and enforces ch1 Spoiler Shield", async () => {
    const { getBuiltInLeonidaReply } = await importProjectModule<{
      getBuiltInLeonidaReply: (
        question: string,
        chapter: SpoilerChapter,
        lang: Language
      ) => string;
    }>("../src/server/data/leonida-brain.ts");

    const enEggReply = getBuiltInLeonidaReply("easter eggs", "endgame", "en");
    assert.doesNotMatch(
      enEggReply,
      /heavy weapons are stored in your vehicle trunk/i,
      "EN 'easter eggs' query must not fall through to the generic trunk fallback"
    );
    assert.match(
      enEggReply,
      /radio tower|dexter|ufo|nest|skunk|arthur/i,
      "EN 'easter eggs' reply must include specific Leonida Easter egg intel"
    );

    const esEggReply1 = getBuiltInLeonidaReply("easter eggs", "endgame", "es");
    const esEggReply2 = getBuiltInLeonidaReply("torre de radio", "endgame", "es");
    assert.doesNotMatch(
      esEggReply1,
      /maletero del auto/i,
      "ES 'easter eggs' query must not fall through to the generic trunk fallback"
    );
    assert.match(
      esEggReply1,
      /torre de radio|dexter|ovni|ufo|nido|arthur/i,
      "ES 'easter eggs' reply must include specific Leonida Easter egg intel"
    );
    assert.match(
      esEggReply2,
      /torre de radio|nido|dexter|ovni|ufo/i,
      "ES 'torre de radio' reply must include specific Leonida Easter egg intel"
    );

    const ch1MoneyEn = getBuiltInLeonidaReply("best money route", "ch1", "en");
    const ch1MoneyEs = getBuiltInLeonidaReply("mejor ruta de dinero", "ch1", "es");
    assert.match(
      ch1MoneyEn,
      /spoiler|ch\.?\s*1|chapter\s*1/i,
      "EN money reply in ch1 must enforce Chapter 1 Spoiler Shield"
    );
    assert.match(
      ch1MoneyEs,
      /spoiler|cap\.?\s*1|cap[íi]tulo\s*1/i,
      "ES money reply in ch1 must enforce Chapter 1 Spoiler Shield"
    );
  });

  it("6. hasAccess tier matrix, sanitizePlainText / normalizeHandle, and Yappy order ID + HMAC-SHA256 IPN verification", async () => {
    const { hasAccess } = await importProjectModule<{
      hasAccess: (userTier: UserTier, requiredTier: UserTier) => boolean;
    }>("../src/lib/security/tier.ts");

    // free < street < kingpin matrix
    assert.equal(hasAccess("free", "free"), true);
    assert.equal(hasAccess("free", "street"), false);
    assert.equal(hasAccess("free", "kingpin"), false);

    assert.equal(hasAccess("street", "free"), true);
    assert.equal(hasAccess("street", "street"), true);
    assert.equal(hasAccess("street", "kingpin"), false);

    assert.equal(hasAccess("kingpin", "free"), true);
    assert.equal(hasAccess("kingpin", "street"), true);
    assert.equal(hasAccess("kingpin", "kingpin"), true);

    const { sanitizePlainText, normalizeHandle } = await importProjectModule<{
      sanitizePlainText: (input: string, maxLen: number) => string;
      normalizeHandle: (input: string) => string;
    }>("../src/lib/security/sanitize.ts");

    const dirty = "  <script>alert('xss')</script>Hello Leonida!  ";
    const clean = sanitizePlainText(dirty, 100);
    assert.ok(!clean.includes("<") && !clean.includes(">"), "sanitizePlainText must strip < and >");

    const normalized = normalizeHandle("Vice_Kingpin!");
    assert.match(normalized, /^@[A-Za-z0-9_]{2,24}$/, "normalizeHandle must enforce @[A-Za-z0-9_]{2,24}");

    const { generateYappyOrderId, verifyYappyIpnHash } = await importProjectModule<{
      generateYappyOrderId: () => string;
      verifyYappyIpnHash: (
        params: { orderId: string; status: string; hash: string; domain: string },
        secretKey: string
      ) => boolean;
    }>("../src/lib/payments/yappy.ts");

    const orderId = generateYappyOrderId();
    assert.match(
      orderId,
      /^[A-Z0-9]{1,15}$/,
      `Yappy orderId ("${orderId}") must be <= 15 uppercase alphanumeric characters`
    );

    const rawSecret = "vicelink_yappy_hmac_secret_2026";
    const domain = "https://vicelink.app";
    const status = "E";
    const payload = `${orderId}${status}${domain}`;

    const candidateHashes = [
      createHmac("sha256", rawSecret).update(payload).digest("hex"),
      createHmac("sha256", Buffer.from(rawSecret, "base64")).update(payload).digest("hex")
    ];

    const matchedHash = candidateHashes.find((hash) =>
      verifyYappyIpnHash({ orderId, status, domain, hash }, rawSecret)
    );

    assert.ok(
      matchedHash,
      "verifyYappyIpnHash must accept a valid HMAC-SHA256 signature for orderId + status + domain"
    );

    assert.equal(
      verifyYappyIpnHash(
        { orderId, status, domain, hash: "0".repeat(64) },
        rawSecret
      ),
      false,
      "verifyYappyIpnHash must reject a forged hash"
    );

    assert.equal(
      verifyYappyIpnHash(
        { orderId, status: "R", domain, hash: matchedHash! },
        rawSecret
      ),
      false,
      "verifyYappyIpnHash must reject when status is tampered"
    );
  });
});
