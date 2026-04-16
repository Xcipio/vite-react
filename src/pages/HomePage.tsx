import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedArtworks } from "../lib/artworks";
import { fetchPublishedPosts } from "../lib/posts";
import { getPostTags, getTagStyle, sortTags } from "../lib/tags";
import { Artwork } from "../types/artwork";
import { Post } from "../types/post";

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const postsPerPage = 6;
  const heroLeadText = "All we need is";

  useEffect(() => {
    const loadHomeData = async () => {
      const [{ data: postData, error: postError }, { data: artworkData, error: artworkError }] =
        await Promise.all([fetchPublishedPosts(), fetchPublishedArtworks()]);

      if (postError) {
        console.error(postError);
      } else {
        setPosts(postData ?? []);
      }

      if (artworkError) {
        console.error(artworkError);
      } else {
        setArtworks(artworkData ?? []);
      }

      setLoading(false);
    };

    loadHomeData();
  }, []);

  const latestPost = posts[0] ?? null;
  const pinnedArtworks = artworks.slice(0, 3);
  const remainingPosts = latestPost ? posts.slice(1) : posts;
  const filteredPosts = selectedTag
    ? remainingPosts.filter((post) => getPostTags(post).includes(selectedTag))
    : remainingPosts;
  const availableTags = sortTags([
    ...new Set(posts.flatMap((post) => getPostTags(post))),
  ]);
  const portalTags = [...new Set([...availableTags, "涂鸦"])];

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + postsPerPage,
  );

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div className="hero-brand" aria-label="Playxeld">
            {"PLAYXELD".split("").map((letter, index) => (
              <span key={`${letter}-${index}`} className="hero-brand-letter">
                {letter}
              </span>
            ))}
          </div>

          <nav className="hero-nav">
            <a href="#posts">Posts</a>
            <Link to="/art">Arts</Link>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </nav>
        </div>

        <div className="hero-grid">
          <div className="hero-main">
            <p className="hero-kicker">WRITER / GAME CREATOR / PLAYER</p>

            <h1 className="hero-title">
              <span className="hero-title-wave" aria-label={heroLeadText}>
                {heroLeadText.split("").map((character, index) => (
                  <span
                    key={`${character}-${index}`}
                    className={
                      character === " "
                        ? "hero-title-wave-space"
                        : "hero-title-wave-letter"
                    }
                    aria-hidden="true"
                  >
                    {character === " " ? "\u00A0" : character}
                  </span>
                ))}
              </span>
              <span className="hero-play-group" aria-label="PLAY !">
                <span className="hero-play-gap" aria-hidden="true">
                  {" "}
                </span>
                <span className="play-word" aria-label="PLAY">
                  <span className="p play-letter">P</span>
                  <span className="l play-letter">L</span>
                  <span className="a play-letter">A</span>
                  <span className="y play-letter">Y</span>
                </span>{" "}
                <span className="hero-exclamation play-letter play-letter-exclamation">!</span>
              </span>
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
            <h2 className="hero-side-title">
              <span className="hero-title-gradient">文学迷城</span>
              <span className="hero-title-rest"> 系列更新中 </span>
              <span className="hero-title-dots" aria-hidden="true">
                <span className="hero-title-dot hero-title-dot-one">.</span>
                <span className="hero-title-dot hero-title-dot-two">.</span>
                <span className="hero-title-dot hero-title-dot-three">.</span>
              </span>
            </h2>
            <p className="hero-side-text">📚 🎬 🎷 🎴 🏙️ 💡 → 🤹 🎮</p>
            <p className="hero-side-text">
              我正在尝试把深度随笔、实验笔记与“可游玩”的思维模型结合
            </p>
            <p className="hero-side-text">
              让思考不再只是静态的阅读，而是变成像玩游戏一样可以交互的思维练习
            </p>

            <div className="hero-side-card">
              <p className="hero-side-card-label hero-side-card-title">任意门</p>
              <p className="hero-side-card-text">
                点击标签，查看该专题所有文章👇
              </p>
              <div className="hero-tag-grid">
                {portalTags.map((tag) => (
                  <button
                    key={tag}
                    className={`hero-tag-button ${
                      selectedTag === tag ? "active" : ""
                    }`}
                    style={getTagStyle(tag, theme)}
                    onClick={() => {
                      navigate(
                        tag === "涂鸦"
                          ? `/art/tag/${encodeURIComponent(tag)}`
                          : `/tag/${encodeURIComponent(tag)}`,
                      );
                    }}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}

                {selectedTag && (
                  <button
                    className="hero-tag-button hero-tag-button-clear"
                    onClick={() => {
                      setSelectedTag(null);
                      setCurrentPage(1);
                      window.location.hash = "posts";
                    }}
                    type="button"
                  >
                    查看全部
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </header>

      <section className="section latest-release-section">
        <div className="section-header">
          <div className="latest-release-heading">
            <h2 className="section-title latest-release-section-title">最新文章</h2>
            {latestPost && (
              <div className="section-meta latest-release-date-badge">
                {new Date(latestPost.published_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : latestPost ? (
          <article className="latest-release-card">
            <div className="latest-release-copy">
              <p className="latest-release-label">Editor’s Pick</p>
              <h3 className="latest-release-title">
                <Link to={`/post/${latestPost.slug}`}>{latestPost.title}</Link>
              </h3>
              <p className="latest-release-excerpt">{latestPost.excerpt}</p>

              <div className="latest-release-actions">
                <Link
                  to={`/post/${latestPost.slug}`}
                  className="post-link latest-release-link"
                >
                  阅读全文 →
                </Link>
              </div>
            </div>

            {getPostTags(latestPost).length > 0 && (
              <div className="latest-release-tags">
                {getPostTags(latestPost).map((tag) => (
                  <button
                    key={`latest-${latestPost.id}-${tag}`}
                    className={`hero-tag-button ${
                      selectedTag === tag ? "active" : ""
                    }`}
                    style={getTagStyle(tag, theme)}
                    onClick={() => {
                      setSelectedTag(tag);
                      setCurrentPage(1);
                      window.location.hash = "posts";
                    }}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </article>
        ) : (
          <p>还没有已发布文章。</p>
        )}
      </section>

      {pinnedArtworks.length > 0 && (
        <section className="section home-art-section">
          <div className="section-header">
            <h2 className="section-title home-art-section-title">画廊</h2>
            <div className="section-meta">
              <Link to="/art">进入 Arts →</Link>
            </div>
          </div>

          <div className="art-grid">
            {pinnedArtworks.map((artwork) => (
              <article key={artwork.id} className="art-card">
                <Link to={`/art/${artwork.slug}`} className="art-card-image-link">
                  <img
                    className="art-card-image"
                    src={artwork.cover_image_url}
                    alt={artwork.title}
                    loading="lazy"
                  />
                </Link>

                <div className="art-card-body">
                  <div className="art-card-meta">
                    {artwork.year && <span>{artwork.year}</span>}
                    {artwork.medium && <span>{artwork.medium}</span>}
                    {artwork.series && <span>{artwork.series}</span>}
                  </div>

                  <h2 className="art-card-title">
                    <Link to={`/art/${artwork.slug}`}>{artwork.title}</Link>
                  </h2>

                  {artwork.subtitle && (
                    <p className="art-card-subtitle">{artwork.subtitle}</p>
                  )}

                  <Link to={`/art/${artwork.slug}`} className="post-link art-card-link">
                    查看作品 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="posts" className="section posts-section">
        <div className="section-header">
          <h2 className="section-title posts-section-title">Recent writing</h2>
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
              {currentPosts.map((post) => (
                <article
                  key={post.id}
                  className="post-card"
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

                  {getPostTags(post).length > 0 && (
                    <div className="post-tag-list">
                      {getPostTags(post).map((tag) => (
                        <span
                          key={`${post.id}-${tag}`}
                          className={`post-tag-badge ${
                            selectedTag === tag ? "active" : ""
                          }`}
                          style={getTagStyle(tag, theme)}
                          onClick={(event) => {
                            event.stopPropagation();
                            const nextTag = selectedTag === tag ? null : tag;
                            setSelectedTag(nextTag);
                            setCurrentPage(1);
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    className={`pagination-button ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section id="about" className="section">
        <p className="section-label">ABOUT</p>
        <h2 className="section-title about-section-title">初衷</h2>
        <p className="section-text">
          我在这里记录随笔、笔记与思想碎片。从设计的逻辑到博弈的本质，从光影的隐喻到城市的肌理——凡是能启发思考、磨练感知的事物，皆是我的坐标
        </p>

        <p className="section-text">
          建立这个站点的目的并非为了单纯的存档。对我而言，写作是一场公开测试，去校验那些尚不成熟的直觉；并尝试将零散的思考锻造成系统的表达，最终构建起一套完整的创作谱系
        </p>
      </section>

      <section id="contact" className="section contact-section">
        <div className="contact-panel">
          <div className="contact-copy">
            <p className="section-label">CONTACT</p>
            <h2 className="section-title contact-title contact-section-title">欢迎来信</h2>
            <p className="section-text contact-text">
              如果你想交流游戏、写作、创作故事，或者只是想分享一个有趣的想法，都欢迎通过评论或者邮件来进行交流
            </p>
          </div>

          <div className="contact-card">
            <p className="contact-card-label">Email</p>
            <a
              className="contact-email"
              href="mailto:playxeld@gmail.com"
              aria-label="Send email to playxeld@gmail.com"
            >
              playxeld@gmail.com
            </a>
            <p className="contact-card-text">All we need is PLAY</p>
            <a
              className="contact-action"
              href="mailto:playxeld@gmail.com"
              aria-label="Write an email to playxeld@gmail.com"
            >
              ✏️ Write to me
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
