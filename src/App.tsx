import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import "./App.css";
import { supabase } from "./lib/supabase";
import PostPage from "./PostPage";

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  published_at: string;
  is_published: boolean;
  tag: string | null;
};

/* =========================
   TAG 颜色系统
========================= */

const tagColorMap: Record<
  string,
  {
    background: string;
    border: string;
    color: string;
    lightBackground: string;
    lightBorder: string;
    lightColor: string;
  }
> = {
  随笔: {
    background: "rgba(255, 140, 66, 0.14)",
    border: "rgba(255, 140, 66, 0.34)",
    color: "#ff8c42",
    lightBackground: "rgba(255, 140, 66, 0.1)",
    lightBorder: "rgba(255, 140, 66, 0.28)",
    lightColor: "#d96a20",
  },
  思维模型: {
    background: "rgba(78, 168, 255, 0.14)",
    border: "rgba(78, 168, 255, 0.34)",
    color: "#4ea8ff",
    lightBackground: "rgba(78, 168, 255, 0.1)",
    lightBorder: "rgba(78, 168, 255, 0.28)",
    lightColor: "#1f7fe0",
  },
  文心雕侬: {
    background: "rgba(255, 77, 79, 0.14)",
    border: "rgba(255, 77, 79, 0.34)",
    color: "#ff4d4f",
    lightBackground: "rgba(255, 77, 79, 0.1)",
    lightBorder: "rgba(255, 77, 79, 0.28)",
    lightColor: "#d9363e",
  },
  卡片: {
    background: "rgba(46, 204, 113, 0.14)",
    border: "rgba(46, 204, 113, 0.34)",
    color: "#2ecc71",
    lightBackground: "rgba(46, 204, 113, 0.1)",
    lightBorder: "rgba(46, 204, 113, 0.28)",
    lightColor: "#209a53",
  },
};

function getTagStyle(tag: string, theme: "dark" | "light") {
  const preset = tagColorMap[tag];

  if (!preset) {
    return theme === "light"
      ? {
          background: "rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.1)",
          color: "rgba(5,7,13,0.7)",
        }
      : {
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "rgba(245,247,251,0.85)",
        };
  }

  return theme === "light"
    ? {
        background: preset.lightBackground,
        border: `1px solid ${preset.lightBorder}`,
        color: preset.lightColor,
      }
    : {
        background: preset.background,
        border: `1px solid ${preset.border}`,
        color: preset.color,
      };
}

/* =========================
   HomePage
========================= */

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const postsPerPage = 6;

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.body.setAttribute("data-theme", saved);
    setTheme(saved as "dark" | "light");
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setPosts(data || []);
      }

      setLoading(false);
    };

    fetchPosts();
  }, []);

  /* =========================
     筛选 + 分页
  ========================= */

  const filteredPosts = selectedTag
    ? posts.filter((p) => p.tag === selectedTag)
    : posts;

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

  const startIndex = (currentPage - 1) * postsPerPage;

  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + postsPerPage,
  );

  return (
    <div className="page">
      {/* HERO */}
      <header className="hero">
        <div className="hero-top">
          <div className="hero-brand">Playxeld</div>

          <nav className="hero-nav">
            <a href="#posts">Posts</a>
            <a href="#about">About</a>

            <button
              className="theme-toggle"
              onClick={() => {
                const next = theme === "light" ? "dark" : "light";
                document.body.setAttribute("data-theme", next);
                localStorage.setItem("theme", next);
                setTheme(next);
              }}
            >
              {theme === "light" ? "深色" : "浅色"}
            </button>
          </nav>
        </div>

        <div className="hero-grid">
          <div className="hero-main">
            <p className="hero-kicker">WRITER / GAME CREATOR / PLAYER</p>

            <h1 className="hero-title">
              All we need is{" "}
              <span className="play-word">
                <span className="p">P</span>
                <span className="l">L</span>
                <span className="a">A</span>
                <span className="y">Y</span>
              </span>{" "}
              !
            </h1>

            <p className="hero-subtitle">
              这里是一个关于游戏、故事与语言的思考空间
            </p>

            <p className="hero-subtitle">
              相比将生活视作一场不得不忍受的消亡，我更愿意将其视为一种充满奇特愉悦的无尽探索
            </p>
          </div>

          <aside className="hero-side">
            <p className="hero-side-label">Now</p>
            <h2 className="hero-side-title">个人博客 👉 微型发布系统</h2>
            <p className="hero-side-text">
              📚 🎬 🎷 🎴 🏙️ 💡 → 🤹 🎮
            </p>
            <p className="hero-side-text">
              让思考不再只是静态的阅读，而是变成像玩游戏一样可以交互的思维练习
            </p>
          </aside>
        </div>
      </header>

      {/* POSTS */}
      <section id="posts" className="section">
        <div className="section-header">
          <h2 className="section-title">Recent writing</h2>
          <div className="section-meta">{filteredPosts.length} posts</div>
        </div>

        {selectedTag && (
          <p className="tag-filter-indicator">当前筛选：{selectedTag}</p>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="posts-grid">
              {currentPosts.map((post, index) => (
                <article
                  key={post.id}
                  className={
                    currentPage === 1 && index === 0
                      ? "post-card post-card-featured"
                      : "post-card"
                  }
                >
                  <div className="post-meta">
                    {new Date(post.published_at).toLocaleDateString()}
                  </div>

                  <h3 className="post-title">
                    <Link to={`/post/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <p className="post-excerpt">{post.excerpt}</p>

                  <Link to={`/post/${post.slug}`} className="post-link">
                    阅读全文 →
                  </Link>

                  {post.tag && (
                    <span
                      className="post-tag-badge"
                      style={getTagStyle(post.tag, theme)}
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = selectedTag === post.tag ? null : post.tag;
                        setSelectedTag(next);
                        setCurrentPage(1);
                      }}
                    >
                      {post.tag}
                    </span>
                  )}
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      className={`pagination-button ${
                        currentPage === p ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <p className="section-label">ABOUT</p>
        <h2 className="section-title">初衷</h2>
        <p className="section-text">
          我在这里记录随笔、笔记与思想碎片。从设计的逻辑到博弈的本质，从光影的隐喻到城市的肌理——凡是能启发思考、磨练感知的事物，皆是我的坐标
        </p>

        <p className="section-text">
          建立这个站点的目的并非为了单纯的存档。对我而言，写作是一场公开测试，去校验那些尚不成熟的直觉；并尝试将零散的思考锻造成系统的表达，最终构建起一套完整的创作谱系
        </p>
      </section>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/post/:slug" element={<PostPage />} />
    </Routes>
  );
}

export default App;
