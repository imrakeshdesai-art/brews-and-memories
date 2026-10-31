import { Link } from 'react-router-dom';

function Footer({ onReserveClick }) {
  return (
    <footer className="site-footer" style={{ position: 'relative', overflow: 'hidden', background: '#0B2827', borderTop: '2px solid rgba(250, 245, 239, 0.1)', marginTop: 40, color: '#FAF5EF' }}>
      {/* Ambient Botanical Brand Watermark Motif */}
      <div className="brand-watermark-dark footer-watermark" aria-hidden="true" />

      <div className="footer-grid">
        {/* Brand Information */}
        <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.35)', background: '#FAF5EF' }}>
              <img 
                src="/images/brand/secondary-badge-light.png" 
                alt="The Moras Cafe Seal" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
              />
            </div>
            <div>
              <div className="footer-brand-name" style={{ color: '#FAF5EF', fontWeight: 800, fontSize: '1.25rem' }}>The Moras Cafe</div>
              <small style={{ color: '#FBBF24', letterSpacing: 1.2, textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 700 }}>Cafe · Coffee · Pure Veg</small>
            </div>
          </div>
          <p style={{ color: '#DDD6CA', fontSize: '0.92rem', lineHeight: 1.65, margin: 0, maxWidth: 320 }}>
            A neighborhood sanctuary in Vijayapura where artisan espresso, comfort food, and warm conversations come together.
          </p>
        </div>

        {/* Customer Navigation Links */}
        <div>
          <div className="footer-brand-name" style={{ marginBottom: 16, fontSize: '0.85rem', color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800 }}>
            Explore
          </div>
          <nav aria-label="Footer Navigation">
            <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li>
                <Link to="/" style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', letterSpacing: '0.3px', transition: 'color 0.2s' }}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', letterSpacing: '0.3px', transition: 'color 0.2s' }}>
                  Our Menu (50+ Items)
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', letterSpacing: '0.3px', transition: 'color 0.2s' }}>
                  The Story &amp; Philosophy
                </Link>
              </li>
              <li>
                <Link to="/reviews" style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', letterSpacing: '0.3px', transition: 'color 0.2s' }}>
                  Guest Reviews
                </Link>
              </li>
              <li>
                <Link to="/wallpapers" style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', letterSpacing: '0.3px', transition: 'color 0.2s' }}>
                  Brand Wallpapers (HD)
                </Link>
              </li>
              <li>
                <Link to="/#location" style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', letterSpacing: '0.3px', transition: 'color 0.2s' }}>
                  Find Location
                </Link>
              </li>
              <li>
                <button 
                  onClick={onReserveClick} 
                  style={{ color: '#E6DFD5', textDecoration: 'none', fontSize: '0.92rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', letterSpacing: '0.3px', transition: 'color 0.2s' }}
                  aria-label="Host Birthday Event popup"
                >
                  🎂 Host Birthday (₹199)
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Cafe Details */}
        <div>
          <div className="footer-brand-name" style={{ marginBottom: 16, fontSize: '0.85rem', color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800 }}>
            Cafe Info
          </div>
          <ul className="footer-info-list" style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <li style={{ fontSize: '0.92rem', color: '#DDD6CA' }}>
              <strong style={{ color: '#FAF5EF', display: 'block', marginBottom: 2 }}>Operating Hours:</strong>
              <div>Open Daily · 10:00 AM – 10:30 PM</div>
            </li>
            <li style={{ fontSize: '0.92rem', color: '#DDD6CA' }}>
              <strong style={{ color: '#FAF5EF', display: 'block', marginBottom: 2 }}>Address:</strong>
              <div style={{ lineHeight: 1.5 }}>B M Patil Circle, Ring Rd, Solapur Bypass, Vijayapura, KA 586102</div>
            </li>
            <li style={{ fontSize: '0.92rem', color: '#DDD6CA' }}>
              <strong style={{ color: '#FAF5EF', display: 'block', marginBottom: 2 }}>Reservations &amp; Enquiries:</strong>
              <div style={{ marginTop: 2 }}>
                <a href="tel:+919945446137" style={{ color: '#FBBF24', textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
                  +91 99454 46137
                </a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Utility & Credits */}
      <div className="footer-bottom" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid rgba(250, 245, 239, 0.08)', paddingTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, width: '100%' }}>
          <div style={{ fontSize: '0.86rem', color: '#E6DFD5' }}>
            © {new Date().getFullYear()} The Moras Cafe. All rights reserved.
            <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
            <Link to="/privacy" style={{ color: '#E6DFD5', textDecoration: 'underline' }}>Privacy Policy</Link>
            <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
            <Link to="/terms" style={{ color: '#E6DFD5', textDecoration: 'underline' }}>Terms of Service</Link>
            <span style={{ margin: '0 8px', opacity: 0.4 }}>|</span>
            <Link to="/admin" style={{ color: '#E6DFD5', textDecoration: 'none', opacity: 0.75 }}>Staff Portal</Link>
          </div>
          <div className="footer-action-pills" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a 
              href="https://www.instagram.com/themorascafe/" 
              target="_blank" 
              rel="noreferrer" 
              className="footer-pill-btn" 
              aria-label="Instagram page"
              style={{ color: '#FAF5EF', borderColor: 'rgba(250, 245, 239, 0.3)', background: 'rgba(250, 245, 239, 0.08)' }}
            >
              Instagram ↗
            </a>
            <a 
              href="tel:+919945446137" 
              className="footer-pill-btn gold" 
              aria-label="Call Phone"
              style={{ color: '#0F3D3E', background: '#FBBF24', borderColor: '#FBBF24', fontWeight: 800 }}
            >
              📞 Call Us
            </a>
          </div>
        </div>

        {/* Discreet developer attribution on secondary subline */}
        <div style={{ fontSize: '0.78rem', color: '#9E9689', textAlign: 'left' }}>
          Crafted with care by <strong>Rakesh Desai</strong> (<a href="https://github.com/imrakeshdesai-art" target="_blank" rel="noreferrer" style={{ color: '#BDB6A8', textDecoration: 'underline' }}>GitHub</a> · <a href="https://www.instagram.com/imrakeshdesai/" target="_blank" rel="noreferrer" style={{ color: '#BDB6A8', textDecoration: 'underline' }}>Instagram</a>)
        </div>
      </div>
    </footer>
  );
}

export default Footer;
