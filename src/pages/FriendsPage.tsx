import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import {
  friendArticleCategoryMeta,
  friendArticleCategoryOrder,
  getFriendArticleCategoryPath,
  inferFriendArticleCategory,
} from "../lib/friendArticleCategories";
import { fetchPublishedFriendArticles } from "../lib/friendArticles";
import { getTagStyle, sortTags } from "../lib/tags";
import { FriendArticle } from "../types/friendArticle";

function FriendsPage() {
  const { theme, toggleTheme } = useTheme();
  const [articles, setArticles] = useState<FriendArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      const { data, error } = await fetchPublishedFriendArticles();

      if (error) {
        console.error("Failed to fetch friend articles:", error);
      } else {
        setArticles(data ?? []);
      }

      setLoading(false);
    };

    void loadArticles();
  }, []);

  const latestArticles = articles.slice(0, 5);

  return (
    <div className="page friends-page">
      <section className="section friends-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/">← 返回主页</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className="friends-page-hero">
          <div className="friends-page-hero-copy">
            <p className="section-label">FRIENDS</p>
            <h1 className="tag-page-title">投稿</h1>
            <p className="tag-page-description">
              这里收录朋友们投稿到 PlayxelD 的文章。
            </p>
            <p className="tag-page-subtitle">
              当前共公开 {articles.length} 篇投稿文章。故事偏叙事，专题偏策划，
              随笔则保留轻一些的个人表达。
            </p>
          </div>

          <div className="friends-page-hero-side friends-page-overview-strip">
            {friendArticleCategoryOrder.map((category) => {
              const meta = friendArticleCategoryMeta[category];
              const count = articles.filter(
                (article) => inferFriendArticleCategory(article) === category,
              ).length;

              return (
                <Link
                  key={category}
                  className="friends-page-overview-link friends-page-overview-link-compact"
                  to={getFriendArticleCategoryPath(category)}
                >
                  <div className="friends-page-overview-card">
                    <p className="friends-page-overview-label">
                      {meta.englishLabel}
                    </p>
                    <div className="friends-page-overview-heading">
                      <h2>{meta.title}</h2>
                      <span>{count}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="page-loading-placeholder" aria-hidden="true">
            <span />
          </div>
        ) : articles.length === 0 ? (
          <div className="friends-page-empty-card">
            <p className="friends-page-empty-label">Coming Soon</p>
            <h2 className="friends-page-empty-title">专栏入口已经就位</h2>
            <p className="friends-page-empty-text">
              第一篇朋友投稿上线后，这里会自动分配到故事、专题或随笔栏目。
            </p>
          </div>
        ) : (
          <>
            <section className="friends-latest-section">
              <div className="friends-latest-section-head">
                <div>
                  <p className="friends-column-label">Recent Posts</p>
                  <h2 className="friends-column-title">最新投稿</h2>
                </div>
              </div>

              <div className="friends-latest-grid">
                {latestArticles.map((article, index) => {
                  const category = inferFriendArticleCategory(article);

                  return (
                    <article
                      key={article.id}
                      className={`friends-column-featured-card friends-latest-card ${
                        index === 0 ? "friends-latest-card-emphasis" : ""
                      }`}
                    >
                      <div className="friends-column-featured-top">
                        <Link
                          to={getFriendArticleCategoryPath(category)}
                          className="friends-category-chip-link"
                        >
                          <span
                            className="hero-tag-button friends-tag-chip"
                            style={getTagStyle(category, theme)}
                          >
                            {category}
                          </span>
                        </Link>
                        <span className="friends-column-featured-date">
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="friends-column-featured-title">
                        <Link to={`/friends/${article.slug}`}>{article.title}</Link>
                      </h3>

                      {article.excerpt && (
                        <p className="friends-column-featured-excerpt">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="friends-card-meta">
                        <div className="friends-author-summary">
                          {article.author_avatar_url ? (
                            <img
                              className="friends-author-avatar"
                              src={article.author_avatar_url}
                              alt={article.author_name}
                              loading="lazy"
                            />
                          ) : (
                            <span className="friends-author-avatar friends-author-avatar-fallback">
                              友
                            </span>
                          )}
                          <span className="friends-author-chip">
                            作者：{article.author_name}
                          </span>
                        </div>
                        {article.tags.length > 0 && (
                          <div className="friends-tag-row">
                            {sortTags(article.tags).map((tag) => (
                              <span
                                key={`${article.id}-${tag}`}
                                className="hero-tag-button friends-tag-chip"
                                style={getTagStyle(tag, theme)}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <Link to={`/friends/${article.slug}`} className="post-link">
                        阅读全文 →
                      </Link>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="friends-columns">
              {friendArticleCategoryOrder.map((category) => {
                const meta = friendArticleCategoryMeta[category];

                return (
                  <section key={category} className="friends-column-section">
                    <header className="friends-column-header">
                      <div>
                        <p className="friends-column-label">{meta.englishLabel}</p>
                        <h2 className="friends-column-title">{meta.title}</h2>
                      </div>
                    </header>

                    <p className="friends-column-description">{meta.description}</p>

                    <Link
                      to={getFriendArticleCategoryPath(category)}
                      className="friends-column-portal"
                    >
                      <span>进入 {meta.title} 栏目页</span>
                      <span>查看这个分类的全部文章 →</span>
                    </Link>
                  </section>
                );
              })}
            </section>
          </>
        )}
      </section>
    </div>
  );
}

export default FriendsPage;
