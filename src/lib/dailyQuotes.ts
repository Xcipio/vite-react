import { supabase } from "./supabase";
import type { DailyQuote } from "../types/dailyQuote";

const DAILY_QUOTE_TIMEZONE = "Asia/Shanghai";

function getDailySeedKey(timeZone = DAILY_QUOTE_TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export async function fetchPublishedDailyQuotes() {
  return supabase
    .from("daily_quotes")
    .select("*")
    .eq("is_published", true)
    .order("id", { ascending: true })
    .returns<DailyQuote[]>();
}

export function pickDailyQuote(
  quotes: DailyQuote[],
  timeZone = DAILY_QUOTE_TIMEZONE,
) {
  if (quotes.length === 0) {
    return null;
  }

  const seedKey = getDailySeedKey(timeZone);
  const index = hashSeed(seedKey) % quotes.length;

  return quotes[index];
}
