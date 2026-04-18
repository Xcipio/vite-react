import { Comment, CommentInsert } from "../types/comment";
import { getClientDeviceId } from "./clientIdentity";
import { supabase } from "./supabase";

export async function fetchApprovedComments(postSlug: string) {
  return supabase
    .from("comments")
    .select("id, post_slug, author_name, author_email, content, parent_id, is_approved, created_at")
    .eq("post_slug", postSlug)
    .order("created_at", { ascending: false })
    .returns<Comment[]>();
}

export async function createComment(comment: CommentInsert) {
  return supabase.from("comments").insert(comment).select("*").single<Comment>();
}

export async function deleteOwnComment(commentId: number) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      data: null,
      error: new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"),
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/comment-owner-actions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "delete",
        commentId,
        deviceId: getClientDeviceId(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`comment-owner-actions returned ${response.status}`),
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown delete error"),
    };
  }
}
