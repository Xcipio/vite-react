import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFICATION_TO_EMAIL = Deno.env.get("NOTIFICATION_TO_EMAIL") ?? "playxeld@gmail.com";
const ALLOWED_ORIGINS = new Set([
  "https://playxeld.com",
  "https://www.playxeld.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

type BasePayload = {
  to?: string;
  type?: "reply" | "like" | "comment";
};

type ReplyPayload = BasePayload & {
  type?: "reply";
  postTitle: string;
  postSlug: string;
  replyAuthorName: string;
  replyContent: string;
  postUrl?: string;
};

type LikePayload = BasePayload & {
  type: "like";
  postTitle: string;
  postSlug: string;
  postUrl: string;
  language?: "zh" | "en";
};

type CommentPayload = BasePayload & {
  type: "comment";
  postTitle: string;
  postSlug: string;
  commentAuthorName: string;
  commentContent: string;
  postUrl: string;
  language?: "zh" | "en";
};

function getCorsHeaders(origin?: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://playxeld.com";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function isAllowedOrigin(origin?: string | null) {
  return Boolean(origin && ALLOWED_ORIGINS.has(origin));
}

function jsonResponse(body: unknown, status = 200, origin?: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin),
    },
  });
}

function isSafeText(value: string, maxLength: number) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength;
}

function isSafePostUrl(postUrl: string) {
  try {
    const url = new URL(postUrl);
    return (
      (url.origin === "https://playxeld.com" || url.origin === "http://localhost:5173") &&
      (url.pathname.startsWith("/post/") || url.pathname.startsWith("/en/post/"))
    );
  } catch {
    return false;
  }
}

function buildReplyText(payload: ReplyPayload, postUrl: string) {
  return [
    `文章：${payload.postTitle}`,
    `作者：${payload.replyAuthorName}`,
    "",
    "回复内容：",
    payload.replyContent,
    "",
    "查看页面：",
    postUrl,
  ].join("\n");
}

function buildCommentText(payload: CommentPayload) {
  return [
    `文章：${payload.postTitle}`,
    `作者：${payload.commentAuthorName}`,
    "",
    "评论内容：",
    payload.commentContent,
    "",
    "查看页面：",
    payload.postUrl,
  ].join("\n");
}

function buildLikeText(payload: LikePayload) {
  return [
    `文章：${payload.postTitle}`,
    "",
    "有人点击了喜欢。",
    "",
    "查看页面：",
    payload.postUrl,
  ].join("\n");
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(origin) });
  }

  if (!isAllowedOrigin(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, origin);
  }

  try {
    if (!RESEND_API_KEY) {
      return jsonResponse({ error: "Missing RESEND_API_KEY" }, 500, origin);
    }

    const payload = (await req.json()) as ReplyPayload | LikePayload | CommentPayload;

    if (!payload?.postTitle || !payload?.postSlug) {
      return jsonResponse({ error: "Missing required fields" }, 400, origin);
    }

    if (!isSafeText(payload.postTitle, 180) || !isSafeText(payload.postSlug, 180)) {
      return jsonResponse({ error: "Invalid post fields" }, 400, origin);
    }

    let subject = "";
    let text = "";

    if (payload.type === "like") {
      if (!payload.postUrl || !isSafePostUrl(payload.postUrl)) {
        return jsonResponse({ error: "Missing or invalid postUrl for like notification" }, 400, origin);
      }

      subject = payload.language === "en"
        ? "[Playxeld] Someone liked your article"
        : "[Playxeld] 有人喜欢了你的文章";

      text = buildLikeText(payload);
    } else if (payload.type === "comment") {
      if (
        !payload.postUrl ||
        !isSafePostUrl(payload.postUrl) ||
        !isSafeText(payload.commentAuthorName, 60) ||
        !isSafeText(payload.commentContent, 1200)
      ) {
        return jsonResponse({ error: "Missing or invalid comment notification fields" }, 400, origin);
      }

      subject = payload.language === "en"
        ? "[Playxeld] Someone commented on your article"
        : "[Playxeld] 有人评论了你的文章";

      text = buildCommentText(payload);
    } else {
      const postUrl = payload.postUrl ?? `https://playxeld.com/post/${payload.postSlug}`;

      if (
        !isSafePostUrl(postUrl) ||
        !isSafeText(payload.replyAuthorName, 60) ||
        !isSafeText(payload.replyContent, 1200)
      ) {
        return jsonResponse({ error: "Missing or invalid reply notification fields" }, 400, origin);
      }

      subject = "[Playxeld] 有人回复了你的评论";
      text = buildReplyText(payload, postUrl);
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Playxeld <noreply@playxeld.com>",
        to: [NOTIFICATION_TO_EMAIL],
        subject,
        text,
      }),
    });

    const resendData = await resendResponse.json().catch(() => null);

    if (!resendResponse.ok) {
      return jsonResponse(
        {
          error: "Failed to send email",
          details: resendData,
        },
        500,
        origin,
      );
    }

    return jsonResponse(
      {
        success: true,
        resend: resendData,
      },
      200,
      origin,
    );
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
      origin,
    );
  }
});
