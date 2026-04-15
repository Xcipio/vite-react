import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedPosts } from "../lib/posts";
import { getPostTags, getTagStyle, sortTags } from "../lib/tags";
import { Post } from "../types/post";

const tagDescriptions: Record<string, string> = {
  随笔: "这个标签下是相对自由的写作，内容不限定主题，主要记录当下的想法和观察。",
  思维模型: "这个标签下的文章会集中讨论方法、框架和可复用的思考结构。",
  文心雕侬: "这个标签主要整理历史上著名的文学家和他们的作品，试图从他们的创作和人生中提炼出一些对我们有启发的东西。",
  卡片: "这个标签下是关于我设计的各种互动卡片的。",
  哲学透镜: "这个标签主是关于哲学家和哲学概念的系列文章，试图通过他们的思想来解读世界和人生。",
  永恒之城: "这个标签是关于罗马传奇的将领和英雄的系列文章，试图从历史和文学的角度来解读他们的故事和精神。",
};

const tagHeroToneMap: Record<string, string> = {
  随笔: "tag-page-hero-essay",
  思维模型: "tag-page-hero-model",
  文心雕侬: "tag-page-hero-literature",
  卡片: "tag-page-hero-cards",
  哲学透镜: "tag-page-hero-philosophy",
  永恒之城: "tag-page-hero-eternal-city",
};

function TagPage() {
  const { tagName = "" } = useParams();
  const decodedTag = decodeURIComponent(tagName);
  const { theme, toggleTheme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      const { data, error } = await fetchPublishedPosts();

      if (error) {
        console.error("Failed to fetch posts:", error);
      } else {
        setPosts(data ?? []);
      }

      setLoading(false);
    };

    loadPosts();
  }, []);

  const filteredPosts = useMemo(
    () => posts.filter((post) => getPostTags(post).includes(decodedTag)),
    [decodedTag, posts],
  );
  const featuredPost = filteredPosts[0] ?? null;
  const remainingPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;
  const tagDescription =
    tagDescriptions[decodedTag] ??
    `围绕「${decodedTag}」展开的文章都收拢在这里，方便沿着同一条线索连续阅读。`;
  const heroToneClass = tagHeroToneMap[decodedTag] ?? "tag-page-hero-default";

  const siblingTags = useMemo(
    () =>
      sortTags([
        ...new Set(
          posts
            .filter((post) => getPostTags(post).includes(decodedTag))
            .flatMap((post) => getPostTags(post)),
        ),
      ]),
    [decodedTag, posts],
  );

  return (
    <div className="page tag-page">
      <section className="section tag-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/">← Back to home</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className={`tag-page-hero ${heroToneClass}`}>
          <p className="section-label">TAG PAGE</p>
          <h1 className="tag-page-title">{decodedTag}</h1>
          <p className="tag-page-description">{tagDescription}</p>
          <p className="tag-page-subtitle">
            这里汇总了所有带有这个标签的文章。当前共 {filteredPosts.length} 篇。
          </p>

          {siblingTags.length > 0 && (
            <div className="tag-page-tag-row">
              {siblingTags.map((tag) => (
                <Link
                  key={tag}
                  className={`hero-tag-button ${tag === decodedTag ? "active" : ""}`}
                  style={getTagStyle(tag, theme)}
                  to={`/tag/${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="tag-page-empty">这个标签下暂时还没有文章。</p>
        ) : (
          <>
            {featuredPost && (
              <article className="tag-page-featured-card">
                <div className="tag-page-featured-copy">
                  <p className="tag-page-featured-label">Featured Essay</p>
                  <h2 className="tag-page-featured-title">
                    <Link to={`/post/${featuredPost.slug}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className="tag-page-featured-excerpt">{featuredPost.excerpt}</p>
                  <div className="tag-page-featured-actions">
                    <Link to={`/post/${featuredPost.slug}`} className="post-link">
                      阅读全文 →
                    </Link>
                  </div>
                </div>

                <div className="tag-page-featured-meta">
                  <p className="tag-page-featured-date">
                    {new Date(featuredPost.published_at).toLocaleDateString()}
                  </p>
                  <div className="tag-page-featured-tags">
                    {getPostTags(featuredPost).map((tag) => (
                      <Link
                        key={`featured-${featuredPost.id}-${tag}`}
                        className={`hero-tag-button ${decodedTag === tag ? "active" : ""}`}
                        style={getTagStyle(tag, theme)}
                        to={`/tag/${encodeURIComponent(tag)}`}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            )}

            <div className="posts-grid tag-page-grid">
              {remainingPosts.map((post) => (
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
                      <Link
                        key={`${post.id}-${tag}`}
                        className={`post-tag-badge ${decodedTag === tag ? "active" : ""}`}
                        style={getTagStyle(tag, theme)}
                        to={`/tag/${encodeURIComponent(tag)}`}
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default TagPage;
