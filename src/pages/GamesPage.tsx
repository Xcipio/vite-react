import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import {
  fetchPublishedGames,
  isGamePlayable,
  pickWeightedRandomGame,
} from "../lib/games";
import { fetchPublishedPosts } from "../lib/posts";
import { Game } from "../types/game";
import { Post } from "../types/post";

type DifficultyFilter = "all" | "easy" | "medium" | "hard";

const difficultyLabels: Record<DifficultyFilter, string> = {
  all: "全部难度",
  easy: "轻量",
  medium: "适中",
  hard: "深入",
};

function GamesPage() {
  const { theme, toggleTheme } = useTheme();
  const [games, setGames] = useState<Game[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyFilter>("all");
  const [randomGame, setRandomGame] = useState<Game | null>(null);

  useEffect(() => {
    const loadGames = async () => {
      const [
        { data: gameData, error: gameError },
        { data: postData, error: postError },
      ] = await Promise.all([fetchPublishedGames(), fetchPublishedPosts()]);

      if (gameError) {
        console.error("Failed to fetch games:", gameError);
      } else {
        setGames(gameData ?? []);
      }

      if (postError) {
        console.error("Failed to fetch posts:", postError);
      } else {
        setPosts(postData ?? []);
      }

      setLoading(false);
    };

    loadGames();
  }, []);

  const availableTags = useMemo(
    () =>
      [...new Set(games.flatMap((game) => game.tags))].sort((left, right) =>
        left.localeCompare(right),
      ),
    [games],
  );

  const filteredGames = useMemo(
    () =>
      games.filter((game) => {
        const matchesTag = selectedTag ? game.tags.includes(selectedTag) : true;
        const matchesDifficulty =
          selectedDifficulty === "all" ? true : game.difficulty === selectedDifficulty;

        return matchesTag && matchesDifficulty;
      }),
    [games, selectedDifficulty, selectedTag],
  );
  const publishedPostSlugs = useMemo(
    () => new Set(posts.map((post) => post.slug)),
    [posts],
  );

  const featuredGame = useMemo(
    () => filteredGames.find((game) => game.is_featured) ?? filteredGames[0] ?? null,
    [filteredGames],
  );

  const remainingGames = useMemo(
    () =>
      featuredGame
        ? filteredGames.filter((game) => game.id !== featuredGame.id)
        : filteredGames,
    [featuredGame, filteredGames],
  );

  useEffect(() => {
    setRandomGame(pickWeightedRandomGame(filteredGames));
  }, [filteredGames]);

  const refreshRandomGame = () => {
    setRandomGame((currentGame) =>
      pickWeightedRandomGame(filteredGames, currentGame?.id),
    );
  };

  return (
    <div className="page games-page">
      <section className="section games-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/">← 返回主页</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className="games-page-hero">
          <div className="games-page-hero-copy">
            <p className="section-label">GAME LIBRARY</p>
            <h1 className="games-page-title">游戏库</h1>
            <p className="games-page-description">
              这里把散落在文章中的小游戏重新整理成一个可浏览、可随机、可反复回访的游戏索引。
            </p>
            <p className="games-page-subtitle">
              现在共收录 {games.length} 个已发布游戏。你可以按标签、难度筛选，也可以从首页直接随机抽一个开始。
            </p>
          </div>

          <div className="games-page-hero-side">
            <p className="games-page-hero-side-label">How To Use</p>
            <p className="games-page-hero-side-text">
              有的游戏适合 3 分钟热身，有的适合 10 分钟沉浸思考。最稳的方式不是一次玩很多，而是挑一个反复玩几次。
            </p>
          </div>
        </div>

        {loading ? (
          <div className="page-loading-placeholder" aria-hidden="true">
            <span />
          </div>
        ) : games.length === 0 ? (
          <p className="tag-page-empty">游戏库里还没有已发布内容。</p>
        ) : (
          <>
            <div className="games-page-filters">
              <div className="games-page-filter-group">
                <button
                  className={`games-page-filter-chip ${selectedTag === null ? "active" : ""}`}
                  onClick={() => setSelectedTag(null)}
                  type="button"
                >
                  全部标签
                </button>
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    className={`games-page-filter-chip ${selectedTag === tag ? "active" : ""}`}
                    onClick={() => setSelectedTag(tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="games-page-filter-group games-page-filter-group-secondary">
                {(Object.keys(difficultyLabels) as DifficultyFilter[]).map((difficulty) => (
                  <button
                    key={difficulty}
                    className={`games-page-filter-chip ${selectedDifficulty === difficulty ? "active" : ""}`}
                    onClick={() => setSelectedDifficulty(difficulty)}
                    type="button"
                  >
                    {difficultyLabels[difficulty]}
                  </button>
                ))}
              </div>
            </div>

            <div className="games-page-results-bar">
              <p className="games-page-results-text">
                当前显示 {filteredGames.length} 个游戏
              </p>
              <div className="games-page-results-actions">
                {(selectedTag || selectedDifficulty !== "all") && (
                  <button
                    className="games-page-reset"
                    onClick={() => {
                      setSelectedTag(null);
                      setSelectedDifficulty("all");
                    }}
                    type="button"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {filteredGames.length === 0 ? (
              <p className="tag-page-empty">当前筛选下没有匹配的游戏。</p>
            ) : (
              <>
                {randomGame && (
                  <article className="games-page-random-card">
                    <div className="games-page-random-copy">
                      <p className="games-page-random-label">
                        {randomGame.cover_emoji ? `${randomGame.cover_emoji} ` : ""}
                        Lucky Pick
                      </p>
                      <div className="games-page-hero-head">
                        <div className="games-page-hero-head-copy">
                          <h2 className="games-page-random-title">{randomGame.title}</h2>
                          <p className="games-page-random-hook">
                            {randomGame.hook ?? randomGame.cover_text ?? randomGame.summary}
                          </p>
                        </div>

                        <div className="games-page-random-meta">
                          <div className="games-page-random-facts">
                            <p>
                              <span>当前池子</span>
                              <strong>{filteredGames.length} 个游戏</strong>
                            </p>
                            <p>
                              <span>难度</span>
                              <strong>{randomGame.difficulty ?? "unknown"}</strong>
                            </p>
                            <p>
                              <span>时长</span>
                              <strong>
                                {randomGame.estimated_minutes
                                  ? `${randomGame.estimated_minutes} 分钟`
                                  : "灵活"}
                              </strong>
                            </p>
                            <p>
                              <span>状态</span>
                              <strong className="games-page-meta-status">
                                {isGamePlayable(randomGame, publishedPostSlugs)
                                  ? "可游玩"
                                  : "待补全"}
                              </strong>
                            </p>
                          </div>

                          {randomGame.tags.length > 0 && (
                            <div className="games-page-tag-row">
                              {randomGame.tags.map((tag) => (
                                <span key={`${randomGame.id}-${tag}`} className="games-page-tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {randomGame.summary && (
                        <div className="games-page-info-card">
                          <p className="games-page-info-label">简介</p>
                          <p className="games-page-random-summary">{randomGame.summary}</p>
                        </div>
                      )}
                      {randomGame.rules && (
                        <div className="games-page-info-card">
                          <p className="games-page-info-label">玩法</p>
                          <p className="games-page-random-summary">{randomGame.rules}</p>
                        </div>
                      )}

                      <div className="games-page-random-actions">
                        {isGamePlayable(randomGame, publishedPostSlugs) ? (
                          <Link
                            to={randomGame.play_url!}
                            className="hero-lucky-popout-link"
                          >
                            游戏背景 →
                          </Link>
                        ) : (
                          <span className="games-page-unavailable">内容待补全</span>
                        )}
                        {filteredGames.length > 1 && (
                          <button
                            className="hero-lucky-popout-refresh"
                            onClick={refreshRandomGame}
                            type="button"
                          >
                            换一个
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )}

                {featuredGame && (
                  <article className="games-page-featured-card">
                    <div className="games-page-featured-copy">
                      <p className="games-page-featured-label">
                        {featuredGame.cover_emoji ? `${featuredGame.cover_emoji} ` : ""}
                        Featured Game
                      </p>
                      <div className="games-page-hero-head">
                        <div className="games-page-hero-head-copy">
                          <h2 className="games-page-featured-title">{featuredGame.title}</h2>
                          <p className="games-page-featured-hook">
                            {featuredGame.hook ?? featuredGame.cover_text ?? featuredGame.summary}
                          </p>
                        </div>

                        <div className="games-page-featured-meta">
                          <div className="games-page-featured-facts">
                            <p>
                              <span>难度</span>
                              <strong>{featuredGame.difficulty ?? "unknown"}</strong>
                            </p>
                            <p>
                              <span>时长</span>
                              <strong>
                                {featuredGame.estimated_minutes
                                  ? `${featuredGame.estimated_minutes} 分钟`
                                  : "灵活"}
                              </strong>
                            </p>
                            <p>
                              <span>来源</span>
                              <strong>
                                {featuredGame.post_title ??
                                  featuredGame.post_slug ??
                                  "standalone"}
                              </strong>
                            </p>
                            <p>
                              <span>状态</span>
                              <strong className="games-page-meta-status">
                                {isGamePlayable(featuredGame, publishedPostSlugs)
                                  ? "可游玩"
                                  : "待补全"}
                              </strong>
                            </p>
                          </div>

                          {featuredGame.tags.length > 0 && (
                            <div className="games-page-tag-row">
                              {featuredGame.tags.map((tag) => (
                                <span
                                  key={`${featuredGame.id}-${tag}`}
                                  className="games-page-tag"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      {featuredGame.summary && (
                        <div className="games-page-info-card">
                          <p className="games-page-info-label">简介</p>
                          <p className="games-page-featured-summary">{featuredGame.summary}</p>
                        </div>
                      )}
                      {featuredGame.rules && (
                        <div className="games-page-info-card">
                          <p className="games-page-info-label">玩法</p>
                          <p className="games-page-featured-summary">{featuredGame.rules}</p>
                        </div>
                      )}

                      <div className="games-page-featured-actions">
                        {isGamePlayable(featuredGame, publishedPostSlugs) ? (
                          <Link
                            to={featuredGame.play_url!}
                            className="hero-lucky-popout-link"
                          >
                            游戏背景 →
                          </Link>
                        ) : (
                          <span className="games-page-unavailable">内容待补全</span>
                        )}
                      </div>
                    </div>
                  </article>
                )}

                <div className="games-grid">
                  {remainingGames.map((game) => (
                    <article key={game.id} className="game-card">
                      <div className="game-card-topline">
                        <span className="game-card-emoji" aria-hidden="true">
                          {game.cover_emoji ?? "🎲"}
                        </span>
                        <span className="game-card-difficulty">
                          {difficultyLabels[(game.difficulty ?? "easy") as Exclude<DifficultyFilter, "all">]}
                        </span>
                      </div>

                      <h3 className="game-card-title">{game.title}</h3>
                      <p className="game-card-hook">
                        {game.hook ?? game.cover_text ?? game.summary ?? "一个可随时开始的小型思维游戏。"}
                      </p>
                      {game.summary && (
                        <div className="games-page-info-card game-card-info-card">
                          <p className="games-page-info-label">简介</p>
                          <p className="game-card-summary">{game.summary}</p>
                        </div>
                      )}
                      {game.rules && (
                        <div className="games-page-info-card game-card-info-card">
                          <p className="games-page-info-label">玩法</p>
                          <p className="game-card-summary">{game.rules}</p>
                        </div>
                      )}

                      <div className="game-card-meta">
                        <span>
                          {game.estimated_minutes ? `${game.estimated_minutes} 分钟` : "灵活时长"}
                        </span>
                        <span>{game.post_title ?? game.post_slug ?? "standalone"}</span>
                      </div>

                      {game.tags.length > 0 && (
                        <div className="games-page-tag-row">
                          {game.tags.map((tag) => (
                            <span key={`${game.id}-${tag}`} className="games-page-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {isGamePlayable(game, publishedPostSlugs) ? (
                        <Link
                          to={game.play_url!}
                          className="hero-lucky-popout-link game-card-link"
                        >
                          游戏背景 →
                        </Link>
                      ) : (
                        <span className="games-page-unavailable">内容待补全</span>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default GamesPage;
