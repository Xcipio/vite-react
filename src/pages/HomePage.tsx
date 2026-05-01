import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import WeatherBadge from "../components/WeatherBadge";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedArtworks } from "../lib/artworks";
import { pickDailyArtworks } from "../lib/dailyArtworkSelection";
import {
  fetchPublishedGames,
  isGamePlayable,
  pickWeightedRandomGame,
} from "../lib/games";
import { fetchPublishedFriendArticles } from "../lib/friendArticles";
import { fetchPublishedPosts } from "../lib/posts";
import { getPostTags, getTagStyle, sortTags } from "../lib/tags";
import { Artwork } from "../types/artwork";
import { FriendArticle } from "../types/friendArticle";
import { Game } from "../types/game";
import { Post } from "../types/post";

type ContactBubbleKey = "small" | "medium" | "large";

type ContactBubblePosition = {
  x: number;
  y: number;
};

type RuntimeBubble = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  radius: number;
  speed: number;
};

type ContactBubbleLayout = {
  size: number;
  radius: number;
  speed: number;
  startRight: number;
  startBottom: number;
};

const CONTACT_BUBBLE_LAYOUTS: Record<ContactBubbleKey, ContactBubbleLayout> = {
  small: {
    size: 34,
    radius: 12,
    speed: 0.84,
    startRight: 22,
    startBottom: 18,
  },
  medium: {
    size: 44,
    radius: 17,
    speed: 0.64,
    startRight: 118,
    startBottom: 28,
  },
  large: {
    size: 56,
    radius: 21,
    speed: 0.46,
    startRight: 72,
    startBottom: 68,
  },
};

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendArticles, setFriendArticles] = useState<FriendArticle[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [featuredGame, setFeaturedGame] = useState<Game | null>(null);
  const [showGamePopout, setShowGamePopout] = useState(false);
  const [contactBubbleBurstVersion, setContactBubbleBurstVersion] = useState(0);
  const [contactBubbleBursting, setContactBubbleBursting] = useState(false);
  const [contactBubbleLargeBurstVersion, setContactBubbleLargeBurstVersion] =
    useState(0);
  const [contactBubbleLargeBursting, setContactBubbleLargeBursting] =
    useState(false);
  const [contactBubbleMediumBurstVersion, setContactBubbleMediumBurstVersion] =
    useState(0);
  const [contactBubbleMediumBursting, setContactBubbleMediumBursting] =
    useState(false);
  const [contactBubbleMotionEnabled, setContactBubbleMotionEnabled] =
    useState(false);
  const [contactBubblePositions, setContactBubblePositions] = useState<
    Record<ContactBubbleKey, ContactBubblePosition>
  >({
    small: { x: 0, y: 0 },
    medium: { x: 0, y: 0 },
    large: { x: 0, y: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const contactCardRef = useRef<HTMLDivElement | null>(null);
  const contactBubbleRuntimeRef = useRef<Record<ContactBubbleKey, RuntimeBubble> | null>(null);

  const postsPerPage = 6;
  const heroLeadText = "All we need is";
  const paginationCopy = {
    first: "首页",
    previous: "上一页",
    next: "下一页",
    last: "末页",
  };

  const respawnContactBubble = (key: ContactBubbleKey) => {
    const runtime = contactBubbleRuntimeRef.current;
    const card = contactCardRef.current;
    if (!runtime || !card) {
      return;
    }

    const bubble = runtime[key];
    const width = card.clientWidth;
    const height = card.clientHeight;
    if (!width || !height) {
      return;
    }

    const maxX = Math.max(0, width - bubble.size);
    const maxY = Math.max(0, height - bubble.size);
    const otherKeys = (Object.keys(runtime) as ContactBubbleKey[]).filter(
      (candidate) => candidate !== key,
    );

    let nextX = bubble.x;
    let nextY = bubble.y;

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const candidateX = Math.random() * maxX;
      const candidateY = Math.random() * maxY;
      const isOverlapping = otherKeys.some((otherKey) => {
        const otherBubble = runtime[otherKey];
        const dx =
          otherBubble.x + otherBubble.size / 2 - (candidateX + bubble.size / 2);
        const dy =
          otherBubble.y + otherBubble.size / 2 - (candidateY + bubble.size / 2);
        const minimumDistance = otherBubble.radius + bubble.radius + 4;
        return Math.hypot(dx, dy) < minimumDistance;
      });

      if (!isOverlapping) {
        nextX = candidateX;
        nextY = candidateY;
        break;
      }
    }

    bubble.x = nextX;
    bubble.y = nextY;

    const angle = Math.random() * Math.PI * 2;
    bubble.vx = Math.cos(angle) * bubble.speed;
    bubble.vy = Math.sin(angle) * bubble.speed;

    setContactBubblePositions({
      small: { x: runtime.small.x, y: runtime.small.y },
      medium: { x: runtime.medium.x, y: runtime.medium.y },
      large: { x: runtime.large.x, y: runtime.large.y },
    });
  };

  useEffect(() => {
    const loadHomeData = async () => {
      const [
        { data: postData, error: postError },
        friendArticleData,
        { data: artworkData, error: artworkError },
        { data: gameData, error: gameError },
      ] = await Promise.all([
        fetchPublishedPosts(),
        fetchPublishedFriendArticles(),
        fetchPublishedArtworks(),
        fetchPublishedGames(),
      ]);

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

      setFriendArticles(friendArticleData.data ?? []);

      if (friendArticleData.error) {
        console.error(friendArticleData.error);
      }

      if (gameError) {
        console.error(gameError);
      } else {
        const publishedGames = gameData ?? [];
        setGames(publishedGames);
        setFeaturedGame(pickWeightedRandomGame(publishedGames));
      }

      setLoading(false);
    };

    loadHomeData();
  }, []);

  const refreshFeaturedGame = () => {
    setFeaturedGame((currentGame) =>
      pickWeightedRandomGame(games, currentGame?.id),
    );
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

  useEffect(() => {
    if (!contactBubbleBursting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setContactBubbleBursting(false);
      respawnContactBubble("small");
    }, 720);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [contactBubbleBursting]);

  useEffect(() => {
    if (!contactBubbleLargeBursting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setContactBubbleLargeBursting(false);
      respawnContactBubble("large");
    }, 720);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [contactBubbleLargeBursting]);

  useEffect(() => {
    if (!contactBubbleMediumBursting) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setContactBubbleMediumBursting(false);
      respawnContactBubble("medium");
    }, 720);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [contactBubbleMediumBursting]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(
      "(max-width: 1100px), (prefers-reduced-motion: reduce)",
    );

    let frameId = 0;
    let lastTime = 0;

    const randomVelocity = (speed: number) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    };

    const setVelocityDirection = (
      bubble: RuntimeBubble,
      angle: number,
      speed = bubble.speed,
    ) => {
      bubble.vx = Math.cos(angle) * speed;
      bubble.vy = Math.sin(angle) * speed;
    };

    const jitterVelocity = (bubble: RuntimeBubble) => {
      const angle = Math.atan2(bubble.vy, bubble.vx) + (Math.random() - 0.5) * 0.36;
      setVelocityDirection(bubble, angle);
    };

    const updateState = (bubbles: Record<ContactBubbleKey, RuntimeBubble>) => {
      setContactBubblePositions({
        small: { x: bubbles.small.x, y: bubbles.small.y },
        medium: { x: bubbles.medium.x, y: bubbles.medium.y },
        large: { x: bubbles.large.x, y: bubbles.large.y },
      });
    };

    const initializeRuntime = () => {
      const card = contactCardRef.current;
      if (!card || mediaQuery.matches) {
        contactBubbleRuntimeRef.current = null;
        setContactBubbleMotionEnabled(false);
        return false;
      }

      const width = card.clientWidth;
      const height = card.clientHeight;
      if (!width || !height) {
        return false;
      }

      const smallLayout = CONTACT_BUBBLE_LAYOUTS.small;
      const mediumLayout = CONTACT_BUBBLE_LAYOUTS.medium;
      const largeLayout = CONTACT_BUBBLE_LAYOUTS.large;
      const smallVelocity = randomVelocity(smallLayout.speed);
      const mediumVelocity = randomVelocity(mediumLayout.speed);
      const largeVelocity = randomVelocity(largeLayout.speed);

      const runtime: Record<ContactBubbleKey, RuntimeBubble> = {
        small: {
          x: width - smallLayout.startRight - smallLayout.size,
          y: height - smallLayout.startBottom - smallLayout.size,
          size: smallLayout.size,
          radius: smallLayout.radius,
          speed: smallLayout.speed,
          ...smallVelocity,
        },
        medium: {
          x: width - mediumLayout.startRight - mediumLayout.size,
          y: height - mediumLayout.startBottom - mediumLayout.size,
          size: mediumLayout.size,
          radius: mediumLayout.radius,
          speed: mediumLayout.speed,
          ...mediumVelocity,
        },
        large: {
          x: width - largeLayout.startRight - largeLayout.size,
          y: height - largeLayout.startBottom - largeLayout.size,
          size: largeLayout.size,
          radius: largeLayout.radius,
          speed: largeLayout.speed,
          ...largeVelocity,
        },
      };

      const keys = Object.keys(runtime) as ContactBubbleKey[];
      for (let i = 0; i < keys.length; i += 1) {
        for (let j = i + 1; j < keys.length; j += 1) {
          const bubbleA = runtime[keys[i]];
          const bubbleB = runtime[keys[j]];
          const dx = bubbleB.x + bubbleB.size / 2 - (bubbleA.x + bubbleA.size / 2);
          const dy = bubbleB.y + bubbleB.size / 2 - (bubbleA.y + bubbleA.size / 2);
          const distance = Math.hypot(dx, dy);
          const minimumDistance = bubbleA.radius + bubbleB.radius + 8;

          if (distance < minimumDistance) {
            bubbleB.x = Math.max(0, bubbleB.x + (minimumDistance - distance));
          }
        }
      }

      contactBubbleRuntimeRef.current = runtime;
      setContactBubbleMotionEnabled(true);
      updateState(runtime);
      return true;
    };

    const step = (timestamp: number) => {
      const runtime = contactBubbleRuntimeRef.current;
      if (!runtime) {
        frameId = window.requestAnimationFrame(step);
        return;
      }

      const card = contactCardRef.current;
      if (!card) {
        frameId = window.requestAnimationFrame(step);
        return;
      }

      const width = card.clientWidth;
      const height = card.clientHeight;
      const delta = lastTime ? Math.min((timestamp - lastTime) / 16.6667, 2.2) : 1;
      lastTime = timestamp;

      (Object.keys(runtime) as ContactBubbleKey[]).forEach((key) => {
        const bubble = runtime[key];
        bubble.x += bubble.vx * delta;
        bubble.y += bubble.vy * delta;

        const maxX = Math.max(0, width - bubble.size);
        const maxY = Math.max(0, height - bubble.size);

        if (bubble.x <= 0) {
          bubble.x = 0;
          bubble.vx = Math.abs(bubble.vx);
          jitterVelocity(bubble);
        } else if (bubble.x >= maxX) {
          bubble.x = maxX;
          bubble.vx = -Math.abs(bubble.vx);
          jitterVelocity(bubble);
        }

        if (bubble.y <= 0) {
          bubble.y = 0;
          bubble.vy = Math.abs(bubble.vy);
          jitterVelocity(bubble);
        } else if (bubble.y >= maxY) {
          bubble.y = maxY;
          bubble.vy = -Math.abs(bubble.vy);
          jitterVelocity(bubble);
        }
      });

      const keys = Object.keys(runtime) as ContactBubbleKey[];
      for (let i = 0; i < keys.length; i += 1) {
        for (let j = i + 1; j < keys.length; j += 1) {
          const bubbleA = runtime[keys[i]];
          const bubbleB = runtime[keys[j]];
          const centerDx =
            bubbleB.x + bubbleB.size / 2 - (bubbleA.x + bubbleA.size / 2);
          const centerDy =
            bubbleB.y + bubbleB.size / 2 - (bubbleA.y + bubbleA.size / 2);
          const distance = Math.hypot(centerDx, centerDy);
          const minimumDistance = bubbleA.radius + bubbleB.radius + 2;

          if (distance < minimumDistance) {
            const normalX = distance > 0 ? centerDx / distance : 1;
            const normalY = distance > 0 ? centerDy / distance : 0;
            const overlap = minimumDistance - distance;

            bubbleA.x -= normalX * (overlap / 2);
            bubbleA.y -= normalY * (overlap / 2);
            bubbleB.x += normalX * (overlap / 2);
            bubbleB.y += normalY * (overlap / 2);

            const relativeVelocityX = bubbleB.vx - bubbleA.vx;
            const relativeVelocityY = bubbleB.vy - bubbleA.vy;
            const separatingSpeed =
              relativeVelocityX * normalX + relativeVelocityY * normalY;

            if (separatingSpeed < 0) {
              const impulse = -separatingSpeed;
              bubbleA.vx -= impulse * normalX;
              bubbleA.vy -= impulse * normalY;
              bubbleB.vx += impulse * normalX;
              bubbleB.vy += impulse * normalY;
            }

            jitterVelocity(bubbleA);
            jitterVelocity(bubbleB);
          }
        }
      }

      updateState(runtime);
      frameId = window.requestAnimationFrame(step);
    };

    const handleViewportChange = () => {
      lastTime = 0;
      initializeRuntime();
    };

    handleViewportChange();
    frameId = window.requestAnimationFrame(step);
    mediaQuery.addEventListener("change", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      mediaQuery.removeEventListener("change", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

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
                  contactBubbleBursting ? "is-bursting" : ""
                }`}
                onClick={() => {
                  setContactBubbleBurstVersion((version) => version + 1);
                  setContactBubbleBursting(true);
                }}
                type="button"
                aria-label="捏一下泡泡"
              >
                <span className="contact-bubble-orb" aria-hidden="true">
                  <span className="contact-bubble-highlight" />
                </span>
                {contactBubbleBurstVersion > 0 && (
                  <span
                    key={contactBubbleBurstVersion}
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
                  contactBubbleMediumBursting ? "is-bursting" : ""
                }`}
                onClick={() => {
                  setContactBubbleMediumBurstVersion((version) => version + 1);
                  setContactBubbleMediumBursting(true);
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
                {contactBubbleMediumBurstVersion > 0 && (
                  <span
                    key={contactBubbleMediumBurstVersion}
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
                  contactBubbleLargeBursting ? "is-bursting" : ""
                }`}
                onClick={() => {
                  setContactBubbleLargeBurstVersion((version) => version + 1);
                  setContactBubbleLargeBursting(true);
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
                {contactBubbleLargeBurstVersion > 0 && (
                  <span
                    key={contactBubbleLargeBurstVersion}
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
