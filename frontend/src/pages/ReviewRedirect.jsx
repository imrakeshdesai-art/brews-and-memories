import { useEffect } from 'react';
import { getEffectiveReviewUrl } from '../config/googleReview';
import useSEO from '../hooks/useSEO';

function ReviewRedirect() {
  useSEO({
    title: 'Rate Us on Google - The Moras Cafe',
    description: 'Leave a 5-star review for The Moras Cafe on Google.',
  });

  const reviewUrl = getEffectiveReviewUrl();

  useEffect(() => {
    // Immediate redirect to Google Reviews
    const timer = setTimeout(() => {
      window.location.replace(reviewUrl);
    }, 400);

    return () => clearTimeout(timer);
  }, [reviewUrl]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAF5EF',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      textAlign: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: '#0f3d3e'
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '40px 28px',
        border: '1px solid #e8e2d2',
        boxShadow: '0 12px 36px rgba(15, 61, 62, 0.08)'
      }}>
        <div style={{
          width: 72,
          height: 72,
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: '#0f3d3e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FAF5EF',
          fontSize: 32,
          fontWeight: 800,
          fontFamily: "'Playfair Display', serif"
        }}>
          ☕
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.75rem',
          margin: '0 0 8px',
          color: '#0f3d3e'
        }}>
          THE MORAS CAFE
        </h1>
        <p style={{
          fontSize: '0.82rem',
          color: '#b45309',
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 700,
          margin: '0 0 20px'
        }}>
          Guest Reflections
        </p>

        <div style={{
          fontSize: '2rem',
          color: '#c3912d',
          letterSpacing: 6,
          marginBottom: 16
        }}>
          ★★★★★
        </div>

        <p style={{
          fontSize: '0.95rem',
          color: '#555',
          lineHeight: 1.6,
          margin: '0 0 24px'
        }}>
          Taking you directly to Google to rate your experience...
        </p>

        <a
          href={reviewUrl}
          style={{
            display: 'inline-block',
            width: '100%',
            boxSizing: 'border-box',
            background: '#0f3d3e',
            color: '#FFFFFF',
            padding: '14px 20px',
            borderRadius: 12,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(15, 61, 62, 0.2)'
          }}
        >
          Click to Open Google Reviews ↗
        </a>

        <div style={{ marginTop: 24, fontSize: '0.78rem', color: '#999' }}>
          Thank you for supporting our local café at B.M. Patil Circle!
        </div>
      </div>
    </div>
  );
}

export default ReviewRedirect;
