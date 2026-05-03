import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import WeatherBadge from "../components/WeatherBadge";
import useContactBubbles from "../features/home/useContactBubbles";
import useHomeData from "../features/home/useHomeData";
import { useTheme } from "../hooks/useTheme";
import { pickDailyArtworks } from "../lib/dailyArtworkSelection";
import { isGamePlayable } from "../lib/games";
import { getPostTags, getTagStyle, sortTags } from "../lib/tags";

function HomePage() {
  const {
    artworks,
    featuredGame,
    friendArticles,
    games,
    loading,
    posts,
    refreshFeaturedGame,
  } = useHomeData();
  const [showGamePopout, setShowGamePopout] = useState(false);
  const {
    burstBubble,
    bursting: contactBubbleBursting,
    burstVersions: contactBubbleBurstVersions,
    contactCardRef,
    motionEnabled: contactBubbleMotionEnabled,
    positions: contactBubblePositions,
  } = useContactBubbles();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const postsPerPage = 6;
  const heroLeadText = "All we need is";
  const paginationCopy = {
    first: "首页",
    previous: "上一页",
    next: "下一页",
    last: "末页",
  };

  const latestPost = posts[0] ?? null;
  const latestFriendArticle = friendArticles[0] ?? null;
  const pinnedArtworks = pickDailyArtworks(artworks, 3);
  const remainingPosts = latestPost ? posts.slice(1) : posts;
  const filteredPosts = selectedTag
    ? remainingPosts.filter((post) => getPostTags(post).includes(selectedTag))
    : remainingPosts;
  const availableTags = sortTags([
    ...new Set(posts.flatMap((post) => getPostTags(post))),
  ]);
  const portalTags = [...new Set([...availableTags, "涂鸦", "投稿"])];
  const publishedPostSlugs = useMemo(
    () => new Set(posts.map((post) => post.slug)),
    [posts],
  );

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const currentPosts = filteredPosts.slice(
    startIndex,
    startIndex + postsPerPage,
  );
  const paginationItems = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  );

  useEffect(() => {
    if (!showGamePopout) {
      return;
    }

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = overflow;
    };
  }, [showGamePopout]);

  return (
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div className="hero-brand-group">
            <div className="hero-brand" aria-label="Playxeld">
              {"PLAYXELD".split("").map((letter, index) => (
                <span key={`${letter}-${index}`} className="hero-brand-letter">
                  {letter}
                </span>
              ))}
            </div>
            <WeatherBadge locale="zh" />
          </div>

          <nav className="hero-nav">
            <a href="#posts">Posts</a>
            <Link to="/games">Games</Link>
            <Link to="/art">Arts</Link>
            <Link to="/friends">Friends</Link>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <Link to="/en">EN</Link>
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
                <span className="hero-exclamation play-letter play-letter-exclamation">
                  !
                </span>
              </span>
            </h1>

            <p className="hero-subtitle">
              这里是一个关于游戏、故事与语言的思考 & 游玩空间
            </p>

            <p className="hero-subtitle">
              相比将生活视作一场不得不忍受的消亡，我更愿意将其视为一种充满奇特愉悦的无尽探索，用玩家的心态去发掘其间蕴藏的乐趣
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
            <p className="hero-side-text">用「玩」的视角解构万物</p>
            <p className="hero-side-text">把📚 🎬 🎷 🎴 🏙️ 💡 与日常变成一个个游戏</p>
            <p className="hero-side-text">
              ——这里的每篇
              <span className="play-word hero-side-inline-play" aria-label="play">
                <span className="p play-letter">p</span>
                <span className="l play-letter">l</span>
                <span className="a play-letter">a</span>
                <span className="y play-letter">y</span>
              </span>
              笔记，都附带有几个迷你的游戏指南🎮🤹
            </p>
            <p className="hero-side-text">
              让思考不再只是静态的阅读，而是变成像玩游戏一样可以交互的练习
            </p>

            <div className="hero-side-card">
              <div className="hero-side-card-tooltip">
                <p className="hero-side-card-label hero-side-card-title">
                  どこでもドア
                </p>
                <span className="hero-side-card-tooltip-bubble">任意门</span>
              </div>
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
                          : tag === "投稿"
                            ? "/friends"
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

              <div className="hero-lucky-module">
                <div className="hero-lucky-module-heading-group">
                  <p className="hero-side-label hero-lucky-module-kicker">
                    PLAY!
                  </p>
                  <button
                    className="hero-lucky-module-trigger hero-lucky-module-heading"
                    onClick={() => setShowGamePopout(true)}
                    type="button"
                    disabled={loading || !featuredGame}
                  >
                    手气不错
                  </button>
                </div>
                <div className="hero-lucky-module-copy">
                  <p className="hero-lucky-module-text">
                    随机抽一个游戏，来玩一下吧！
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <section className="section latest-release-section">
        <div className="section-header">
          <div className="latest-release-heading">
            <h2 className="section-title latest-release-section-title">
              最新文章
            </h2>
            {latestPost && (
              <div className="section-meta latest-release-date-badge">
                {new Date(latestPost.published_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="page-loading-placeholder" aria-hidden="true">
            <span />
          </div>
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

      {latestFriendArticle && (
        <section className="section friends-home-section">
          <div className="section-header">
            <div>
              <h2 className="section-title latest-release-section-title">
                投稿
              </h2>
            </div>
            <div className="section-meta">
              <Link to="/friends">进入 Friends →</Link>
            </div>
          </div>

          <article className="latest-release-card friends-home-card">
            <div className="latest-release-copy">
              <p className="latest-release-label">SHARE YOUR STORY</p>
              <h3 className="latest-release-title friends-home-title">
                <Link to={`/friends/${latestFriendArticle.slug}`}>
                  {latestFriendArticle.title}
                </Link>
              </h3>
              {latestFriendArticle.excerpt && (
                <p className="latest-release-excerpt">
                  {latestFriendArticle.excerpt}
                </p>
              )}

              <div className="latest-release-actions">
                <Link
                  to={`/friends/${latestFriendArticle.slug}`}
                  className="post-link latest-release-link"
                >
                  阅读全文 →
                </Link>
              </div>
            </div>

            <div className="friends-home-meta">
              <div className="section-meta latest-release-date-badge">
                {new Date(latestFriendArticle.published_at).toLocaleDateString()}
              </div>
              <div className="friends-author-summary">
                {latestFriendArticle.author_avatar_url ? (
                  <img
                    className="friends-author-avatar"
                    src={latestFriendArticle.author_avatar_url}
                    alt={latestFriendArticle.author_name}
                    loading="lazy"
                  />
                ) : (
                  <span className="friends-author-avatar friends-author-avatar-fallback">
                    友
                  </span>
                )}
                <span className="friends-author-chip">
                  作者：{latestFriendArticle.author_name}
                </span>
              </div>
              {latestFriendArticle.tags.length > 0 && (
                <div className="friends-tag-row">
                  {sortTags(latestFriendArticle.tags).map((tag) => (
                    <span
                      key={`friend-home-${latestFriendArticle.id}-${tag}`}
                      className="hero-tag-button friends-tag-chip"
                      style={getTagStyle(tag, theme)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        </section>
      )}

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
                <Link
                  to={`/art/${artwork.slug}`}
                  className="art-card-image-link"
                >
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

                  <Link
                    to={`/art/${artwork.slug}`}
                    className="post-link art-card-link"
                  >
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
          <h2 className="section-title posts-section-title">近期发布</h2>
          <div className="section-meta">{filteredPosts.length} posts</div>
        </div>

        {selectedTag && (
          <p className="tag-filter-indicator">当前筛选：{selectedTag}</p>
        )}

        {loading ? (
          <div className="page-loading-placeholder" aria-hidden="true">
            <span />
          </div>
        ) : (
          <>
            <div className="posts-grid home-posts-grid">
              {currentPosts.map((post) => (
                <article key={post.id} className="post-card">
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
                <button
                  className="pagination-button pagination-button-nav"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  {paginationCopy.first}
                </button>
                <button
                  className="pagination-button pagination-button-nav"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                >
                  {paginationCopy.previous}
                </button>
                {paginationItems.map((item) => (
                  <button
                    key={item}
                    className={`pagination-button ${
                      currentPage === item ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(item)}
                  >
                    {item}
                  </button>
                ))}
                <button
                  className="pagination-button pagination-button-nav"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  {paginationCopy.next}
                </button>
                <button
                  className="pagination-button pagination-button-nav"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  {paginationCopy.last}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section id="about" className="section">
        <p className="section-label">ABOUT</p>
        <h2 className="section-title about-section-title">初衷</h2>
        <p className="section-text">
          我在这里记录随笔、笔记，涂鸦与思想碎片。从设计的逻辑到博弈的本质，从光影的隐喻到城市的肌理——凡是能启发思考、磨练感知的事物，都是我游戏的操场
        </p>

        <p className="section-text">
          建立这个站点的目的并非为了单纯的存档。对我而言，写作是一场公开测试，去校验那些尚不成熟的直觉；并尝试将零散的思考锻造成系统的表达，最终构建起一套完整的创作谱系
        </p>
      </section>

      <section id="contact" className="section contact-section">
        <div className="contact-panel">
          <div className="contact-copy">
            <p className="section-label">CONTACT</p>
            <h2 className="section-title contact-title contact-section-title">
              欢迎来信
            </h2>
            <p className="section-text contact-text">
              如果你想交流游戏、写作、创作故事，或者只是想分享一个有趣的想法，都欢迎通过评论或者邮件来进行交流！
            </p>
          </div>

          <div className="contact-card" ref={contactCardRef}>
            <p className="contact-card-label">Email</p>
            <a
              className="contact-email"
              href="mailto:playxeld@gmail.com"
              aria-label="Send email to playxeld@gmail.com"
            >
              playxeld@gmail.com
            </a>
            <p className="contact-card-text">All we need is PLAY</p>
            <div
              className="contact-bubble-module"
              style={
                contactBubbleMotionEnabled
                  ? {
                      transform: `translate3d(${contactBubblePositions.small.x}px, ${contactBubblePositions.small.y}px, 0)`,
                    }
                  : undefined
              }
            >
              <button
                className={`contact-bubble-button ${
                  contactBubbleBursting.small ? "is-bursting" : ""
                }`}
                onClick={() => {
                  burstBubble("small");
                }}
                type="button"
                aria-label="捏一下泡泡"
              >
                <span className="contact-bubble-orb" aria-hidden="true">
                  <span className="contact-bubble-highlight" />
                </span>
                {contactBubbleBurstVersions.small > 0 && (
                  <span
                    key={contactBubbleBurstVersions.small}
                    className="contact-bubble-burst"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 8 }).map((_, index) => (
                      <span
                        key={index}
                        className={`contact-bubble-particle contact-bubble-particle-${index + 1}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            </div>
            <div
              className="contact-bubble-module contact-bubble-module-medium"
              style={
                contactBubbleMotionEnabled
                  ? {
                      transform: `translate3d(${contactBubblePositions.medium.x}px, ${contactBubblePositions.medium.y}px, 0)`,
                    }
                  : undefined
              }
            >
              <button
                className={`contact-bubble-button contact-bubble-button-medium ${
                  contactBubbleBursting.medium ? "is-bursting" : ""
                }`}
                onClick={() => {
                  burstBubble("medium");
                }}
                type="button"
                aria-label="捏一下中泡泡"
              >
                <span
                  className="contact-bubble-orb contact-bubble-orb-medium"
                  aria-hidden="true"
                >
                  <span className="contact-bubble-highlight contact-bubble-highlight-medium" />
                </span>
                {contactBubbleBurstVersions.medium > 0 && (
                  <span
                    key={contactBubbleBurstVersions.medium}
                    className="contact-bubble-burst contact-bubble-burst-medium"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 8 }).map((_, index) => (
                      <span
                        key={index}
                        className={`contact-bubble-particle contact-bubble-particle-${index + 1}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            </div>
            <div
              className="contact-bubble-module contact-bubble-module-large"
              style={
                contactBubbleMotionEnabled
                  ? {
                      transform: `translate3d(${contactBubblePositions.large.x}px, ${contactBubblePositions.large.y}px, 0)`,
                    }
                  : undefined
              }
            >
              <button
                className={`contact-bubble-button contact-bubble-button-large ${
                  contactBubbleBursting.large ? "is-bursting" : ""
                }`}
                onClick={() => {
                  burstBubble("large");
                }}
                type="button"
                aria-label="捏一下大泡泡"
              >
                <span
                  className="contact-bubble-orb contact-bubble-orb-large"
                  aria-hidden="true"
                >
                  <span className="contact-bubble-highlight contact-bubble-highlight-large" />
                </span>
                {contactBubbleBurstVersions.large > 0 && (
                  <span
                    key={contactBubbleBurstVersions.large}
                    className="contact-bubble-burst contact-bubble-burst-large"
                    aria-hidden="true"
                  >
                    {Array.from({ length: 8 }).map((_, index) => (
                      <span
                        key={index}
                        className={`contact-bubble-particle contact-bubble-particle-${index + 1}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            </div>
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

      {showGamePopout && (
        <div
          className="hero-lucky-popout-backdrop"
          onClick={() => setShowGamePopout(false)}
          role="presentation"
        >
          <div
            className="hero-lucky-popout"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hero-lucky-popout-title"
          >
            <button
              className="hero-lucky-popout-close"
              onClick={() => setShowGamePopout(false)}
              type="button"
              aria-label="关闭随机游戏弹窗"
            >
              ×
            </button>

            {featuredGame ? (
              <>
                <p className="hero-lucky-popout-kicker">
                  {featuredGame.cover_emoji
                    ? `${featuredGame.cover_emoji} `
                    : ""}
                  I'M FEELING LUCKY
                </p>
                <h2
                  id="hero-lucky-popout-title"
                  className="hero-lucky-popout-title"
                >
                  {featuredGame.title}
                </h2>
                <p className="hero-lucky-popout-hook">
                  {featuredGame.hook ??
                    featuredGame.cover_text ??
                    featuredGame.summary}
                </p>
                {featuredGame.summary && (
                  <div className="hero-lucky-popout-summary-card">
                    <p className="hero-lucky-popout-summary-label">简介</p>
                    <p className="hero-lucky-popout-summary">
                      {featuredGame.summary}
                    </p>
                  </div>
                )}
                {featuredGame.rules && (
                  <div className="hero-lucky-popout-rules">
                    <p className="hero-lucky-popout-rules-label">玩法</p>
                    <p className="hero-lucky-popout-rules-text">
                      {featuredGame.rules}
                    </p>
                  </div>
                )}

                <dl className="hero-lucky-popout-facts">
                  <div>
                    <dt>难度</dt>
                    <dd>{featuredGame.difficulty ?? "unknown"}</dd>
                  </div>
                  <div>
                    <dt>时长</dt>
                    <dd>
                      {featuredGame.estimated_minutes
                        ? `${featuredGame.estimated_minutes} 分钟`
                        : "灵活"}
                    </dd>
                  </div>
                  <div>
                    <dt>来源</dt>
                    <dd>
                      {featuredGame.post_title ??
                        featuredGame.post_slug ??
                        "standalone"}
                    </dd>
                  </div>
                </dl>

                {featuredGame.tags.length > 0 && (
                  <div className="hero-lucky-popout-tags">
                    {featuredGame.tags.map((tag) => (
                      <span
                        key={`${featuredGame.id}-${tag}`}
                        className="hero-lucky-popout-tag"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="hero-lucky-popout-actions">
                  {isGamePlayable(featuredGame, publishedPostSlugs) ? (
                    <Link
                      to={featuredGame.play_url!}
                      className="hero-lucky-popout-link"
                      onClick={() => setShowGamePopout(false)}
                    >
                      游戏背景 →
                    </Link>
                  ) : (
                    <span className="random-game-unavailable">内容待补全</span>
                  )}
                  {games.length > 1 && (
                    <button
                      className="hero-lucky-popout-refresh"
                      onClick={refreshFeaturedGame}
                      type="button"
                    >
                      换一个
                    </button>
                  )}
                  <Link
                    to="/games"
                    className="hero-lucky-popout-library"
                    onClick={() => setShowGamePopout(false)}
                  >
                    游戏库
                  </Link>
                </div>
              </>
            ) : (
              <p className="state-text">游戏库还没有已发布内容。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
