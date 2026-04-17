import { supabase } from "./supabase";
import { Post } from "../types/post";

export async function fetchPublishedPosts(language = "zh") {
  return supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .eq("language", language)
    .order("published_at", { ascending: false })
    .returns<Post[]>();
}

export async function fetchPublishedPostBySlug(slug: string, language = "zh") {
  return supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("language", language)
    .eq("is_published", true)
    .single<Post>();
}

export async function fetchPublishedPostTranslation(
  translationGroup: string,
  language: "zh" | "en",
) {
  return supabase
    .from("posts")
    .select("*")
    .eq("translation_group", translationGroup)
    .eq("language", language)
    .eq("is_published", true)
    .maybeSingle<Post>();
}
