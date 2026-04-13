import { Link, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";
import { fetchPublishedPostBySlug } from "./lib/posts";
import { Post } from "./types/post";

const PostContent = lazy(() => import("./components/PostContent"));

function PostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <p style={{ margin: 0 }}>
            <Link to="/">← Back to home</Link>
          </p>

          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <p>Post not found.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <p style={{ margin: 0 }}>
          <Link to="/">← Back to home</Link>
        </p>

        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <small>{new Date(post.published_at).toLocaleDateString()}</small>

      <Suspense fallback={<p style={{ marginTop: "32px" }}>Loading content...</p>}>
        <PostContent content={post.content} />
      </Suspense>
    </div>
  );
}

export default PostPage;
