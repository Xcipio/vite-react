import { Link, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import CommentsSection from "./components/CommentsSection";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import { fetchPublishedPostBySlug } from "./lib/posts";
import { getPostTags, getTagStyle } from "./lib/tags";
import { Post } from "./types/post";

const PostContent = lazy(() => import("./components/PostContent"));
const READ_COMPLETE_STORAGE_KEY = "post-read-complete";

function PostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedReading, setHasCompletedReading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data, error } = await fetchPublishedPostBySlug(slug);

      if (error) {
        console.error("Failed to fetch post:", error);
      } else {
        setPost(data);
      }

      setLoading(false);
    };

    fetchPost();
  }, [slug]);

  useEffect(() => {
    if (!slug) {
      setHasCompletedReading(false);
      return;
    }

    const stored = window.localStorage.getItem(READ_COMPLETE_STORAGE_KEY);
    const completedMap = stored ? (JSON.parse(stored) as Record<string, boolean>) : {};
    setHasCompletedReading(Boolean(completedMap[slug]));
  }, [slug]);

  if (loading) {
    return (
      <div className="page post-page">
        <section className="section post-page-section">
          <p>Loading...</p>
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
              <Link to="/">← Back to home</Link>
            </p>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>

          <p>Post not found.</p>
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

  const handleShareArticle = async () => {
    const shareUrl = `${window.location.origin}/post/${post.slug}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.excerpt ?? post.title,
          url: shareUrl,
        });
        setShareFeedback("已调起分享");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareFeedback("链接已复制");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("链接已复制");
      } catch {
        setShareFeedback("暂时无法分享");
      }
    }
  };

  return (
    <div className="page post-page">
      <section className="section post-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/">← Back to home</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
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
            <Suspense fallback={<p className="post-detail-loading">Loading content...</p>}>
              <PostContent content={post.content} />
            </Suspense>

            <div className="post-read-complete">
              <button
                className={`post-read-complete-button ${hasCompletedReading ? "is-complete" : ""}`}
                type="button"
                onClick={handleCompleteReading}
                disabled={hasCompletedReading}
              >
                {hasCompletedReading ? "已读完" : "读完了"}
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
          </div>
        </article>

        <CommentsSection postSlug={post.slug} postTitle={post.title} />
      </section>
    </div>
  );
}

export default PostPage;
