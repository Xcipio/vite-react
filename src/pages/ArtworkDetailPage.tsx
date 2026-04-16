import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../hooks/useTheme";
import { fetchPublishedArtworkBySlug } from "../lib/artworks";
import { Artwork } from "../types/artwork";

function ArtworkDetailPage() {
  const { slug } = useParams();
  const { theme, toggleTheme } = useTheme();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtwork = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      const { data, error } = await fetchPublishedArtworkBySlug(slug);

      if (error) {
        console.error("Failed to fetch artwork:", error);
      } else {
        setArtwork(data);
      }

      setLoading(false);
    };

    loadArtwork();
  }, [slug]);

  if (loading) {
    return (
      <div className="page art-page">
        <section className="section art-detail-section">
          <p>Loading...</p>
        </section>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="page art-page">
        <section className="section art-detail-section">
          <div className="tag-page-topbar">
            <p className="tag-page-back">
              <Link to="/art">← Back to art</Link>
            </p>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
          <p>Artwork not found.</p>
        </section>
      </div>
    );
  }

  const galleryImages = artwork.image_urls?.length
    ? artwork.image_urls
    : [artwork.cover_image_url];
  const [leadImage, ...detailImages] = galleryImages;

  return (
    <div className="page art-page">
      <section className="section art-detail-section">
        <div className="tag-page-topbar">
          <p className="tag-page-back">
            <Link to="/art">← Back to art</Link>
          </p>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className="art-detail-hero">
          <p className="section-label">ARTWORK</p>
          <h1 className="art-detail-title">{artwork.title}</h1>
          {artwork.subtitle && (
            <p className="art-detail-subtitle">{artwork.subtitle}</p>
          )}
        </div>

        <div className="art-detail-layout">
          <div className="art-detail-main">
            <figure className="art-lead-figure">
              <img
                className="art-lead-image"
                src={leadImage}
                alt={artwork.title}
                loading="lazy"
              />
            </figure>

            {detailImages.length > 0 && (
              <div className="art-gallery art-gallery-secondary">
                {detailImages.map((imageUrl, index) => (
                  <figure key={`${imageUrl}-${index}`} className="art-gallery-item">
                    <img
                      className="art-gallery-image"
                      src={imageUrl}
                      alt={`${artwork.title} ${index + 2}`}
                      loading="lazy"
                    />
                  </figure>
                ))}
              </div>
            )}
          </div>

          <aside className="art-detail-sidebar">
            <p className="art-detail-sidebar-label">作品说明</p>
            {artwork.description ? (
              <p className="art-detail-description">{artwork.description}</p>
            ) : (
              <p className="art-detail-description">
                这件作品目前还没有补充说明，后续会继续完善创作背景与过程记录。
              </p>
            )}

            {(artwork.year || artwork.medium || artwork.series) && (
              <dl className="art-detail-facts">
                {artwork.year && (
                  <>
                    <dt>年份</dt>
                    <dd>{artwork.year}</dd>
                  </>
                )}
                {artwork.medium && (
                  <>
                    <dt>媒介</dt>
                    <dd>{artwork.medium}</dd>
                  </>
                )}
                {artwork.series && (
                  <>
                    <dt>系列</dt>
                    <dd>{artwork.series}</dd>
                  </>
                )}
              </dl>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

export default ArtworkDetailPage;
