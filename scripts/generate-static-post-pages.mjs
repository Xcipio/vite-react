import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const distRoot = path.join(projectRoot, "dist");
const envPath = path.join(projectRoot, ".env");
const templatePath = path.join(distRoot, "index.html");

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .reduce((acc, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPageTitle(post) {
  return `${post.title} | Playxeld`;
}

function buildDescription(post, fallbackDescription) {
  const source = (post.excerpt ?? "").trim() || fallbackDescription;
  return source.length > 180 ? `${source.slice(0, 177)}...` : source;
}

function buildPostUrl(post) {
  const encodedSlug = encodeURIComponent(post.slug);
  return post.language === "en"
    ? `https://playxeld.com/en/post/${encodedSlug}`
    : `https://playxeld.com/post/${encodedSlug}`;
}

function buildFriendArticleUrl(article) {
  return `https://playxeld.com/friends/${encodeURIComponent(article.slug)}`;
}

function injectMeta(html, entry, fallbackDescription, options = {}) {
  const {
    lang = "zh-CN",
    locale = "zh_CN",
    url = buildPostUrl(entry),
    image = "https://playxeld.com/site-icon.png?v=1",
  } = options;
  const title = escapeHtml(buildPageTitle(entry));
  const description = escapeHtml(buildDescription(entry, fallbackDescription));
  const canonicalUrl = escapeHtml(url);
  const ogImage = image;
  const siteName = "Playxeld";

  let nextHtml = html;

  nextHtml = nextHtml.replace(/<html lang="[^"]*">/, `<html lang="${lang}">`);
  nextHtml = nextHtml.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  nextHtml = nextHtml.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${description}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:type"\s+content="[\s\S]*?"\s*\/>/,
    '<meta property="og:type" content="article" />',
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:site_name"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:site_name" content="${siteName}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:title" content="${title}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:description" content="${description}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:image"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:image" content="${ogImage}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+name="twitter:card"\s+content="[\s\S]*?"\s*\/>/,
    '<meta name="twitter:card" content="summary_large_image" />',
  );
  nextHtml = nextHtml.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:title" content="${title}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:description" content="${description}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+name="twitter:image"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="twitter:image" content="${ogImage}" />`,
  );

  if (!nextHtml.includes('property="og:locale"')) {
    nextHtml = nextHtml.replace(
      "</head>",
      `    <meta property="og:locale" content="${locale}" />\n    <link rel="canonical" href="${canonicalUrl}" />\n  </head>`,
    );
  }

  return nextHtml;
}

async function fetchPublishedPosts({ supabaseUrl, supabaseAnonKey }) {
  const query = new URLSearchParams({
    select: "slug,title,excerpt,language,is_published",
    is_published: "eq.true",
    order: "published_at.desc",
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/posts?${query.toString()}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts for static meta generation: ${response.status}`);
  }

  return response.json();
}

async function fetchPublishedFriendArticles({ supabaseUrl, supabaseAnonKey }) {
  const query = new URLSearchParams({
    select: "slug,title,excerpt,author_name,author_avatar_url,is_published",
    is_published: "eq.true",
    order: "published_at.desc",
  });

  const response = await fetch(
    `${supabaseUrl}/rest/v1/friend_articles?${query.toString()}`,
    {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch friend articles for static meta generation: ${response.status}`,
    );
  }

  return response.json();
}

async function writePostPage(templateHtml, post, fallbackDescription) {
  const targetDir =
    post.language === "en"
      ? path.join(distRoot, "en", "post", post.slug)
      : path.join(distRoot, "post", post.slug);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(
    path.join(targetDir, "index.html"),
    injectMeta(templateHtml, post, fallbackDescription, {
      lang: post.language === "en" ? "en" : "zh-CN",
      locale: post.language === "en" ? "en_US" : "zh_CN",
      url: buildPostUrl(post),
    }),
    "utf8",
  );
}

async function writeFriendArticlePage(templateHtml, article, fallbackDescription) {
  const targetDir = path.join(distRoot, "friends", article.slug);
  const fallbackImage = article.author_avatar_url || "https://playxeld.com/site-icon.png?v=1";

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(
    path.join(targetDir, "index.html"),
    injectMeta(templateHtml, article, fallbackDescription, {
      lang: "zh-CN",
      locale: "zh_CN",
      url: buildFriendArticleUrl(article),
      image: fallbackImage,
    }),
    "utf8",
  );
}

async function main() {
  let fileEnv = {};

  try {
    const envContent = await fs.readFile(envPath, "utf8");
    fileEnv = parseEnvFile(envContent);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code !== "ENOENT") {
      throw error;
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL ?? fileEnv.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ?? fileEnv.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment or .env",
    );
  }

  const [templateHtml, posts, friendArticles] = await Promise.all([
    fs.readFile(templatePath, "utf8"),
    fetchPublishedPosts({ supabaseUrl, supabaseAnonKey }),
    fetchPublishedFriendArticles({ supabaseUrl, supabaseAnonKey }),
  ]);

  const defaultDescription =
    "Playxeld 的个人博客，记录关于游戏、故事、语言与创作系统的思考。";
  const friendArticlesDescription =
    "Playxeld 的朋友投稿栏目，收录客座作者的文章与创作。";

  await Promise.all(
    posts.map((post) => writePostPage(templateHtml, post, defaultDescription)),
  );

  await Promise.all(
    friendArticles.map((article) =>
      writeFriendArticlePage(templateHtml, article, friendArticlesDescription),
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
