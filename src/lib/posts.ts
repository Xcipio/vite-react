import { supabase } from "./supabase";
import { Post } from "../types/post";

export async function fetchPublishedPosts() {
  return supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .returns<Post[]>();
}

export async function fetchPublishedPostBySlug(slug: string) {
  return supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single<Post>();
}
