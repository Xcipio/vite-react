import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import "./App.css";
import { supabase } from "./lib/supabase";
import PostPage from "./PostPage";

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  published_at: string;
  is_published: boolean;
};

function HomePage() {
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
    <div className="page">
      <header className="hero">
        <div className="hero-top">
          <div className="hero-brand">Playxeld</div>
          <nav className="hero-nav">
            <a href="#posts">Posts</a>
            <a href="#about">About</a>
          </nav>
        </div>

        <div className="hero-body hero-grid">
          <div className="hero-main">
            <p className="hero-kicker">WRITER / GAME CREATOR / PLAYER</p>

            <h1 className="hero-title">All we need is PLAY!</h1>

            <p className="hero-subtitle">
              A space for writing about systems, cities, stories, language, and
              the strange pleasure of treating life as something to be explored
              rather than merely endured.
            </p>

            <div className="hero-actions">
              <a className="hero-button hero-button-primary" href="#posts">
                Read posts
              </a>
              <a className="hero-button hero-button-secondary" href="#about">
                About this site
              </a>
            </div>
          </div>

          <aside className="hero-side">
            <p className="hero-side-label">Now</p>

            <h2 className="hero-side-title">What this site is becoming</h2>

            <p className="hero-side-text">
              Not just a blog, but a small publishing system for essays, notes,
              experiments, and playable ways of thinking.
            </p>

            <div className="hero-side-card">
              <p className="hero-side-card-label">Current focus</p>
              <p className="hero-side-card-text">
                Writing about play, systems, cities, stories, and the structure
                of attention.
              </p>
            </div>
          </aside>
        </div>
      </header>

      <section id="about" className="section">
        <p className="section-label">About</p>
        <h2 className="section-title">What this site is for</h2>

        <p className="section-text">
          Playxeld is my personal publishing space. I use it to write essays,
          notes, and fragments about design, games, books, films, cities, and
          whatever else sharpens attention.
        </p>

        <p className="section-text">
          The point is not just to archive thoughts. It is to test them in
          public, shape them into something readable, and gradually build a body
          of work.
        </p>
      </section>

      <section id="posts" className="section">
        <div className="section-header">
          <h2 className="section-title">Recent writing</h2>
          <span className="section-meta">
            {!loading ? `${posts.length} posts` : ""}
          </span>
        </div>

        {loading && <p className="state-text">Loading...</p>}

        {!loading && posts.length === 0 && (
          <p className="state-text">No posts yet.</p>
        )}

        {!loading && posts.length > 0 && (
          <div className="posts-grid">
            {posts.map((post, index) => (
              <article
                key={post.id}
                className={
                  index === 0 ? "post-card post-card-featured" : "post-card"
                }
              >
                <div className="post-meta">
                  {new Date(post.published_at).toLocaleDateString()}
                </div>

                <h3 className="post-title">
                  <Link to={`/post/${post.slug}`}>{post.title}</Link>
                </h3>

                <p className="post-excerpt">
                  {post.excerpt || "No excerpt yet."}
                </p>

                <Link className="post-link" to={`/post/${post.slug}`}>
                  Read article →
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/post/:slug" element={<PostPage />} />
    </Routes>
  );
}

export default App;
