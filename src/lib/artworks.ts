import { supabase } from "./supabase";
import { Artwork } from "../types/artwork";

export async function fetchPublishedArtworks() {
  return supabase
    .from("artworks")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false })
    .returns<Artwork[]>();
}

export async function fetchPublishedArtworkBySlug(slug: string) {
  return supabase
    .from("artworks")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single<Artwork>();
}
