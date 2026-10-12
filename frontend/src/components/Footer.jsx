import { Link } from 'react-router-dom';

function Footer({ onReserveClick }) {
  return (
    <footer className="site-footer" style={{ borderTop: '2px solid var(--cream-dark)', marginTop: 40 }}>
      <div className="footer-grid">
        <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 60, height: 44, borderRadius: 8, background: 'transparent', overflow: 'hidden' }}>
              <img src="/logo.png" alt="The Moras Cafe Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div className="footer-brand-name">The Moras Cafe</div>
              <small style={{ color: 'var(--cream-dark)', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.7rem' }}>Cafe · Coffee · More</small>
            </div>
          </div>
          <p style={{ color: 'rgba(245, 230, 200, 0.75)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            A cozy café in Vijayapura where great food meets great memories. Come for the coffee, stay for the vibe.
          </p>
        </div>

        <div>
          <div className="footer-brand-name" style={{ marginBottom: 16, fontSize: '0.85rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Quick Links</div>
          <nav aria-label="Footer Navigation">
            <ul className="footer-links">
              <li><Link to="/" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.3px' }}>Home</Link></li>
              <li><Link to="/menu" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.3px' }}>Our Menu</Link></li>
              <li><Link to="/about" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.3px' }}>The Story</Link></li>
              <li><Link to="/reviews" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.3px' }}>Guest Reviews</Link></li>
              <li><Link to="/#location" style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.3px' }}>Find Us</Link></li>
              <li>
                <button 
                  onClick={onReserveClick} 
                  style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', letterSpacing: '0.3px' }}
                  aria-label="Book a table popup"
                >
                  Book a Table
                </button>
              </li>
              <li>
                <Link 
                  to="/admin" 
                  style={{ color: 'rgba(245,230,200,0.85)', textDecoration: 'none', fontSize: '0.9rem', letterSpacing: '0.3px' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245,230,200,0.85)'}
                  aria-label="Staff login portal"
                >
                  Staff Portal
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div>
          <div className="footer-brand-name" style={{ marginBottom: 16, fontSize: '0.85rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Cafe Info</div>
          <ul className="footer-info-list" style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <li style={{ fontSize: '0.88rem', color: 'rgba(245,230,200,0.85)' }}>
              <strong style={{ color: '#FAF5EF', display: 'block', marginBottom: 2 }}>Operating Hours:</strong>
              <div style={{ color: 'rgba(245,230,200,0.7)' }}>Open Daily · 10:00 AM – 10:30 PM</div>
            </li>
            <li style={{ fontSize: '0.88rem', color: 'rgba(245,230,200,0.85)' }}>
              <strong style={{ color: '#FAF5EF', display: 'block', marginBottom: 2 }}>Address:</strong>
              <div style={{ color: 'rgba(245,230,200,0.7)', lineHeight: 1.5 }}>B M Patil Circle, Ring Rd, Adarsh Nagar, Vijayapura, KA 586102</div>
            </li>
            <li style={{ fontSize: '0.88rem', color: 'rgba(245,230,200,0.85)' }}>
              <strong style={{ color: '#FAF5EF', display: 'block', marginBottom: 2 }}>Reservations &amp; Enquiries:</strong>
              <div style={{ marginTop: 2 }}>
                <a href="tel:+919945446137" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>+91 99454 46137</a>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: '0.85rem' }}>
          © {new Date().getFullYear()} The Moras Cafe. All rights reserved.
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <Link to="/privacy" style={{ color: 'rgba(245,230,200,0.7)', textDecoration: 'underline' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245,230,200,0.7)'}>Privacy Policy</Link>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <Link to="/terms" style={{ color: 'rgba(245,230,200,0.7)', textDecoration: 'underline' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fbbf24'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(245,230,200,0.7)'}>Terms of Service</Link>
          <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
          <span>Crafted with passion by <strong style={{ color: 'var(--cream)', fontWeight: 800 }}>Rakesh Desai</strong> (<a href="https://github.com/imrakeshdesai-art" target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>GitHub</a> · <a href="https://www.instagram.com/imrakeshdesai/" target="_blank" rel="noreferrer" style={{ color: '#fbbf24', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>Instagram</a>)</span>
        </div>
        <div className="social-links" style={{ display: 'flex', gap: 10 }}>
          <a href="https://www.instagram.com/brews_and_memories_/" target="_blank" rel="noreferrer" className="social-btn" aria-label="Instagram page" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '6px 12px', border: '1px solid rgba(245,230,200,0.2)', borderRadius: 20, color: 'var(--cream)', textDecoration: 'none' }}>Instagram</a>
          <a href="tel:+919945446137" className="social-btn" aria-label="Call Phone" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '6px 12px', border: '1px solid rgba(245,230,200,0.2)', borderRadius: 20, color: '#fbbf24', textDecoration: 'none' }}>Call Us</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
