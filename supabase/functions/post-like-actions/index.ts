import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Missing Supabase server env" }, 500);
    }

    const { action, postSlug, deviceId } = await req.json();

    if (
      !action ||
      !["state", "activate", "deactivate"].includes(action) ||
      !postSlug ||
      !deviceId
    ) {
      return jsonResponse({ error: "Missing required fields" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (action === "state") {
      const { data, error } = await admin
        .from("post_likes")
        .select("id, post_slug, device_id, is_active, created_at, updated_at, first_liked_at, last_liked_at")
        .eq("post_slug", postSlug)
        .eq("device_id", deviceId)
        .maybeSingle();

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse(data ?? null);
    }

    if (action === "activate") {
      const timestamp = new Date().toISOString();

      const { data, error } = await admin
        .from("post_likes")
        .upsert(
          {
            post_slug: postSlug,
            device_id: deviceId,
            is_active: true,
            last_liked_at: timestamp,
            updated_at: timestamp,
          },
          {
            onConflict: "post_slug,device_id",
          },
        )
        .select("id, post_slug, device_id, is_active, created_at, updated_at, first_liked_at, last_liked_at")
        .single();

      if (error) {
        return jsonResponse({ error: error.message }, 500);
      }

      return jsonResponse(data);
    }

    const { data, error } = await admin
      .from("post_likes")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("post_slug", postSlug)
      .eq("device_id", deviceId)
      .select("id")
      .maybeSingle();

    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ success: true, data: data ?? null });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
