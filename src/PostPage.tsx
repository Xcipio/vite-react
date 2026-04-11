import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { supabase } from "./lib/supabase";

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  published_at: string;
  is_published: boolean;
};

function PostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

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
        <p>Post not found.</p>
        <p>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <p>
        <Link to="/">← Back to home</Link>
      </p>

      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <small>{new Date(post.published_at).toLocaleDateString()}</small>

      <div
        style={{
          marginTop: "32px",
          lineHeight: 1.8,
          fontSize: "18px",
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 style={{ fontSize: "36px", margin: "32px 0 16px" }}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ fontSize: "28px", margin: "28px 0 12px" }}>
                {children}
              </h2>
            ),
            p: ({ children }) => <p style={{ margin: "16px 0" }}>{children}</p>,
            ul: ({ children }) => (
              <ul style={{ margin: "16px 0", paddingLeft: "20px" }}>
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li style={{ margin: "8px 0" }}>{children}</li>
            ),
            strong: ({ children }) => (
              <strong style={{ fontWeight: 700 }}>{children}</strong>
            ),
            code({
              className,
              children,
              ...props
            }: {
              className?: string;
              children?: React.ReactNode;
            }) {
              const match = /language-(\w+)/.exec(className || "");

              if (match) {
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              }

              return (
                <code
                  style={{
                    background: "#222",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default PostPage;
