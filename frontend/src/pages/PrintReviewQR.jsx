import { useState } from 'react';
import { GOOGLE_REVIEW_CONFIG } from '../config/googleReview';
import useSEO from '../hooks/useSEO';

function PrintReviewQR() {
  useSEO({
    title: 'Print Google Review QR Standee - The Moras Cafe',
    description: 'Printable Google Review table standees and QR cards for The Moras Cafe.',
  });

  const [useSmartUrl, setUseSmartUrl] = useState(true);
  const [customUrl, setCustomUrl] = useState(
    GOOGLE_REVIEW_CONFIG.googleReviewDirectUrl || 'https://search.google.com/local/writereview?placeid='
  );

  const activeUrl = useSmartUrl
    ? GOOGLE_REVIEW_CONFIG.permanentRateUrl
    : (customUrl.trim() || GOOGLE_REVIEW_CONFIG.fallbackSearchUrl);

  const qrSrc = `https://quickchart.io/qr?text=${encodeURIComponent(activeUrl)}&size=700&dark=0f3d3e&ecLevel=H`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-review-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .print-review-page {
          background: #18191a;
          min-height: 100vh;
          padding: 40px 20px;
          color: #e4e6eb;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .no-print-controls {
          max-width: 900px;
          margin: 0 auto 36px;
          background: #242526;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #3a3b3c;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .controls-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid #3a3b3c;
          padding-bottom: 16px;
        }

        .controls-title {
          margin: 0;
          font-size: 1.3rem;
          color: #f5e6c8;
          font-family: 'Playfair Display', serif;
        }

        .btn-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-action {
          background: #0f3d3e;
          color: #faf5ef;
          border: 1px solid #2a6a6a;
          padding: 10px 18px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }

        .btn-action:hover {
          background: #175758;
          transform: translateY(-1px);
        }

        .btn-action.gold {
          background: #c3912d;
          border-color: #d8a846;
          color: #1a1a1a;
        }

        .btn-action.gold:hover {
          background: #d4a33e;
        }

        .url-options {
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-size: 0.9rem;
        }

        .radio-label {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .custom-input {
          width: 100%;
          background: #18191a;
          border: 1px solid #3a3b3c;
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          margin-top: 6px;
        }

        /* ── STAND-EE CARD STYLING ──────────────────────────── */
        .standee-container {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .standee-card {
          width: 380px;
          background: #FAF5EF;
          border-radius: 12px;
          padding: 32px 24px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
          border: 4px solid #0f3d3e;
          position: relative;
          color: #0f3d3e;
          text-align: center;
          box-sizing: border-box;
        }

        .standee-inner-border {
          border: 2px solid #c3912d;
          border-radius: 8px;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .card-brand {
          font-family: 'Playfair Display', serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f3d3e;
          letter-spacing: 1px;
          margin: 0;
        }

        .card-kicker {
          font-size: 0.65rem;
          letter-spacing: 2.5px;
          color: #b45309;
          text-transform: uppercase;
          margin: 4px 0 16px;
          font-weight: 700;
        }

        .card-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.35rem;
          font-weight: 700;
          margin: 0 0 8px;
          color: #0f3d3e;
        }

        .card-stars {
          color: #c3912d;
          font-size: 1.6rem;
          letter-spacing: 4px;
          line-height: 1;
          margin-bottom: 8px;
        }

        .card-instruction {
          font-size: 0.82rem;
          color: #666;
          margin: 0 0 16px;
        }

        .qr-frame {
          background: #ffffff;
          padding: 12px;
          border-radius: 14px;
          border: 2px solid #e8e2d2;
          box-shadow: 0 6px 18px rgba(15, 61, 62, 0.06);
          margin-bottom: 16px;
          display: inline-block;
        }

        .qr-img {
          width: 200px;
          height: 200px;
          display: block;
        }

        .card-scan-cta {
          font-family: 'Playfair Display', serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f3d3e;
          margin: 0 0 4px;
        }

        .card-scan-sub {
          font-size: 0.72rem;
          color: #777;
          margin: 0 0 14px;
          max-width: 240px;
          line-height: 1.4;
        }

        .card-badge {
          background: #0f3d3e;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 14px;
        }

        .card-footer {
          font-size: 0.68rem;
          color: #888;
          line-height: 1.4;
          border-top: 1px solid #e8e2d2;
          padding-top: 10px;
          width: 100%;
        }

        /* ── PRINT MEDIA RULES ──────────────────────────────── */
        @media print {
          body, html {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print-controls, nav, footer, .floating-actions-mobile {
            display: none !important;
          }
          .print-review-page {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .standee-container {
            display: block !important;
            page-break-after: avoid;
          }
          .standee-card {
            box-shadow: none !important;
            margin: 20px auto !important;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* ADMIN CONTROLS HEADER */}
      <div className="no-print-controls">
        <div className="controls-header">
          <div>
            <h1 className="controls-title">Google Review QR Code & Standee Generator</h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#aaa' }}>
              The Moras Cafe &middot; Table-Top & Counter Review Cards
            </p>
          </div>
          <div className="btn-group">
            <button type="button" onClick={handlePrint} className="btn-action gold">
              🖨️ Print Standee Cards
            </button>
            <a href="/the-moras-cafe-review-standee.png" download className="btn-action">
              📥 Download Standee (PNG)
            </a>
            <a href="/google-review-qr.svg" download className="btn-action">
              📥 Vector QR (SVG)
            </a>
            <a href="/google-review-qr.png" download className="btn-action">
              📥 High-Res QR (PNG)
            </a>
          </div>
        </div>

        <div className="url-options">
          <label className="radio-label">
            <input
              type="radio"
              name="urlMode"
              checked={useSmartUrl}
              onChange={() => setUseSmartUrl(true)}
            />
            <div>
              <strong>Option 1: Smart Forwarder URL (Recommended)</strong>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>
                Encodes <code>{GOOGLE_REVIEW_CONFIG.permanentRateUrl}</code>. This QR never expires. If you ever change your Google Business link, simply update it in configuration without reprinting table cards!
              </div>
            </div>
          </label>

          <label className="radio-label">
            <input
              type="radio"
              name="urlMode"
              checked={!useSmartUrl}
              onChange={() => setUseSmartUrl(false)}
            />
            <div style={{ flex: 1 }}>
              <strong>Option 2: Direct Google Link / Place ID</strong>
              <div style={{ color: '#aaa', fontSize: '0.8rem', marginTop: 2 }}>
                Directly opens Google's 5-star review modal:
              </div>
              {!useSmartUrl && (
                <input
                  type="text"
                  className="custom-input"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Paste your https://g.page/r/.../review or Place ID link"
                />
              )}
            </div>
          </label>
        </div>
      </div>

      {/* STANDEE CARD PREVIEW */}
      <div className="standee-container">
        <div className="standee-card">
          <div className="standee-inner-border">
            <h2 className="card-brand">THE MORAS CAFE</h2>
            <div className="card-kicker">— ARTISAN BREWS & MEMORIES —</div>

            <div className="card-heading">Loved Your Experience?</div>
            <div className="card-stars">★★★★★</div>
            <div className="card-instruction">Scan to leave a 5-star review on Google</div>

            <div className="qr-frame">
              <img
                src={qrSrc}
                alt="Scan to review on Google"
                className="qr-img"
              />
            </div>

            <div className="card-scan-cta">Point phone camera to scan</div>
            <div className="card-scan-sub">
              Takes 10 seconds and directly helps our local kitchen &amp; barista team!
            </div>

            <div className="card-badge">
              <span>Rated 4.8★ by Our Guests</span>
            </div>

            <div className="card-footer">
              B.M. Patil Circle, Ring Road, Vijayapura<br />
              themorascafe.in &middot; @themorascafe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrintReviewQR;
