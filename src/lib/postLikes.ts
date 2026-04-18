import { PostLike } from "../types/post-like";
import { getClientDeviceId } from "./clientIdentity";
import { supabase } from "./supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function invokePostLikeAction(
  action: "state" | "activate" | "deactivate",
  postSlug: string,
) {
  if (!supabaseUrl || !anonKey) {
    return {
      data: null,
      error: new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"),
    };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/post-like-actions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        postSlug,
        deviceId: getClientDeviceId(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: new Error(`post-like-actions returned ${response.status}`),
      };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown post like action error"),
    };
  }
}

export async function fetchPostLikeState(postSlug: string) {
  const result = await invokePostLikeAction("state", postSlug);

  return {
    data: result.data as PostLike | null,
    error: result.error,
  };
}

export async function fetchPostLikeCount(postSlug: string) {
  return supabase
    .from("post_likes")
    .select("id", { count: "exact", head: true })
    .eq("post_slug", postSlug)
    .eq("is_active", true);
}

export async function activatePostLike(postSlug: string) {
  const result = await invokePostLikeAction("activate", postSlug);

  return {
    data: result.data as PostLike | null,
    error: result.error,
  };
}

export async function deactivatePostLike(postSlug: string) {
  const result = await invokePostLikeAction("deactivate", postSlug);

  return {
    data: result.data,
    error: result.error,
  };
}
