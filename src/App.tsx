import { useEffect, useState } from "react";
import "./App.css";
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

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch posts:", error);
      } else {
        setPosts(data || []);
      }

      setLoading(false);
    };

    fetchPosts();
  }, []);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      <h1>All we need is PLAY!</h1>
      <p>PlayXeld Blog</p>

      {loading && <p>Loading...</p>}

      {!loading && posts.length === 0 && <p>No posts yet.</p>}

      {!loading &&
        posts.map((post) => (
          <article
            key={post.id}
            style={{
              padding: "24px 0",
              borderBottom: "1px solid #ddd",
            }}
          >
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <small>{new Date(post.published_at).toLocaleDateString()}</small>
            <div style={{ marginTop: "12px" }}>{post.content}</div>
          </article>
        ))}
    </div>
  );
}

export default App;
