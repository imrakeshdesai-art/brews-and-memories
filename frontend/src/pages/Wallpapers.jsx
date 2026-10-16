import { useState, useEffect, useCallback, useMemo } from 'react';
import useSEO from '../hooks/useSEO';
import { wallpapers, wallpaperEditions } from '../data/wallpapers';

export default function Wallpapers() {
  useSEO({
    title: 'Brand Wallpapers',
    description: 'Download official high-resolution smartphone brand wallpapers from The Moras Cafe. Featuring botanical coffee artwork, heritage tapestries, and signature emblems.',
  });

  const [selectedEdition, setSelectedEdition] = useState('All');
  const [activeModalWallpaper, setActiveModalWallpaper] = useState(null);

  const filteredWallpapers = useMemo(() => {
    if (selectedEdition === 'All') return wallpapers;
    return wallpapers.filter((w) => w.edition === selectedEdition);
  }, [selectedEdition]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModalWallpaper) {
        setActiveModalWallpaper(null);
      }
    };

    if (activeModalWallpaper) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeModalWallpaper]);

  // Robust download handler
  const handleDownload = useCallback((e, wallpaper) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const link = document.createElement('a');
    link.href = wallpaper.downloadUrl;
    link.download = wallpaper.downloadFilename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="wallpapers-page">
      {/* Hero Header */}
      <section className="wallpapers-hero">
        <div className="wallpapers-hero-container">
          <span className="wallpapers-tag">Official Café Collection</span>
          <h1 className="wallpapers-title">Brand Wallpapers</h1>
          <p className="wallpapers-subtitle">
            Curated smartphone wallpapers capturing the botanical heritage, warm espresso tones,
            and timeless atmosphere of The Moras Cafe. Designed specifically for vertical mobile screens.
          </p>

          <div className="wallpapers-stats-bar">
            <div className="stat-pill">
              <span className="stat-num">{wallpapers.length}</span> Exclusive Designs
            </div>
            <div className="stat-pill">
              <span className="stat-num">9:16</span> Mobile Resolution
            </div>
            <div className="stat-pill">
              <span className="stat-num">Ultra HD</span> Pristine Original Assets
            </div>
            <div className="stat-pill">
              <span className="stat-num">₹0</span> 100% Free Download
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="wallpapers-content-section">
        <div className="wallpapers-content-container">
          {/* Edition Filter Tabs */}
          <div className="wallpapers-filter-nav" role="tablist" aria-label="Filter wallpapers by edition">
            {wallpaperEditions.map((edition) => {
              const count = edition === 'All' 
                ? wallpapers.length 
                : wallpapers.filter((w) => w.edition === edition).length;
              const isActive = selectedEdition === edition;

              return (
                <button
                  key={edition}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`wallpaper-filter-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedEdition(edition)}
                >
                  <span>{edition}</span>
                  <span className="filter-count">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Wallpapers Responsive Grid */}
          <div className="wallpapers-grid" role="region" aria-label="Wallpapers collection">
            {filteredWallpapers.map((wallpaper) => (
              <article key={wallpaper.id} className="wallpaper-card">
                <div 
                  className="wallpaper-media-wrapper"
                  style={{ backgroundColor: wallpaper.dominantColor || '#0B2827' }}
                  onClick={() => setActiveModalWallpaper(wallpaper)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${wallpaper.title} full size`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveModalWallpaper(wallpaper);
                    }
                  }}
                >
                  <img
                    src={wallpaper.previewUrl}
                    alt={wallpaper.title}
                    loading="lazy"
                    className="wallpaper-preview-img"
                    width={wallpaper.width}
                    height={wallpaper.height}
                  />

                  {/* Badges on image */}
                  <div className="card-top-badges">
                    <span className="card-edition-badge">{wallpaper.edition}</span>
                    <span className="card-dim-badge">{wallpaper.width} × {wallpaper.height}</span>
                  </div>

                  {/* Hover Quick Action Overlay */}
                  <div className="card-hover-overlay">
                    <span className="overlay-view-hint">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                      </svg>
                      View Full Size
                    </span>
                  </div>
                </div>

                {/* Card Details & Actions */}
                <div className="wallpaper-card-info">
                  <h2 className="wallpaper-card-title">{wallpaper.title}</h2>
                  <p className="wallpaper-card-desc">{wallpaper.description}</p>
                  
                  <div className="wallpaper-card-meta">
                    <span className="meta-size-tag">PNG • {wallpaper.sizeFormatted}</span>
                  </div>

                  <div className="wallpaper-card-actions">
                    <button
                      type="button"
                      className="btn-wallpaper-view"
                      onClick={() => setActiveModalWallpaper(wallpaper)}
                      aria-label={`View ${wallpaper.title} full size`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      className="btn-wallpaper-download"
                      onClick={(e) => handleDownload(e, wallpaper)}
                      aria-label={`Download ${wallpaper.title} wallpaper`}
                      title="Download Original HD Wallpaper"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Full-Screen Lightbox Modal */}
      {activeModalWallpaper && (
        <div 
          className="wallpaper-modal-backdrop"
          onClick={() => setActiveModalWallpaper(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${activeModalWallpaper.title} full view`}
        >
          <div 
            className="wallpaper-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              type="button"
              className="wallpaper-modal-close"
              onClick={() => setActiveModalWallpaper(null)}
              aria-label="Close full size view (Esc)"
              title="Close (Esc)"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Modal Body */}
            <div className="wallpaper-modal-body">
              {/* Full Image Preview */}
              <div 
                className="wallpaper-modal-stage"
                style={{ backgroundColor: activeModalWallpaper.dominantColor || '#0B2827' }}
              >
                <img
                  src={activeModalWallpaper.fullUrl}
                  alt={activeModalWallpaper.title}
                  className="wallpaper-modal-img"
                  onError={(e) => {
                    if (e.target.src !== activeModalWallpaper.previewUrl) {
                      e.target.src = activeModalWallpaper.previewUrl;
                    }
                  }}
                />
              </div>

              {/* Modal Details Panel */}
              <div className="wallpaper-modal-sidebar">
                <div className="modal-header-section">
                  <span className="modal-edition-badge">{activeModalWallpaper.edition}</span>
                  <h3 className="modal-wallpaper-title">{activeModalWallpaper.title}</h3>
                  <p className="modal-wallpaper-desc">{activeModalWallpaper.description}</p>
                </div>

                <div className="modal-specs-list">
                  <div className="spec-row">
                    <span className="spec-label">Resolution</span>
                    <span className="spec-val">{activeModalWallpaper.width} × {activeModalWallpaper.height} px</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Aspect Ratio</span>
                    <span className="spec-val">{activeModalWallpaper.aspectRatio} (Portrait)</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Format &amp; Size</span>
                    <span className="spec-val">Original PNG ({activeModalWallpaper.sizeFormatted})</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-label">Best For</span>
                    <span className="spec-val">iPhone, Samsung &amp; Android Lockscreen</span>
                  </div>
                </div>

                <div className="modal-download-section">
                  <button
                    type="button"
                    className="modal-download-primary-btn"
                    onClick={(e) => handleDownload(e, activeModalWallpaper)}
                    aria-label={`Download original ${activeModalWallpaper.title} wallpaper`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Download Wallpaper</span>
                  </button>
                  <span className="download-footnote">
                    Free for personal use • Saved as <code>{activeModalWallpaper.downloadFilename}</code>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
