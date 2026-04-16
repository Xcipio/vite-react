import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedArtworks } from "../lib/artworks";
import { getArtworkTags, getTagStyle, sortTags } from "../lib/tags";
import { Artwork } from "../types/artwork";

const artworkTagDescriptions: Record<string, string> = {
  涂鸦: "这里收拢的是带有「涂鸦」标签的图片作品，偏手写感、即兴感和视觉实验。",
};

function ArtworkTagPage() {
  const { tagName = "" } = useParams();
  const decodedTag = decodeURIComponent(tagName);
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

  const filteredArtworks = useMemo(
    () => artworks.filter((artwork) => getArtworkTags(artwork).includes(decodedTag)),
    [artworks, decodedTag],
  );

  const siblingTags = useMemo(
    () =>
      sortTags([
        ...new Set(
          artworks
            .filter((artwork) => getArtworkTags(artwork).includes(decodedTag))
            .flatMap((artwork) => getArtworkTags(artwork)),
        ),
      ]),
    [artworks, decodedTag],
  );

  const tagDescription =
    artworkTagDescriptions[decodedTag] ??
    `这里收拢的是所有带有「${decodedTag}」标签的图片作品。`;

  return (
    <div className="page art-page">
      <section className="section art-page-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/">← Back to home</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className="art-page-hero art-tag-hero">
          <p className="section-label">ART TAG</p>
          <h1 className="art-page-title">{decodedTag}</h1>
          <p className="art-page-subtitle">{tagDescription}</p>
          <p className="tag-page-subtitle">
            这里汇总了所有带有这个标签的图片作品。当前共 {filteredArtworks.length} 件。
          </p>

          {siblingTags.length > 0 && (
            <div className="tag-page-tag-row">
              {siblingTags.map((tag) => (
                <Link
                  key={tag}
                  className={`hero-tag-button ${tag === decodedTag ? "active" : ""}`}
                  style={getTagStyle(tag, theme)}
                  to={`/art/tag/${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredArtworks.length === 0 ? (
          <p className="tag-page-empty">这个标签下暂时还没有图片作品。</p>
        ) : (
          <div className="art-grid">
            {filteredArtworks.map((artwork) => (
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

export default ArtworkTagPage;
