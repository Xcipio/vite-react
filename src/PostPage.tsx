import { Link, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import CommentsSection from "./components/CommentsSection";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import { sendLikeNotification } from "./lib/notifications";
import {
  activatePostLike,
  deactivatePostLike,
  fetchPostLikeCount,
  fetchPostLikeState,
} from "./lib/postLikes";
import {
  fetchPublishedPostBySlug,
  fetchPublishedPostTranslation,
} from "./lib/posts";
import { getPostTags, getTagStyle } from "./lib/tags";
import { Post } from "./types/post";

const PostContent = lazy(() => import("./components/PostContent"));
const READ_COMPLETE_STORAGE_KEY = "post-read-complete";

function PostPage({ language = "zh" }: { language?: "zh" | "en" }) {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [alternatePost, setAlternatePost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedReading, setHasCompletedReading] = useState(false);
  const [hasLikedPost, setHasLikedPost] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [likeUpdating, setLikeUpdating] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isEnglish = language === "en";
  const uiText = {
    loading: isEnglish ? "Loading..." : "Loading...",
    notFound: isEnglish ? "Post not found." : "文章不存在。",
    backHome: isEnglish ? "← Back to home" : "← 返回首页",
    shareOpened: isEnglish ? "Share sheet opened" : "已调起分享",
    copied: isEnglish ? "Link copied" : "链接已复制",
    shareFailed: isEnglish ? "Unable to share right now" : "暂时无法分享",
    loadingContent: isEnglish ? "Loading content..." : "内容加载中...",
    readDone: isEnglish ? "Marked as read" : "已读完",
    readAction: isEnglish ? "Mark as read" : "读完了",
    likeAction: isEnglish ? "Like" : "喜欢",
    likedAction: isEnglish ? "Liked" : "喜欢",
    shareArticle: isEnglish ? "Share article" : "分享文章",
  };

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setAlternatePost(null);

      const { data, error } = await fetchPublishedPostBySlug(slug, language);

      if (error) {
        console.error("Failed to fetch post:", error);
      } else {
        setPost(data);

        if (data?.translation_group) {
          const targetLanguage = language === "zh" ? "en" : "zh";
          const { data: translationData, error: translationError } =
            await fetchPublishedPostTranslation(data.translation_group, targetLanguage);

          if (translationError) {
            console.error("Failed to fetch translated post:", translationError);
          } else {
            setAlternatePost(translationData ?? null);
          }
        } else {
          setAlternatePost(null);
        }
      }

      setLoading(false);
    };

    fetchPost();
  }, [slug, language]);

  useEffect(() => {
    const syncInteractionState = async () => {
      if (!slug) {
        setHasCompletedReading(false);
        setHasLikedPost(false);
        setLikeCount(null);
        return;
      }

      const stored = window.localStorage.getItem(READ_COMPLETE_STORAGE_KEY);
      const completedMap = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
      setHasCompletedReading(Boolean(completedMap[slug]));

      const [
        { data: likeState, error: likeStateError },
        { count, error: likeCountError },
      ] = await Promise.all([
        fetchPostLikeState(slug),
        fetchPostLikeCount(slug),
      ]);

      if (likeStateError) {
        console.error("Failed to fetch like state:", likeStateError);
      } else {
        setHasLikedPost(Boolean(likeState?.is_active));
      }

      if (likeCountError) {
        console.error("Failed to fetch like count:", likeCountError);
      } else {
        setLikeCount(count ?? 0);
      }
    };

    void syncInteractionState();
  }, [slug]);

  if (loading) {
    return (
      <div className="page post-page">
        <section className="section post-page-section">
          <p>Loading...</p>
          <p>{uiText.loading}</p>
        </section>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="page post-page">
        <section className="section post-page-section">
          <div className="tag-page-topbar">
            <p className="tag-page-back">
              <Link to={isEnglish ? "/en" : "/"}>{uiText.backHome}</Link>
            </p>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <p>{uiText.notFound}</p>
        </section>
      </div>
    );
  }

  const postTags = getPostTags(post);

  const handleCompleteReading = () => {
    if (!slug) {
      return;
    }

    const stored = window.localStorage.getItem(READ_COMPLETE_STORAGE_KEY);
    const completedMap = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
    completedMap[slug] = true;
    window.localStorage.setItem(READ_COMPLETE_STORAGE_KEY, JSON.stringify(completedMap));
    setHasCompletedReading(true);
  };

  const handleToggleLike = async () => {
    if (!slug || !post) {
      return;
    }

    const nextLikedState = !hasLikedPost;
    const previousLikedState = hasLikedPost;
    const previousLikeCount = likeCount ?? 0;

    setHasLikedPost(nextLikedState);
    setLikeCount(Math.max(0, previousLikeCount + (nextLikedState ? 1 : -1)));
    setLikeUpdating(true);

    if (nextLikedState) {
      const { error } = await activatePostLike(slug);

      if (error) {
        console.error("Failed to activate like:", error);
        setHasLikedPost(previousLikedState);
        setLikeCount(previousLikeCount);
        setLikeUpdating(false);
        return;
      }
    } else {
      const { error } = await deactivatePostLike(slug);

      if (error) {
        console.error("Failed to deactivate like:", error);
        setHasLikedPost(previousLikedState);
        setLikeCount(previousLikeCount);
        setLikeUpdating(false);
        return;
      }
    }

    setLikeUpdating(false);

    if (nextLikedState) {
      const postUrl =
        language === "en"
          ? `${window.location.origin}/en/post/${post.slug}`
          : `${window.location.origin}/post/${post.slug}`;

      void sendLikeNotification({
        postSlug: post.slug,
        postTitle: post.title,
        postUrl,
        language,
      }).then(({ error }) => {
        if (error) {
          console.error("Failed to send like notification:", error);
        }
      });
    }
  };

  const handleShareArticle = async () => {
    const shareUrl =
      language === "en"
        ? `${window.location.origin}/en/post/${post.slug}`
        : `${window.location.origin}/post/${post.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt ?? post.title,
          url: shareUrl,
        });
        setShareFeedback(uiText.shareOpened);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback(uiText.copied);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback(uiText.copied);
      } catch {
        setShareFeedback(uiText.shareFailed);
      }
    }
  };

  return (
    <div className={`page post-page ${isEnglish ? "post-page-en" : "post-page-zh"}`}>
      <section className="section post-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to={isEnglish ? "/en" : "/"}>{uiText.backHome}</Link>
          </p>
          <div className="post-detail-topbar-actions">
            {alternatePost && (
              <Link
                className="post-detail-language-switch"
                to={
                  alternatePost.language === "en"
                    ? `/en/post/${alternatePost.slug}`
                    : `/post/${alternatePost.slug}`
                }
              >
                {alternatePost.language === "en" ? "English Version" : "中文版"}
              </Link>
            )}
            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
              locale={language === "en" ? "en" : "zh"}
            />
          </div>
        </div>

        <article className="post-detail-shell">
          <header className="post-detail-hero">
            <p className="section-label">ESSAY</p>
            <h1 className="post-detail-title">{post.title}</h1>

            <div className="post-detail-intro">
              {post.excerpt && <p className="post-detail-excerpt">{post.excerpt}</p>}

              <div className="post-detail-meta-row">
                <div className="post-detail-date-badge">
                  {new Date(post.published_at).toLocaleDateString()}
                </div>

                {postTags.length > 0 && (
                  <div className="post-detail-tags">
                    {postTags.map((tag) => (
                      <Link
                        key={`${post.id}-${tag}`}
                        className="post-tag-badge"
                        style={getTagStyle(tag, theme)}
                        to={`/tag/${encodeURIComponent(tag)}`}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="post-detail-body">
            <Suspense fallback={<p className="post-detail-loading">{uiText.loadingContent}</p>}>
              <PostContent content={post.content} />
            </Suspense>

            <div className="post-read-complete">
              <button
                className={`post-read-complete-button ${hasCompletedReading ? "is-complete" : ""}`}
                type="button"
                onClick={handleCompleteReading}
                disabled={hasCompletedReading}
              >
                {hasCompletedReading ? uiText.readDone : uiText.readAction}
              </button>

              <button
                className={`post-like-button ${hasLikedPost ? "is-liked" : ""}`}
                type="button"
                onClick={() => void handleToggleLike()}
                aria-label={hasLikedPost ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={hasLikedPost}
                disabled={likeUpdating}
              >
                <span>{hasLikedPost ? uiText.likedAction : uiText.likeAction}</span>
                <span aria-hidden="true">❤</span>
              </button>

              <button
                className="post-share-button"
                type="button"
                onClick={handleShareArticle}
              >
                {uiText.shareArticle}
              </button>
            </div>

            {shareFeedback && <p className="post-share-feedback">{shareFeedback}</p>}
          </div>
        </article>

        <CommentsSection postSlug={post.slug} postTitle={post.title} language={language} />
      </section>
    </div>
  );
}

export default PostPage;
