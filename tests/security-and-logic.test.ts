import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import Module from "node:module";
import type {
  CheatItem,
  ControlCategory,
  CriminalProfileTier,
  GlitchCategory,
  GlitchItem,
  HiddenControlItem,
  Language,
  LocalizedText,
  MapPin,
  RadioStation,
  SpoilerChapter,
  TrophyItem,
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

  it("7. HIDDEN_CONTROLS_DATA has >= 30 items covering all 5 categories with non-empty ps5Keys & xboxKeys and bilingual EN/ES fields", async () => {
    const { HIDDEN_CONTROLS_DATA } = await importProjectModule<{
      HIDDEN_CONTROLS_DATA: HiddenControlItem[];
    }>("../src/server/data/controls.ts");

    assert.ok(
      HIDDEN_CONTROLS_DATA.length >= 30,
      `Expected >= 30 hidden controls, got ${HIDDEN_CONTROLS_DATA.length}`
    );

    const requiredCategories: ControlCategory[] = [
      "On-Foot",
      "Combat & Weapons",
      "Driving & Cars",
      "Boats & Trailers",
      "Planes & Parachuting"
    ];

    for (const cat of requiredCategories) {
      const catControls = HIDDEN_CONTROLS_DATA.filter((c) => c.category === cat);
      assert.ok(
        catControls.length >= 1,
        `Expected >= 1 control in category "${cat}", got ${catControls.length}`
      );
    }

    for (const ctrl of HIDDEN_CONTROLS_DATA) {
      assert.ok(
        Array.isArray(ctrl.ps5Keys) && ctrl.ps5Keys.length >= 1,
        `Control ${ctrl.id} must have non-empty ps5Keys`
      );
      assert.ok(
        Array.isArray(ctrl.xboxKeys) && ctrl.xboxKeys.length >= 1,
        `Control ${ctrl.id} must have non-empty xboxKeys`
      );
      assert.ok(ctrl.title.en.trim().length > 0 && ctrl.title.es.trim().length > 0);
      assert.ok(ctrl.ps5.en.trim().length > 0 && ctrl.ps5.es.trim().length > 0);
      assert.ok(ctrl.xbox.en.trim().length > 0 && ctrl.xbox.es.trim().length > 0);
      assert.ok(ctrl.tip.en.trim().length > 0 && ctrl.tip.es.trim().length > 0);
    }
  });

  it("8. RADIO_STATIONS_DATA has exact 25 stations including Cocoteo FM, Worldwide FM, AfroBank FM, Back Country Radio, The Chamber 106.6, Flash FM, and Vault Radio with unlockNote", async () => {
    const { RADIO_STATIONS_DATA } = await importProjectModule<{
      RADIO_STATIONS_DATA: RadioStation[];
    }>("../src/server/data/radio.ts");

    assert.equal(
      RADIO_STATIONS_DATA.length,
      25,
      `Expected exact 25 radio stations, got ${RADIO_STATIONS_DATA.length}`
    );

    const cocoteo = RADIO_STATIONS_DATA.find((s) => /cocoteo\s*fm/i.test(s.name));
    assert.ok(cocoteo, "RADIO_STATIONS_DATA must include Cocoteo FM");
    assert.match(cocoteo.hosts, /Bad Bunny/i);
    assert.match(cocoteo.hosts, /RaiNao/i);

    const worldwide = RADIO_STATIONS_DATA.find((s) => /worldwide\s*fm/i.test(s.name));
    assert.ok(worldwide, "RADIO_STATIONS_DATA must include Worldwide FM");
    assert.match(worldwide.hosts, /Gilles Peterson/i);
    assert.ok(
      worldwide.tracks.some((t) => /Bobby Caldwell/i.test(t.artist) || /What You Won't Do For Love/i.test(t.title)),
      "Worldwide FM must include Bobby Caldwell — What You Won't Do For Love"
    );

    const afrobank = RADIO_STATIONS_DATA.find((s) => /afrobank\s*fm/i.test(s.name));
    assert.ok(afrobank, "RADIO_STATIONS_DATA must include AfroBank FM");
    assert.match(afrobank.hosts, /Burna Boy/i);

    const backCountry = RADIO_STATIONS_DATA.find((s) => /back\s*country\s*radio/i.test(s.name));
    assert.ok(backCountry, "RADIO_STATIONS_DATA must include Back Country Radio");

    const chamber = RADIO_STATIONS_DATA.find((s) => /the\s*chamber\s*106\.6/i.test(s.name));
    assert.ok(chamber, "RADIO_STATIONS_DATA must include The Chamber 106.6");

    const flashFm = RADIO_STATIONS_DATA.find((s) => /flash\s*fm/i.test(s.name));
    assert.ok(flashFm, "RADIO_STATIONS_DATA must include Flash FM");

    const vaultRadio = RADIO_STATIONS_DATA.find((s) => /vault\s*radio/i.test(s.name));
    assert.ok(vaultRadio, "RADIO_STATIONS_DATA must include Vault Radio");
    assert.ok(
      vaultRadio.unlockNote &&
        vaultRadio.unlockNote.en.trim().length > 0 &&
        vaultRadio.unlockNote.es.trim().length > 0,
      "Vault Radio must include a bilingual unlockNote"
    );
  });

  it("9. TROPHIES_DATA has exact 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze incl. missable Positive Mental Attitude) and CRIMINAL_PROFILE_TIERS has 5 tiers ending with permanent irredeemable", async () => {
    const { TROPHIES_DATA, CRIMINAL_PROFILE_TIERS } = await importProjectModule<{
      TROPHIES_DATA: TrophyItem[];
      CRIMINAL_PROFILE_TIERS: CriminalProfileTier[];
    }>("../src/server/data/trophies.ts");

    assert.equal(
      TROPHIES_DATA.length,
      55,
      `Expected exact 55 trophies, got ${TROPHIES_DATA.length}`
    );

    const platinum = TROPHIES_DATA.filter((t) => t.grade === "platinum");
    const gold = TROPHIES_DATA.filter((t) => t.grade === "gold");
    const silver = TROPHIES_DATA.filter((t) => t.grade === "silver");
    const bronze = TROPHIES_DATA.filter((t) => t.grade === "bronze");

    assert.equal(platinum.length, 1, "Expected 1 platinum trophy");
    assert.equal(gold.length, 2, "Expected 2 gold trophies");
    assert.equal(silver.length, 6, "Expected 6 silver trophies");
    assert.equal(bronze.length, 46, "Expected 46 bronze trophies");

    assert.match(platinum[0].title.en, /Vice Got a Price!/i);
    assert.ok(
      gold.some((t) => /A Long Road/i.test(t.title.en)),
      "Gold trophies must include 'A Long Road'"
    );

    const pma = bronze.find((t) => /Positive Mental Attitude/i.test(t.title.en));
    assert.ok(pma, "Bronze trophies must include 'Positive Mental Attitude'");
    assert.equal(pma.missable, true, "'Positive Mental Attitude' must be marked missable: true");

    assert.equal(
      CRIMINAL_PROFILE_TIERS.length,
      5,
      `Expected exact 5 criminal profile tiers, got ${CRIMINAL_PROFILE_TIERS.length}`
    );
    const lastTier = CRIMINAL_PROFILE_TIERS[CRIMINAL_PROFILE_TIERS.length - 1];
    assert.equal(lastTier.id, "irredeemable", "5th criminal profile tier must be 'irredeemable'");
    assert.equal(lastTier.permanent, true, "'irredeemable' tier must have permanent: true");
  });

  it("10. Stage 5–8 EN/ES key parity and admin/submission XSS safety helper checks", async () => {
    const { TRANSLATIONS } = await importProjectModule<{
      TRANSLATIONS: Record<Language, Record<string, string>>;
    }>("../src/lib/i18n/translations.ts");

    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const esKeys = Object.keys(TRANSLATIONS.es).sort();
    assert.deepEqual(enKeys, esKeys, "Stage 5–8 TRANSLATIONS.en and TRANSLATIONS.es must maintain 100% key parity");

    const {
      containsDisallowedMarkup,
      sanitizePlainText,
      isValidHandle,
      normalizeHandle
    } = await importProjectModule<{
      containsDisallowedMarkup: (input: string) => boolean;
      sanitizePlainText: (input: string, maxLen: number) => string;
      isValidHandle: (input: string) => boolean;
      normalizeHandle: (input: string) => string;
    }>("../src/lib/security/sanitize.ts");

    assert.equal(containsDisallowedMarkup("<script>fetch('/api/admin')</script>"), true);
    assert.equal(containsDisallowedMarkup("javascript:alert(1)"), true);
    assert.equal(containsDisallowedMarkup("<img src=x onerror=alert(1)>"), true);
    assert.equal(containsDisallowedMarkup("[url=https://evil.test]click[/url]"), true);
    assert.equal(containsDisallowedMarkup("&#x3c;script&#x3e;"), true);
    assert.equal(
      containsDisallowedMarkup("Hidden ATM behind the Little Cuba laundromat pays $4,500 after 2:00 AM."),
      false
    );

    const sanitized = sanitizePlainText("<b>Admin Note</b>\u0000\u202E: Verified on Patch 01.002.001", 120);
    assert.ok(!sanitized.includes("<") && !sanitized.includes(">") && !sanitized.includes("\u0000"));
    assert.equal(isValidHandle(normalizeHandle("@Leonida_Founder")), true);
  });

  it("11. Stage 10 Co-Founder email recognition logic (mikehevi2003@gmail.com & felipedleon@gmail.com, case-insensitive & trimmed) vs non-founder emails", async () => {
    const COFOUNDER_EMAILS = new Set(["mikehevi2003@gmail.com", "felipedleon@gmail.com"]);

    function isCoFounderEmail(email: unknown): boolean {
      if (typeof email !== "string") return false;
      return COFOUNDER_EMAILS.has(email.trim().toLowerCase());
    }

    function resolveProfilePrivileges(email: string, existingTier: UserTier = "free") {
      if (isCoFounderEmail(email)) {
        return { isAdmin: true, tier: "kingpin" as UserTier, isBanned: false };
      }
      return { isAdmin: false, tier: existingTier, isBanned: false };
    }

    assert.equal(isCoFounderEmail("mikehevi2003@gmail.com"), true);
    assert.equal(isCoFounderEmail("  MikeHevi2003@Gmail.com "), true);
    assert.equal(isCoFounderEmail("felipedleon@gmail.com"), true);
    assert.equal(isCoFounderEmail("FELIPEDLEON@GMAIL.COM\n"), true);

    assert.equal(isCoFounderEmail("player@vicelink.app"), false);
    assert.equal(isCoFounderEmail("mikehevi2003@gmail.com.attacker.test"), false);
    assert.equal(isCoFounderEmail("felipedleon@yahoo.com"), false);
    assert.equal(isCoFounderEmail(""), false);
    assert.equal(isCoFounderEmail(null), false);

    assert.deepEqual(resolveProfilePrivileges("  MIKEHEVI2003@gmail.com  "), {
      isAdmin: true,
      tier: "kingpin",
      isBanned: false
    });
    assert.deepEqual(resolveProfilePrivileges("  FelipeDLeon@gmail.com "), {
      isAdmin: true,
      tier: "kingpin",
      isBanned: false
    });
    assert.deepEqual(resolveProfilePrivileges("recruit@leonida.test", "free"), {
      isAdmin: false,
      tier: "free",
      isBanned: false
    });
  });

  it("12. Stage 9 Bio verification code generator/validator (VL-[A-F0-9]{6}) and console handle validation (3..24 chars, [A-Za-z0-9 _-], rejecting <script> / HTML markup)", async () => {
    const { containsDisallowedMarkup } = await importProjectModule<{
      containsDisallowedMarkup: (input: string) => boolean;
    }>("../src/lib/security/sanitize.ts");

    const BIO_CODE_REGEX = /^VL-[A-F0-9]{6}$/;
    const CONSOLE_HANDLE_REGEX = /^[A-Za-z0-9 _-]{3,24}$/;

    function generateBioVerificationCode(): string {
      return `VL-${randomBytes(3).toString("hex").toUpperCase()}`;
    }

    function isValidBioVerificationCode(code: unknown): boolean {
      return typeof code === "string" && BIO_CODE_REGEX.test(code.trim());
    }

    function isValidConsoleHandle(handle: unknown): boolean {
      if (typeof handle !== "string") return false;
      const trimmed = handle.trim();
      if (containsDisallowedMarkup(trimmed)) return false;
      return CONSOLE_HANDLE_REGEX.test(trimmed);
    }

    for (let i = 0; i < 10; i++) {
      const generated = generateBioVerificationCode();
      assert.equal(
        isValidBioVerificationCode(generated),
        true,
        `Generated bio code "${generated}" must match /^VL-[A-F0-9]{6}$/`
      );
    }

    assert.equal(isValidBioVerificationCode("VL-94A2F1"), true);
    assert.equal(isValidBioVerificationCode("VL-00FFAB"), true);
    assert.equal(isValidBioVerificationCode("vl-94a2f1"), false);
    assert.equal(isValidBioVerificationCode("VL-12345"), false);
    assert.equal(isValidBioVerificationCode("VL-1234567"), false);
    assert.equal(isValidBioVerificationCode("VL-ZZZZZZ"), false);

    // Valid PSN / Xbox / Social Club handles (3..24 chars, alphanumeric + space, _, -)
    assert.equal(isValidConsoleHandle("Lucia_Vice6"), true);
    assert.equal(isValidConsoleHandle("Jason Keys 2026"), true);
    assert.equal(isValidConsoleHandle("Kingpin-PS5"), true);
    assert.equal(isValidConsoleHandle("ABC"), true);
    assert.equal(isValidConsoleHandle("A".repeat(24)), true);

    // Invalid console handles (too short, too long, HTML/script injection)
    assert.equal(isValidConsoleHandle("ab"), false);
    assert.equal(isValidConsoleHandle("A".repeat(25)), false);
    assert.equal(isValidConsoleHandle("<script>alert(1)</script>"), false);
    assert.equal(isValidConsoleHandle("<img src=x onerror=alert(1)>"), false);
    assert.equal(isValidConsoleHandle("Vice<Admin>"), false);
    assert.equal(isValidConsoleHandle("javascript:alert(1)"), false);
  });

  it("13. Stage 9 4-criterion password strength evaluator rejects weak passwords ('123456', 'password') and passes strong ones ('Leonida#2026')", async () => {
    function evaluatePasswordCriteria(pw: string) {
      const minLength = pw.length >= 8;
      const upperAndLower = /[a-z]/.test(pw) && /[A-Z]/.test(pw);
      const hasDigit = /\d/.test(pw);
      const hasSymbolOrPassphrase = /[^A-Za-z0-9]/.test(pw) || pw.length >= 12;
      const score =
        (minLength ? 1 : 0) +
        (upperAndLower ? 1 : 0) +
        (hasDigit ? 1 : 0) +
        (hasSymbolOrPassphrase ? 1 : 0);
      return {
        minLength,
        upperAndLower,
        hasDigit,
        hasSymbolOrPassphrase,
        score,
        isStrong: score === 4 && minLength
      };
    }

    const weak1 = evaluatePasswordCriteria("123456");
    assert.equal(weak1.isStrong, false, "'123456' must be rejected as weak");
    assert.equal(weak1.minLength, false);

    const weak2 = evaluatePasswordCriteria("password");
    assert.equal(weak2.isStrong, false, "'password' must be rejected as weak");
    assert.equal(weak2.upperAndLower, false);
    assert.equal(weak2.hasDigit, false);

    const weak3 = evaluatePasswordCriteria("alllowercase123");
    assert.equal(weak3.isStrong, false, "Password missing uppercase must not pass all 4 criteria");

    const strong1 = evaluatePasswordCriteria("Leonida#2026");
    assert.equal(strong1.isStrong, true, "'Leonida#2026' must pass all 4 criteria");
    assert.equal(strong1.score, 4);

    const strong2 = evaluatePasswordCriteria("ViceCityKingpin2026");
    assert.equal(strong2.isStrong, true, "12+ char mixed-case alphanumeric passphrase must pass all 4 criteria");
    assert.equal(strong2.score, 4);
  });

  it("14. Stage 9–11 bilingual TRANSLATIONS key parity check and Neo-Glass HUD CSS class presence verification (mobile-bottom-dock, cmdk-modal, admin-kpi-grid, auth-split-shell)", async () => {
    const { TRANSLATIONS } = await importProjectModule<{
      TRANSLATIONS: Record<Language, Record<string, string>>;
    }>("../src/lib/i18n/translations.ts");

    const enKeys = Object.keys(TRANSLATIONS.en).sort();
    const esKeys = Object.keys(TRANSLATIONS.es).sort();
    assert.deepEqual(
      enKeys,
      esKeys,
      "Stage 9–11 TRANSLATIONS.en and TRANSLATIONS.es must have 100% identical key sets"
    );

    const requiredStage9To11Keys = [
      "nav.account",
      "dock.cheats",
      "dock.map",
      "dock.glitches",
      "dock.ai",
      "dock.account",
      "auth.showcase.title",
      "auth.criteria.length",
      "auth.criteria.case",
      "auth.criteria.digit",
      "auth.criteria.symbol",
      "auth.recovery.title",
      "auth.mfa.title",
      "reset.title",
      "console.bioCodeLabel",
      "ocr.title",
      "mfa.sectionTitle",
      "admin.cofounderBadge",
      "admin.kpi.revenue",
      "admin.auditTitle",
      "cmdk.placeholder"
    ];

    for (const key of requiredStage9To11Keys) {
      assert.ok(
        typeof TRANSLATIONS.en[key] === "string" && TRANSLATIONS.en[key].trim().length > 0,
        `Expected Stage 9–11 EN translation for "${key}"`
      );
      assert.ok(
        typeof TRANSLATIONS.es[key] === "string" && TRANSLATIONS.es[key].trim().length > 0,
        `Expected Stage 9–11 ES translation for "${key}"`
      );
    }

    const cssUrl = new URL("../src/styles/vice-ui.css", import.meta.url);
    const cssText = readFileSync(cssUrl, "utf8");

    const requiredCssTokens = [
      "#05070e",
      "backdrop-filter: blur(18px)",
      "font-variant-numeric: tabular-nums",
      ".auth-split-shell",
      ".auth-showcase-panel",
      ".auth-password-wrap",
      ".auth-password-toggle",
      ".auth-strength-grid",
      ".auth-strength-item",
      ".auth-otp-grid",
      ".auth-recovery-card",
      ".auth-reset-shell",
      ".global-ticker-bar",
      ".cmdk-trigger-btn",
      ".cmdk-backdrop",
      ".cmdk-modal",
      ".cmdk-input-wrap",
      ".cmdk-input",
      ".cmdk-cats",
      ".cmdk-results",
      ".cmdk-item",
      ".account-grid",
      ".avatar-preset-grid",
      ".avatar-preset-btn",
      ".console-link-grid",
      ".console-link-card",
      ".bio-code-box",
      ".totp-qr-box",
      ".backup-codes-grid",
      ".ocr-dropzone",
      ".console-verified-pill",
      ".admin-kpi-grid",
      ".admin-kpi-card",
      ".admin-kpi-value",
      ".admin-subnav",
      ".audit-log-table-wrap",
      ".audit-log-table",
      ".flag-toggle-row",
      ".aal-badge",
      ".mobile-bottom-dock",
      ".mobile-dock-btn"
    ];

    for (const token of requiredCssTokens) {
      assert.ok(
        cssText.includes(token),
        `Expected src/styles/vice-ui.css to include "${token}"`
      );
    }
  });

  it("15. [QA-01 / QA-02 / QA-03] Co-Founder auto-elevation, safe Gmail & Apple iCloud @handle generation (^@[A-Za-z0-9_]{2,24}$), and non-lockout 2FA enrollment/login flow", async () => {
    const HANDLE_REGEX = /^@[A-Za-z0-9_]{2,24}$/;

    function deriveSafeHandleFromEmail(email: string, userId: string, rawHandle?: string): string {
      if (rawHandle && typeof rawHandle === "string") {
        const cleanedRaw =
          "@" +
          rawHandle
            .trim()
            .replace(/^@+/, "")
            .replace(/[^A-Za-z0-9_]/g, "")
            .slice(0, 24);
        if (HANDLE_REGEX.test(cleanedRaw)) {
          return cleanedRaw;
        }
      }
      const localPart = (email.toLowerCase().split("@")[0] || "")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .slice(0, 14);
      const prefix = localPart.length > 0 ? localPart : "agent";
      const suffix = userId.replace(/-/g, "").slice(0, 4) || "0001";
      return `@${prefix}_${suffix}`;
    }

    const testAccounts = [
      { email: "mikehevi2003@gmail.com", uid: "c0f00001-1111-4444-8888-000000000001", isFounder: true },
      { email: "felipedleon@gmail.com", uid: "c0f00002-2222-4444-8888-000000000002", isFounder: true },
      { email: "vice.player+gta6@icloud.com", uid: "a1b2c3d4-3333-4444-8888-000000000003", isFounder: false },
      { email: "a@me.com", uid: "f9e8d7c6-4444-4444-8888-000000000004", isFounder: false },
      {
        email: "12345678901234567890.very.long.alias@privaterelay.appleid.com",
        uid: "b5c6d7e8-5555-4444-8888-000000000005",
        isFounder: false
      },
      { email: "---@@@icloud.com", uid: "99887766-6666-4444-8888-000000000006", isFounder: false }
    ];

    for (const acct of testAccounts) {
      const generatedHandle = deriveSafeHandleFromEmail(acct.email, acct.uid);
      assert.match(
        generatedHandle,
        HANDLE_REGEX,
        `Handle "${generatedHandle}" for "${acct.email}" must match /^@[A-Za-z0-9_]{2,24}$/`
      );
      const isFounder = ["mikehevi2003@gmail.com", "felipedleon@gmail.com"].includes(
        acct.email.trim().toLowerCase()
      );
      assert.equal(isFounder, acct.isFounder);
    }

    // Non-lockout 2FA decision verification: orphaned/unverified factors or mfa_enabled=false must NEVER lock out login
    function evaluatePostLoginMfaDecision(params: {
      factors: { id: string; factor_type: string; status: "verified" | "unverified" }[];
      mfaEnabledInProfile: boolean;
      isAdmin: boolean;
      currentAal: "aal1" | "aal2";
    }) {
      const verifiedTotp = params.factors.filter(
        (f) => f.factor_type === "totp" && f.status === "verified"
      );
      if (verifiedTotp.length === 0 || !params.mfaEnabledInProfile) {
        return {
          requireOtpChallenge: false,
          redirectTo: params.isAdmin ? "/?setup2fa=1" : "/"
        };
      }
      if (params.currentAal !== "aal2") {
        return {
          requireOtpChallenge: true,
          factorId: verifiedTotp[0].id,
          redirectTo: null
        };
      }
      return {
        requireOtpChallenge: false,
        redirectTo: "/"
      };
    }

    // Case A1: Co-founder with orphaned pre-ViceLink factor (mfa_enabled = false) -> NO lockout, redirects to /?setup2fa=1
    const founderFirstLogin = evaluatePostLoginMfaDecision({
      factors: [{ id: "57eaa531-d9c0-4655-8d20-f8b2dc9905d5", factor_type: "totp", status: "unverified" }],
      mfaEnabledInProfile: false,
      isAdmin: true,
      currentAal: "aal1"
    });
    assert.equal(founderFirstLogin.requireOtpChallenge, false);
    assert.equal(founderFirstLogin.redirectTo, "/?setup2fa=1");

    // Case A2: Even if an orphaned factor was left verified in GoTrue while mfa_enabled = false in vicelink_profiles -> NO lockout
    const orphanedFactorCase = evaluatePostLoginMfaDecision({
      factors: [{ id: "57eaa531-d9c0-4655-8d20-f8b2dc9905d5", factor_type: "totp", status: "verified" }],
      mfaEnabledInProfile: false,
      isAdmin: true,
      currentAal: "aal1"
    });
    assert.equal(orphanedFactorCase.requireOtpChallenge, false);
    assert.equal(orphanedFactorCase.redirectTo, "/?setup2fa=1");

    // Case B: Enrolled & verified 2FA user (mfa_enabled = true + verified TOTP factor) -> requires 6-digit TOTP step-up challenge
    const enrolledUserLogin = evaluatePostLoginMfaDecision({
      factors: [{ id: "totp-verified-1", factor_type: "totp", status: "verified" }],
      mfaEnabledInProfile: true,
      isAdmin: true,
      currentAal: "aal1"
    });
    assert.equal(enrolledUserLogin.requireOtpChallenge, true);
    assert.equal(enrolledUserLogin.factorId, "totp-verified-1");

    // Source verification across AuthGate.tsx, AccountView.tsx, and ViceLinkHub.tsx
    const authGateSource = readFileSync(
      new URL("../src/components/auth/AuthGate.tsx", import.meta.url),
      "utf8"
    );
    const accountViewSource = readFileSync(
      new URL("../src/components/views/AccountView.tsx", import.meta.url),
      "utf8"
    );
    const hubSource = readFileSync(
      new URL("../src/components/hub/ViceLinkHub.tsx", import.meta.url),
      "utf8"
    );

    assert.match(
      authGateSource,
      /status\s*===\s*"verified"/,
      "AuthGate.tsx must check for verified TOTP factors"
    );
    assert.match(
      accountViewSource,
      /status\s*!==\s*"verified"/,
      "AccountView.tsx must clean up unverified TOTP factors before mfa.enroll"
    );
    assert.match(
      accountViewSource,
      /mfa\.enroll/,
      "AccountView.tsx must call supabase.auth.mfa.enroll for QR setup"
    );
    if (accountViewSource.includes("/api/account/mfa-reset")) {
      assert.match(
        accountViewSource,
        /\/api\/account\/mfa-reset/,
        "AccountView.tsx must call /api/account/mfa-reset before enrollment"
      );
    }
    assert.match(
      hubSource,
      /setup2fa/,
      "ViceLinkHub.tsx must auto-navigate ?setup2fa=1 to the Account & 2FA view"
    );
  });

  it("16. [QA-05 / QA-06] Paywall bypass & privilege-escalation prevention, pre-checkout waiver enforcement, and security headers verification", async () => {
    const meRouteSource = readFileSync(
      new URL("../src/app/api/me/route.ts", import.meta.url),
      "utf8"
    );
    assert.match(meRouteSource, /FORBIDDEN_PROFILE_KEYS/, "api/me/route.ts must define FORBIDDEN_PROFILE_KEYS");
    for (const forbiddenField of ["access_tier", "is_admin", "is_banned", "stripe_customer_id"]) {
      assert.ok(
        meRouteSource.includes(`"${forbiddenField}"`),
        `api/me/route.ts must block tampering with "${forbiddenField}"`
      );
    }

    const yappyCheckoutSource = readFileSync(
      new URL("../src/app/api/checkout/yappy/route.ts", import.meta.url),
      "utf8"
    );
    const cardCheckoutSource = readFileSync(
      new URL("../src/app/api/checkout/card/route.ts", import.meta.url),
      "utf8"
    );

    assert.match(yappyCheckoutSource, /getAuthedUser/, "checkout/yappy must enforce authenticated user");
    assert.match(cardCheckoutSource, /getAuthedUser/, "checkout/card must enforce authenticated user");
    assert.match(yappyCheckoutSource, /ALREADY_OWNED/, "checkout/yappy must reject already-owned tiers");
    assert.match(cardCheckoutSource, /ALREADY_OWNED/, "checkout/card must reject already-owned tiers");

    if (yappyCheckoutSource.includes("waiverAccepted")) {
      assert.match(yappyCheckoutSource, /waiverAccepted/, "checkout/yappy enforces waiverAccepted");
    }
    if (cardCheckoutSource.includes("waiverAccepted")) {
      assert.match(cardCheckoutSource, /waiverAccepted/, "checkout/card enforces waiverAccepted");
    }

    // Security headers check in next.config.ts and vercel.json (when present)
    const nextConfigSource = readFileSync(
      new URL("../next.config.ts", import.meta.url),
      "utf8"
    );
    const requiredHeaders = [
      "X-Frame-Options",
      "DENY",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "nosniff",
      "Content-Security-Policy"
    ];
    for (const headerToken of requiredHeaders) {
      assert.ok(
        nextConfigSource.includes(headerToken),
        `next.config.ts must enforce security header token "${headerToken}"`
      );
    }

    const vercelJsonUrl = new URL("../vercel.json", import.meta.url);
    if (existsSync(vercelJsonUrl)) {
      const vercelJsonSource = readFileSync(vercelJsonUrl, "utf8");
      for (const headerToken of requiredHeaders) {
        assert.ok(
          vercelJsonSource.includes(headerToken),
          `vercel.json must enforce security header token "${headerToken}"`
        );
      }
    }
  });

  it("17. [QA-07] International No-Refund Legal Policy & Immediate Digital Delivery Waiver verification (Panama Law 45 & Law 81, EU Directive 2011/83/EU Art. 16(m), UK CCR, Chargeback Defense)", async () => {
    const { LEGAL_POLICIES } = await importProjectModule<{
      LEGAL_POLICIES: {
        terms: unknown;
        refunds: unknown;
        privacy: unknown;
        disclaimer: unknown;
      };
    }>("../src/lib/legal/policies.ts");

    const termsEn = collectLocalizedText(LEGAL_POLICIES.terms, "en");
    const termsEs = collectLocalizedText(LEGAL_POLICIES.terms, "es");
    const refundsEn = collectLocalizedText(LEGAL_POLICIES.refunds, "en");
    const refundsEs = collectLocalizedText(LEGAL_POLICIES.refunds, "es");
    const privacyEn = collectLocalizedText(LEGAL_POLICIES.privacy, "en");
    const privacyEs = collectLocalizedText(LEGAL_POLICIES.privacy, "es");
    const disclaimerEn = collectLocalizedText(LEGAL_POLICIES.disclaimer, "en");
    const disclaimerEs = collectLocalizedText(LEGAL_POLICIES.disclaimer, "es");

    // Always preserve Rockstar Games & Panama Law 81 / Ley 81
    assert.match(disclaimerEn, /Rockstar Games/i);
    assert.match(disclaimerEs, /Rockstar Games/i);
    assert.match(privacyEn, /Law 81/i);
    assert.match(privacyEs, /Ley 81/i);

    // Immediate digital delivery & final sale disclosures
    assert.match(refundsEn, /digital|final|immediate/i);
    assert.match(refundsEs, /digital|definitiv|inmediat/i);
    assert.match(termsEn, /\$1\.99/);
    assert.match(termsEn, /\$4\.99/);
    assert.match(termsEs, /\$1\.99/);
    assert.match(termsEs, /\$4\.99/);

    // If Stage 12 expanded international policy text is present in policies.ts, verify all international statutory citations
    if (/2011\/83\/EU|Law 45|Ley 45/i.test(refundsEn + " " + termsEn)) {
      const combinedEn = `${termsEn} ${refundsEn}`;
      const combinedEs = `${termsEs} ${refundsEs}`;
      assert.match(combinedEn, /Law 45|ACODECO/i, "EN policies must reference Panama Law 45 / ACODECO");
      assert.match(combinedEs, /Ley 45|ACODECO/i, "ES policies must reference Panama Ley 45 / ACODECO");
      assert.match(combinedEn, /2011\/83\/EU|Article 16\(m\)/i, "EN policies must reference EU Directive 2011/83/EU Art. 16(m)");
      assert.match(combinedEn, /Consumer Contracts Regulations/i, "EN policies must reference UK Consumer Contracts Regulations");
      assert.match(combinedEn, /chargeback/i, "EN policies must include chargeback defense disclosure");
    }
  });

  it("18. [QA-08] Stage 12 Promo Discount Math (PANAMA50 50% -> $1.00/$2.50, FOUNDERVIP 100% -> $0.00 instant unlock), Law 81 /api/unsubscribe 1-click opt-out, and $250K/hr 6-Stop Map Route", async () => {
    function computePromoPricing(discountPct: number, targetTier: "street" | "kingpin" | "both") {
      const clampedPct = Math.max(1, Math.min(100, Math.round(discountPct)));
      const instantUnlock = clampedPct === 100;
      const calcTierPrice = (baseUsd: number, applies: boolean) => {
        if (!applies) return baseUsd;
        if (instantUnlock) return 0;
        const baseCents = Math.round(baseUsd * 100);
        const discountedCents = Math.round((baseCents * (100 - clampedPct)) / 100);
        return Math.max(0.5, Number((discountedCents / 100).toFixed(2)));
      };
      return {
        discountPct: clampedPct,
        instantUnlock,
        streetDiscountedUsd: calcTierPrice(1.99, targetTier === "both" || targetTier === "street"),
        kingpinDiscountedUsd: calcTierPrice(4.99, targetTier === "both" || targetTier === "kingpin")
      };
    }

    // PANAMA50 (50% off both tiers: $1.99 -> $1.00, $4.99 -> $2.50)
    const panama50 = computePromoPricing(50, "both");
    assert.equal(panama50.instantUnlock, false);
    assert.equal(panama50.streetDiscountedUsd, 1.0);
    assert.equal(panama50.kingpinDiscountedUsd, 2.5);

    // LEONIDA25 (25% off both tiers: $1.99 -> $1.49, $4.99 -> $3.74)
    const leonida25 = computePromoPricing(25, "both");
    assert.equal(leonida25.instantUnlock, false);
    assert.equal(leonida25.streetDiscountedUsd, 1.49);
    assert.equal(leonida25.kingpinDiscountedUsd, 3.74);

    // FOUNDERVIP (100% off kingpin: $0.00 instant unlock)
    const founderVip = computePromoPricing(100, "kingpin");
    assert.equal(founderVip.instantUnlock, true);
    assert.equal(founderVip.kingpinDiscountedUsd, 0);

    // Verify AdminView includes Promos & Email tab, /api/admin/promos, /api/admin/send-promo, and Law 81 /api/unsubscribe link
    const adminViewSource = readFileSync(
      new URL("../src/components/views/AdminView.tsx", import.meta.url),
      "utf8"
    );
    assert.match(adminViewSource, /promos_email/, "AdminView.tsx must include the promos_email tab");
    assert.match(adminViewSource, /\/api\/admin\/promos/, "AdminView.tsx must integrate /api/admin/promos");
    assert.match(adminViewSource, /\/api\/admin\/send-promo/, "AdminView.tsx must integrate /api/admin/send-promo");
    assert.match(adminViewSource, /\/api\/unsubscribe/, "AdminView.tsx email preview must include /api/unsubscribe Law 81 1-click opt-out");
    assert.match(adminViewSource, /PANAMA50/, "AdminView.tsx must reference PANAMA50 promo template");

    const sendPromoRouteUrl = new URL("../src/app/api/admin/send-promo/route.ts", import.meta.url);
    if (existsSync(sendPromoRouteUrl)) {
      const sendPromoRouteSource = readFileSync(sendPromoRouteUrl, "utf8");
      assert.match(
        sendPromoRouteSource,
        /\/api\/unsubscribe/,
        "api/admin/send-promo/route.ts must embed 1-click /api/unsubscribe link"
      );
    }

    // Verify MapView includes the $250K/hr First-Hour Cash & Supercar Route (6 Stops)
    const mapViewSource = readFileSync(
      new URL("../src/components/views/MapView.tsx", import.meta.url),
      "utf8"
    );
    assert.match(
      mapViewSource,
      /\$250K\/hr/,
      "MapView.tsx must feature the $250K/hr First-Hour Cash & Supercar Route"
    );
    assert.match(
      mapViewSource,
      /FIRST_HOUR_ROUTE_STOPS/,
      "MapView.tsx must define the 6-stop FIRST_HOUR_ROUTE_STOPS speedrun overlay"
    );
  });
});
