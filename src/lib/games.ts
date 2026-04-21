import { supabase } from "./supabase";
import { Game } from "../types/game";

export async function fetchPublishedGames(language: "zh" | "en" = "zh") {
  return supabase
    .from("games")
    .select("*")
    .eq("is_published", true)
    .eq("language", language)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Game[]>();
}

export function pickWeightedRandomGame(
  games: Game[],
  excludedGameId?: number,
) {
  const availableGames = games.filter((game) => game.id !== excludedGameId);

  if (availableGames.length === 0) {
    return null;
  }

  const totalWeight = availableGames.reduce(
    (sum, game) => sum + Math.max(game.random_weight, 1),
    0,
  );

  let cursor = Math.random() * totalWeight;

  for (const game of availableGames) {
    cursor -= Math.max(game.random_weight, 1);

    if (cursor <= 0) {
      return game;
    }
  }

  return availableGames[availableGames.length - 1];
}

export function extractPostSlugFromPlayUrl(playUrl: string | null) {
  if (!playUrl) {
    return null;
  }

  const match = playUrl.match(/^\/(?:en\/)?post\/([^#/?]+)/);

  return match?.[1] ?? null;
}

export function isGamePlayable(game: Game, publishedPostSlugs: Set<string>) {
  if (!game.play_url) {
    return false;
  }

  const referencedPostSlug = extractPostSlugFromPlayUrl(game.play_url);

  if (!referencedPostSlug) {
    return true;
  }

  return publishedPostSlugs.has(referencedPostSlug);
}
