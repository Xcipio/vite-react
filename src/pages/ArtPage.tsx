import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedArtworks } from "../lib/artworks";
import { Artwork } from "../types/artwork";

function ArtPage() {
  const { theme, toggleTheme } = useTheme();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtworks = async () => {
      const { data, error } = await fetchPublishedArtworks();

      if (error) {
        console.error("Failed to fetch artworks:", error);
      } else {
        setArtworks(data ?? []);
      }

      setLoading(false);
    };

    loadArtworks();
  }, []);

  return (
    <div className="page art-page">
      <section className="section art-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/">← Back to home</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className="art-page-hero">
          <p className="section-label">ART</p>
          <h1 className="art-page-title">图片创作</h1>
          <p className="art-page-subtitle">
            这里收录我目前公开发布的图片作品，包括单幅创作、系列图像和实验性视觉项目。
          </p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : artworks.length === 0 ? (
          <p className="tag-page-empty">这里还没有已发布的图片作品。</p>
        ) : (
          <div className="art-grid">
            {artworks.map((artwork, index) => (
              <article
                key={artwork.id}
                className={`art-card ${index < 3 ? `art-card-pinned art-card-pinned-${index + 1}` : ""}`}
              >
                <Link to={`/art/${artwork.slug}`} className="art-card-image-link">
                  {index < 3 && (
                    <span className="art-card-pin-badge" aria-label="Pinned artwork">
                      <span className="art-card-pin-head" aria-hidden="true" />
                      <span className="art-card-pin-needle" aria-hidden="true" />
                    </span>
                  )}
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

                  <Link to={`/art/${artwork.slug}`} className="post-link art-card-link">
                    查看作品 →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ArtPage;
