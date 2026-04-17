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

function injectMeta(html, post, fallbackDescription) {
  const title = escapeHtml(buildPageTitle(post));
  const description = escapeHtml(buildDescription(post, fallbackDescription));
  const url = escapeHtml(buildPostUrl(post));
  const image = "https://playxeld.com/site-icon.png?v=1";
  const locale = post.language === "en" ? "en_US" : "zh_CN";
  const siteName = "Playxeld";

  let nextHtml = html;

  nextHtml = nextHtml.replace(/<html lang="[^"]*">/, `<html lang="${post.language === "en" ? "en" : "zh-CN"}">`);
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
    `<meta property="og:image" content="${image}" />`,
  );
  nextHtml = nextHtml.replace(
    /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/>/,
    `<meta property="og:url" content="${url}" />`,
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
    `<meta name="twitter:image" content="${image}" />`,
  );

  if (!nextHtml.includes('property="og:locale"')) {
    nextHtml = nextHtml.replace(
      "</head>",
      `    <meta property="og:locale" content="${locale}" />\n    <link rel="canonical" href="${url}" />\n  </head>`,
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

async function writePostPage(templateHtml, post, fallbackDescription) {
  const targetDir =
    post.language === "en"
      ? path.join(distRoot, "en", "post", post.slug)
      : path.join(distRoot, "post", post.slug);

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(
    path.join(targetDir, "index.html"),
    injectMeta(templateHtml, post, fallbackDescription),
    "utf8",
  );
}

async function main() {
  const envContent = await fs.readFile(envPath, "utf8");
  const env = parseEnvFile(envContent);
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  }

  const [templateHtml, posts] = await Promise.all([
    fs.readFile(templatePath, "utf8"),
    fetchPublishedPosts({ supabaseUrl, supabaseAnonKey }),
  ]);

  const defaultDescription =
    "Playxeld 的个人博客，记录关于游戏、故事、语言与创作系统的思考。";

  await Promise.all(
    posts.map((post) => writePostPage(templateHtml, post, defaultDescription)),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
