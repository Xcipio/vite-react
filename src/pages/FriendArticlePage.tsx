import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CommentsSection from "../components/CommentsSection";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { sendLikeNotification } from "../lib/notifications";
import {
  activatePostLike,
  deactivatePostLike,
  fetchPostLikeState,
} from "../lib/postLikes";
import {
  friendArticleCategoryMeta,
  getFriendArticleCategoryPath,
  inferFriendArticleCategory,
} from "../lib/friendArticleCategories";
import { fetchPublishedFriendArticleBySlug } from "../lib/friendArticles";
import { getTagStyle, sortTags } from "../lib/tags";
import { FriendArticle } from "../types/friendArticle";

const PostContent = lazy(() => import("../components/PostContent"));
const FRIEND_READ_COMPLETE_STORAGE_KEY = "friend-article-read-complete";

function FriendArticlePage() {
  const { slug } = useParams();
  const { theme, toggleTheme } = useTheme();
  const [article, setArticle] = useState<FriendArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedReading, setHasCompletedReading] = useState(false);
  const [hasLikedArticle, setHasLikedArticle] = useState(false);
  const [likeUpdating, setLikeUpdating] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const currentArticleUrl = `${window.location.origin}${window.location.pathname}`;

  useEffect(() => {
    const loadArticle = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data, error } = await fetchPublishedFriendArticleBySlug(slug);

      if (error) {
        console.error("Failed to fetch friend article:", error);
      } else {
        setArticle(data ?? null);
      }

      setLoading(false);
    };

    void loadArticle();
  }, [slug]);

  useEffect(() => {
    const syncInteractionState = async () => {
      if (!slug) {
        setHasCompletedReading(false);
        setHasLikedArticle(false);
        return;
      }

      const stored = window.localStorage.getItem(FRIEND_READ_COMPLETE_STORAGE_KEY);
      const completedMap = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
      setHasCompletedReading(Boolean(completedMap[slug]));

      const { data: likeState, error: likeStateError } = await fetchPostLikeState(
        `friend:${slug}`,
      );

      if (likeStateError) {
        console.error("Failed to fetch friend article like state:", likeStateError);
      } else {
        setHasLikedArticle(Boolean(likeState?.is_active));
      }
    };

    void syncInteractionState();
  }, [slug]);

  if (loading) {
    return (
      <div className="page post-page">
        <section className="section post-page-section">
          <div className="page-loading-placeholder" aria-hidden="true">
            <span />
          </div>
        </section>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page post-page">
        <section className="section post-page-section">
          <div className="tag-page-topbar">
            <p className="tag-page-back">
              <Link to="/friends">← 返回 Friends</Link>
            </p>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <p>文章不存在。</p>
        </section>
      </div>
    );
  }

  const category = inferFriendArticleCategory(article);
  const categoryMeta = friendArticleCategoryMeta[category];
  const authorLinks = [
    article.author_social_url
      ? {
          label: article.author_social_url,
          url: article.author_social_url,
        }
      : null,
  ].filter((link): link is { label: string; url: string } => Boolean(link));

  const handleCompleteReading = () => {
    if (!slug) {
      return;
    }

    const stored = window.localStorage.getItem(FRIEND_READ_COMPLETE_STORAGE_KEY);
    const completedMap = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
    completedMap[slug] = true;
    window.localStorage.setItem(
      FRIEND_READ_COMPLETE_STORAGE_KEY,
      JSON.stringify(completedMap),
    );
    setHasCompletedReading(true);
  };

  const handleToggleLike = async () => {
    if (!slug || !article) {
      return;
    }

    const likeSlug = `friend:${slug}`;
    const nextLikedState = !hasLikedArticle;
    const previousLikedState = hasLikedArticle;

    setHasLikedArticle(nextLikedState);
    setLikeUpdating(true);

    const { error } = nextLikedState
      ? await activatePostLike(likeSlug)
      : await deactivatePostLike(likeSlug);

    if (error) {
      console.error("Failed to update friend article like:", error);
      setHasLikedArticle(previousLikedState);
      setLikeUpdating(false);
      return;
    }

    setLikeUpdating(false);

    if (nextLikedState) {
      void sendLikeNotification({
        postSlug: article.slug,
        postTitle: article.title,
        postUrl: currentArticleUrl,
        language: "zh",
      }).then(({ error: notificationError }) => {
        if (notificationError) {
          console.error("Failed to send friend article like notification:", notificationError);
        }
      });
    }
  };

  const handleShareArticle = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: article.excerpt ?? article.title,
          url: currentArticleUrl,
        });
        setShareFeedback("已调起分享");
        return;
      }

      await navigator.clipboard.writeText(currentArticleUrl);
      setShareFeedback("链接已复制");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(currentArticleUrl);
        setShareFeedback("链接已复制");
      } catch {
        setShareFeedback("暂时无法分享");
      }
    }
  };

  return (
    <div className="page post-page friend-article-page">
      <section className="section post-page-section">
        <div className="tag-page-topbar">
          <div className="article-topbar-nav">
            <Link className="article-home-button" to="/" aria-label="返回主页">
              <svg
                aria-hidden="true"
                className="article-home-icon"
                viewBox="0 0 24 24"
              >
                <path d="M4.5 10.8 12 4.6l7.5 6.2" />
                <path d="M6.8 9.7v8.5h10.4V9.7" />
              </svg>
            </Link>
            <p className="tag-page-back">
              <Link to="/friends">← 返回 Friends</Link>
            </p>
          </div>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <article className="post-detail-shell">
          <header className="post-detail-hero post-detail-enter-hero">
            <div className="friend-article-category-row">
              <p className="section-label">{categoryMeta.englishLabel}</p>
              <span className="friend-article-category-badge-shell">
                <Link
                  to={getFriendArticleCategoryPath(category)}
                  className="friend-article-category-link"
                >
                  <span className="friend-article-category-mark" aria-hidden="true" />
                  {category}
                </Link>
              </span>
            </div>
            <h1 className="post-detail-title">{article.title}</h1>

            <div className="post-detail-intro">
              <p className="post-detail-excerpt">{article.excerpt}</p>

              <div className="post-detail-meta-row friend-article-meta-row">
                <div className="friend-article-meta-primary">
                  <div className="post-detail-date-badge">
                    {new Date(article.published_at).toLocaleDateString()}
                  </div>
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
                    <span className="friends-author-chip">{article.author_name}</span>
                  </div>
                </div>

                {article.tags.length > 0 && (
                  <div className="post-detail-tags">
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

              {article.author_profile && (
                <aside className="friend-article-author-spotlight">
                  <div className="friend-article-author-card-top">
                    <p className="friend-article-author-label">作者简介</p>
                  </div>

                  <div className="friend-article-author-card-body">
                    {article.author_avatar_url ? (
                      <img
                        className="friend-article-author-avatar"
                        src={article.author_avatar_url}
                        alt={article.author_name}
                        loading="lazy"
                      />
                    ) : (
                      <span className="friend-article-author-avatar friend-article-author-avatar-fallback">
                        友
                      </span>
                    )}

                    <div className="friend-article-author-copy">
                      <h2 className="friend-article-author-name">{article.author_name}</h2>
                      <p className="friend-article-author-bio">{article.author_profile}</p>
                      {article.author_homepage_url && (
                        <div className="friend-article-author-actions">
                          <a
                            className="friend-article-author-link"
                            href={article.author_homepage_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {article.author_homepage_url}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </header>

          <div className="post-detail-body post-detail-enter-body">
            <Suspense fallback={<p className="post-detail-loading">内容加载中...</p>}>
              <PostContent content={article.content} />
            </Suspense>

            {article.original_url && (
              <aside className="friend-article-original-link" aria-label="原文链接">
                <p className="friend-article-original-link-label">原文链接</p>
                <a
                  className="friend-article-original-link-url"
                  href={article.original_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {article.original_url}
                </a>
              </aside>
            )}

            <div className="post-read-complete friend-article-actions">
              <button
                className={`post-read-complete-button ${hasCompletedReading ? "is-complete" : ""}`}
                type="button"
                onClick={handleCompleteReading}
                disabled={hasCompletedReading}
              >
                {hasCompletedReading ? "已读完" : "读完了"}
              </button>

              <button
                className={`post-like-button ${hasLikedArticle ? "is-liked" : ""}`}
                type="button"
                onClick={() => void handleToggleLike()}
                aria-label={hasLikedArticle ? "取消喜欢" : "喜欢这篇投稿"}
                aria-pressed={hasLikedArticle}
                disabled={likeUpdating}
              >
                <span>{hasLikedArticle ? "已喜欢" : "喜欢"}</span>
                <span className="post-like-icon" aria-hidden="true">♥</span>
              </button>

              <button
                className="post-share-button"
                type="button"
                onClick={handleShareArticle}
              >
                分享文章
              </button>
            </div>

            {shareFeedback && <p className="post-share-feedback">{shareFeedback}</p>}

            {authorLinks.length > 0 && (
              <aside className="friend-article-end-links" aria-label="作者链接">
                <div className="friend-article-end-links-list">
                  {authorLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      className="friend-article-end-link"
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="friend-article-end-link-url">
                        {link.label}
                      </span>
                    </a>
                  ))}
                </div>
              </aside>
            )}

            <div className="friend-article-more">
              <Link className="friend-article-more-link" to="/friends">
                返回 Friends 栏目页 →
              </Link>
            </div>
          </div>
        </article>

        <CommentsSection
          postSlug={article.slug}
          postTitle={article.title}
          variant="friends"
        />
      </section>
    </div>
  );
}

export default FriendArticlePage;
