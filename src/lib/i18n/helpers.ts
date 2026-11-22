import type { Language, LocalizedText } from "@/types/vicelink";

/** Resolve a plain string or a bilingual {en, es} object into the active language. */
export function tField(
  val: string | LocalizedText | undefined | null,
  lang: Language,
): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  return val[lang] || val.en || "";
}

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 1.99 -> "$1.99", 2325000 -> "$2,325,000", 0 -> "$0". */
export function formatUsd(amount: number): string {
  if (!Number.isFinite(amount)) return "$0";
  return usdFormatter.format(amount);
}
