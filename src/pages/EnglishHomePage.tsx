import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedArtworks } from "../lib/artworks";
import { fetchPublishedPosts } from "../lib/posts";
import { Artwork } from "../types/artwork";
import { Post } from "../types/post";

function EnglishHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loadHomeData = async () => {
      const [
        { data: postData, error: postError },
        { data: artworkData, error: artworkError },
      ] = await Promise.all([
        fetchPublishedPosts("en"),
        fetchPublishedArtworks(),
      ]);

      if (postError) {
        console.error(postError);
      } else {
        setPosts(postData ?? []);
      }

      if (artworkError) {
        console.error(artworkError);
      } else {
        setArtworks(artworkData ?? []);
      }

      setLoading(false);
    };

    loadHomeData();
  }, []);

  const latestPost = posts[0] ?? null;
  const remainingPosts = latestPost ? posts.slice(1, 7) : posts.slice(0, 6);
  const featuredArtworks = artworks.slice(0, 3);
  const heroLeadText = "All we need is";

  return (
    <div className="page">
      <header className="hero english-home">
        <div className="hero-top">
          <div className="hero-brand" aria-label="Playxeld">
            {"PLAYXELD".split("").map((letter, index) => (
              <span key={`${letter}-${index}`} className="hero-brand-letter">
                {letter}
              </span>
            ))}
          </div>

          <nav className="hero-nav">
            <a href="#essays">Essays</a>
            <Link to="/art">Arts</Link>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <Link to="/">中文</Link>
            <ThemeToggle theme={theme} onToggle={toggleTheme} locale="en" />
          </nav>
        </div>

        <div className="hero-grid">
          <div className="hero-main">
            <p className="hero-kicker">ESSAYS / SYSTEMS / PLAY</p>
            <h1 className="hero-title english-home-title">
              <span className="hero-title-wave english-home-wave" aria-label={heroLeadText}>
                {heroLeadText.split("").map((character, index) => (
                  <span
                    key={`${character}-${index}`}
                    className={
                      character === " "
                        ? "hero-title-wave-space"
                        : "hero-title-wave-letter"
                    }
                    aria-hidden="true"
                  >
                    {character === " " ? "\u00A0" : character}
                  </span>
                ))}
              </span>
              <span className="hero-play-group english-home-play" aria-label="PLAY !">
                <span className="hero-play-gap" aria-hidden="true">
                  {" "}
                </span>
                <span className="play-word english-home-play-word" aria-label="PLAY">
                  <span className="p play-letter">P</span>
                  <span className="l play-letter">L</span>
                  <span className="a play-letter">A</span>
                  <span className="y play-letter">Y</span>
                </span>{" "}
                <span className="hero-exclamation play-letter play-letter-exclamation english-home-exclamation">
                  !
                </span>
              </span>
            </h1>
            <p className="hero-subtitle">
              A reading space for essays on games, stories, language, and the
              structures that shape how we think.
            </p>
            <p className="hero-subtitle">
              I am interested in writing that stays alive after reading:
              reflective, structured, and open enough to be mentally played with.
            </p>
          </div>

          <aside className="hero-side english-home-side">
            <p className="hero-side-label">Now</p>
            <h2 className="hero-side-title english-home-side-title">
              <span className="hero-title-gradient">Literary Maze</span>
              <span className="hero-title-rest"> now updating </span>
              <span className="hero-title-dots" aria-hidden="true">
                <span className="hero-title-dot hero-title-dot-one">.</span>
                <span className="hero-title-dot hero-title-dot-two">.</span>
                <span className="hero-title-dot hero-title-dot-three">.</span>
              </span>
            </h2>
            <p className="hero-side-text">📚 🎬 🎷 🎴 🏙️ 💡 → 🤹 🎮</p>
            <p className="hero-side-text">
              I am trying to bring together long-form essays, experimental
              notes, and thought models that feel playable.
            </p>
            <p className="hero-side-text">
              So thinking stops being only static reading, and becomes a more
              interactive mental practice, closer to how a game is played.
            </p>
            <div className="hero-side-card english-home-side-card">
              <p className="hero-side-card-label hero-side-card-title">
                Language Switch
              </p>
              <p className="hero-side-card-text">
                If an article exists in both versions, you can switch languages
                directly from the article page.
              </p>
            </div>
          </aside>
        </div>
      </header>

      <section className="section latest-release-section">
        <div className="section-header">
          <div className="latest-release-heading">
            <h2 className="section-title english-home-section-title english-home-section-title-primary">
              Latest Essay
            </h2>
            {latestPost && (
              <div className="section-meta latest-release-date-badge">
                {new Date(latestPost.published_at).toLocaleDateString("en-US")}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : latestPost ? (
          <article className="latest-release-card">
            <div className="latest-release-copy">
              <p className="latest-release-label">Latest Release</p>
              <h3 className="latest-release-title">
                <Link to={`/en/post/${latestPost.slug}`}>{latestPost.title}</Link>
              </h3>
              <p className="latest-release-excerpt">{latestPost.excerpt}</p>
              <div className="latest-release-actions">
                <Link
                  to={`/en/post/${latestPost.slug}`}
                  className="post-link latest-release-link"
                >
                  Read the essay →
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <p>No published English essays yet.</p>
        )}
      </section>

      {featuredArtworks.length > 0 && (
        <section className="section home-art-section">
          <div className="section-header">
            <h2 className="section-title english-home-section-title english-home-section-title-secondary">
              Gallery
            </h2>
            <div className="section-meta">
              <Link to="/art">Enter Arts →</Link>
            </div>
          </div>

          <div className="art-grid">
            {featuredArtworks.map((artwork) => (
              <article key={artwork.id} className="art-card">
                <Link to={`/art/${artwork.slug}`} className="art-card-image-link">
                  <img
                    className="art-card-image"
                    src={artwork.cover_image_url}
                    alt={artwork.title}
                    loading="lazy"
                  />
                </Link>

                <div className="art-card-body">
                  <div className="art-card-meta">
                    {artwork.year && <span>{artwork.year}</span>}
                    {artwork.medium && <span>{artwork.medium}</span>}
                    {artwork.series && <span>{artwork.series}</span>}
                  </div>

                  <h2 className="art-card-title">
                    <Link to={`/art/${artwork.slug}`}>{artwork.title}</Link>
                  </h2>

                  {artwork.subtitle && (
                    <p className="art-card-subtitle">{artwork.subtitle}</p>
                  )}

                  <Link
                    to={`/art/${artwork.slug}`}
                    className="post-link art-card-link"
                  >
                    View artwork →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="essays" className="section posts-section">
        <div className="section-header">
          <h2 className="section-title english-home-section-title english-home-section-title-tertiary">
            Recent Essays
          </h2>
          <div className="section-meta">{posts.length} essays</div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : remainingPosts.length > 0 ? (
          <div className="posts-grid">
            {remainingPosts.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-meta">
                  {new Date(post.published_at).toLocaleDateString("en-US")}
                </div>

                <h3 className="post-title">
                  <Link to={`/en/post/${post.slug}`}>{post.title}</Link>
                </h3>

                <p className="post-excerpt">{post.excerpt}</p>

                <Link to={`/en/post/${post.slug}`} className="post-link">
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p>No additional English essays yet.</p>
        )}
      </section>

      <section id="about" className="section">
        <p className="section-label">ABOUT</p>
        <h2 className="section-title english-home-section-title english-home-section-title-quaternary">
          Intent
        </h2>
        <p className="section-text">
          Playxeld is where I test ideas in public. I write about games, story
          structures, literary figures, historical imagination, and the kinds of
          systems that sharpen perception.
        </p>
        <p className="section-text">
          The goal is not only to archive thoughts, but to turn scattered
          intuitions into forms that can be read, questioned, and played with.
          The English side of the site will stay selective rather than exhaustive.
        </p>
      </section>

      <section id="contact" className="section contact-section">
        <div className="contact-panel">
          <div className="contact-copy">
            <p className="section-label">CONTACT</p>
            <h2 className="section-title contact-title english-home-section-title english-home-section-title-quinary">
              Write to me
            </h2>
            <p className="section-text contact-text">
              If you want to talk about games, writing, image-making, or simply
              share an interesting idea, feel free to leave a comment or send an
              email.
            </p>
          </div>

          <div className="contact-card">
            <p className="contact-card-label">Email</p>
            <a
              className="contact-email"
              href="mailto:playxeld@gmail.com"
              aria-label="Send email to playxeld@gmail.com"
            >
              playxeld@gmail.com
            </a>
            <p className="contact-card-text">All we need is PLAY</p>
            <a
              className="contact-action"
              href="mailto:playxeld@gmail.com"
              aria-label="Write an email to playxeld@gmail.com"
            >
              ✏️ Write to me
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default EnglishHomePage;
