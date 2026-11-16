import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';
import Breadcrumbs from '../components/Breadcrumbs';

function NotFound() {
  useSEO({
    title: '404 - Page Not Found',
    description: 'The page you requested could not be found at The Moras Cafe. Browse our coffee, food menu, or return to our homepage.',
    canonical: 'https://themorascafe.in/404',
  });

  return (
    <div className="not-found-page" style={{ minHeight: '80vh', padding: '120px 20px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ maxWidth: 640, width: '100%', margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: '404 Not Found' }]} />

        <div style={{
          background: 'var(--white, #ffffff)',
          border: '1.5px solid var(--cream-dark, #e8e2d2)',
          borderRadius: 24,
          padding: '48px 28px',
          boxShadow: 'var(--shadow-lg, 0 12px 36px rgba(0,0,0,0.08))',
          marginTop: 20
        }}>
          <div style={{ fontSize: '4.5rem', marginBottom: 12, lineHeight: 1 }} aria-hidden="true">
            ☕💨
          </div>

          <span style={{
            display: 'inline-block',
            background: 'var(--cream-light, #faf8f5)',
            color: 'var(--green, #0F3D3E)',
            border: '1px solid var(--cream-dark, #e8e2d2)',
            padding: '4px 14px',
            borderRadius: 20,
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 16
          }}>
            Error 404 &bull; Missing Page
          </span>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 5vw, 2.8rem)',
            color: 'var(--green, #0F3D3E)',
            margin: '0 0 14px',
            lineHeight: 1.2
          }}>
            This Cup Is Empty!
          </h1>

          <p style={{
            color: 'var(--text-light, #666666)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            maxWidth: 480,
            margin: '0 auto 32px'
          }}>
            The page you are looking for has either drifted away like fresh coffee steam, been renamed, or never existed in our cafe catalog.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/"
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}
            >
              <span>🏠</span>
              <span>Back to Home</span>
            </Link>

            <Link
              to="/menu"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}
            >
              <span>📜</span>
              <span>Browse Menu</span>
            </Link>

            <Link
              to="/reserve"
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                fontSize: '0.95rem',
                textDecoration: 'none'
              }}
            >
              <span>🎂</span>
              <span>Birthday Event (₹199)</span>
            </Link>
          </div>

          <div style={{ marginTop: 36, paddingTop: 24, borderTop: '1px dashed var(--cream-dark, #e8e2d2)', fontSize: '0.85rem', color: 'var(--text-light, #777)' }}>
            Need immediate help or hosting an event? WhatsApp our host desk at{' '}
            <a href="https://wa.me/919945446137" style={{ color: 'var(--green, #0F3D3E)', fontWeight: 800, textDecoration: 'underline' }}>
              +91 99454 46137
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
