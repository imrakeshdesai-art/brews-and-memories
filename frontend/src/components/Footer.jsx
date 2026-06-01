import { Link } from 'react-router-dom';

function Footer({ onReserveClick }) {
  return (
    <footer className="site-footer" style={{ borderTop: '2px solid var(--cream-dark)', marginTop: 40 }}>
      <div className="footer-grid">
        <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--cream)', overflow: 'hidden' }}>
              <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div className="footer-brand-name">Brews & Memories</div>
              <small style={{ color: 'var(--cream-dark)', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}>Café · Coffee · More</small>
            </div>
          </div>
          <p style={{ color: 'rgba(245, 230, 200, 0.75)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            A cozy café in Vijayapura where great food meets great memories. Come for the coffee, stay for the vibe.
          </p>
        </div>

        <div>
          <div className="footer-brand-name" style={{ marginBottom: 16, fontSize: '1rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1 }}>Quick Links</div>
          <nav aria-label="Footer Navigation">
            <ul className="footer-links">
              <li><Link to="/" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.88rem' }}>🏠 Home</Link></li>
              <li><Link to="/menu" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.88rem' }}>🍽 Menu</Link></li>
              <li><Link to="/about" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.88rem' }}>📖 About Us</Link></li>
              <li><Link to="/reviews" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.88rem' }}>⭐ Reviews</Link></li>
              <li><Link to="/contact" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.88rem' }}>📍 Contact</Link></li>
              <li>
                <button 
                  onClick={onReserveClick} 
                  style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.88rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                  aria-label="Book a table popup"
                >
                  📅 Book a Table
                </button>
              </li>
            </ul>
          </nav>
        </div>

        <div>
          <div className="footer-brand-name" style={{ marginBottom: 16, fontSize: '1rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1 }}>Cafe Info</div>
          <ul className="footer-info-list" style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ display: 'flex', gap: 8, fontSize: '0.88rem', color: 'rgba(245,230,200,0.85)' }}>
              <span>🕙</span>
              <div>
                <strong>Operating Hours:</strong>
                <div style={{ marginTop: 2, color: 'rgba(245,230,200,0.7)' }}>Open Daily: 10:00 AM – 10:30 PM</div>
              </div>
            </li>
            <li style={{ display: 'flex', gap: 8, fontSize: '0.88rem', color: 'rgba(245,230,200,0.85)' }}>
              <span>📍</span>
              <div>
                <strong>Address:</strong>
                <div style={{ marginTop: 2, color: 'rgba(245,230,200,0.7)' }}>B M Patil Circle, Ring Rd, Vijayapura, Karnataka 586102</div>
              </div>
            </li>
            <li style={{ display: 'flex', gap: 8, fontSize: '0.88rem', color: 'rgba(245,230,200,0.85)' }}>
              <span>📞</span>
              <div>
                <strong>Contact Phone:</strong>
                <div style={{ marginTop: 2 }}><a href="tel:+919945446137" style={{ color: '#fbbf24', textDecoration: 'none' }}>+91 99454 46137</a></div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom" style={{ flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Brews &amp; Memories. All rights reserved.
          </div>
          <div className="social-links">
            <a href="https://www.instagram.com/brews_and_memories_/" target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram page">📸</a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-btn" aria-label="Facebook page">👥</a>
            <a href="tel:+919945446137" className="social-btn" aria-label="Call Phone">📞</a>
          </div>
        </div>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <Link
            to="/admin"
            style={{
              color: 'rgba(245, 230, 200, 0.3)',
              fontSize: '0.7rem',
              textDecoration: 'none',
              letterSpacing: '0.5px',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(245, 230, 200, 0.6)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245, 230, 200, 0.3)'}
            aria-label="Staff login portal"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
