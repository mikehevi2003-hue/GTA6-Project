import type { NextRequest } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { containsDisallowedMarkup, sanitizePlainText } from "@/lib/security/sanitize";
import {
  apiError,
  apiJson,
  createClient,
  ensureProfileAndProgress,
  getAuthedUser
} from "@/lib/supabase/server";
import { getBuiltInLeonidaReply } from "@/server/data/leonida-brain";
import type { AiQuotaInfo, Language, SpoilerChapter } from "@/types/vicelink";

const askSchema = z.object({
  prompt: z.string().max(750),
  chapter: z.enum(["ch1", "ch2", "ch3", "endgame"]).default("ch1"),
  lang: z.enum(["en", "es"]).default("en")
});

type GeminiCandidate = {
  content?: { parts?: Array<{ text?: string }> };
};

async function askGemini(
  prompt: string,
  chapter: SpoilerChapter,
  lang: Language
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const languageLabel = lang === "es" ? "Spanish" : "English";
  const systemInstruction = [
    "You are ViceLink AI, a concise tactical companion for Grand Theft Auto VI (Leonida).",
    `Always respond in ${languageLabel}.`,
    `Strictly respect the user's Spoiler Shield chapter setting: ${chapter}. Do not reveal story spoilers past ${chapter}.`,
    "Give practical, verified gameplay info (ATMs, fences, vehicles, Easter eggs, mechanics) in plain text."
  ].join(" ");

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 450,
            temperature: 0.4
          }
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000)
      }
    );

    if (!res.ok) return null;
    const json = (await res.json()) as { candidates?: GeminiCandidate[] };
    const text = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return apiError("UNAUTHORIZED", 401);

    const rl = checkRateLimit(`ai:${user.id}`, 15, 60_000);
    if (!rl.allowed) {
      return apiError("RATE_LIMITED", 429, "Too many AI requests; please wait a moment.");
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return apiError("INVALID_JSON", 400, "Request body must be valid JSON.");
    }

    const parsed = askSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", 400, "Invalid AI request payload.");
    }

    if (containsDisallowedMarkup(parsed.data.prompt)) {
      return apiError("INVALID_INPUT", 400, "Prompt contains disallowed markup.");
    }

    const prompt = sanitizePlainText(parsed.data.prompt, 500);
    if (!prompt) {
      return apiError("INVALID_INPUT", 400, "Prompt must not be empty.");
    }

    // Ensure profile row exists so the quota RPC reads the authoritative tier.
    await ensureProfileAndProgress(supabase, user);

    const { data: quotaRows, error: quotaErr } = await supabase.rpc("vicelink_consume_ai_quota");
    if (quotaErr) throw quotaErr;

    const row = quotaRows?.[0];
    if (!row) {
      return apiError("QUOTA_CHECK_FAILED", 500, "Unable to evaluate AI quota.");
    }

    const aiQuota: AiQuotaInfo = {
      used: row.used,
      limit: row.quota_limit,
      unlimited: row.quota_limit === null
    };

    if (!row.allowed) {
      return apiError(
        "QUOTA_EXCEEDED",
        403,
        parsed.data.lang === "es"
          ? "Alcanzaste el límite diario de 3 consultas IA. Mejora a Kingpin VIP ($4.99) para acceso ilimitado."
          : "Daily limit of 3 AI lookups reached. Upgrade to Kingpin VIP ($4.99) for unlimited access.",
        { aiQuota }
      );
    }

    const liveReply = await askGemini(prompt, parsed.data.chapter, parsed.data.lang);
    const reply =
      liveReply ?? getBuiltInLeonidaReply(prompt, parsed.data.chapter, parsed.data.lang);

    return apiJson({
      reply,
      aiQuota,
      source: liveReply ? ("gemini" as const) : ("builtin" as const)
    });
  } catch (err) {
    return apiError(
      "AI_ASK_FAILED",
      500,
      err instanceof Error ? err.message : "Failed to process AI request"
    );
  }
}
