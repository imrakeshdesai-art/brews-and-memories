import { useState, useEffect } from 'react';
import { reviewsData } from '../data/reviewsData';

function StatCounter({ targetValue, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`reviews-stat-counter-${targetValue}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [targetValue]);

  useEffect(() => {
    if (!hasStarted) return;

    const isFloat = /^[0-9]+\.[0-9]+/.test(targetValue);
    const isInt = /^[0-9]+/.test(targetValue);
    
    if (!isFloat && !isInt) {
      setCount(targetValue);
      return;
    }

    const numericValue = parseFloat(targetValue.match(/^[0-9.]+/)[0]);
    const suffix = targetValue.replace(/^[0-9.]+/, '');
    
    let start = 0;
    const steps = 60; // 60 frames
    const increment = numericValue / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const nextVal = increment * currentStep;
      if (currentStep >= steps) {
        clearInterval(timer);
        setCount(targetValue);
      } else {
        if (isFloat) {
          setCount(`${nextVal.toFixed(1)}${suffix}`);
        } else {
          setCount(`${Math.floor(nextVal)}${suffix}`);
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hasStarted, targetValue, duration]);

  return <span id={`reviews-stat-counter-${targetValue}`}>{count || targetValue}</span>;
}

function Reviews() {
  return (
    <section className="section" id="reviews">
      <div className="section-header" style={{ marginBottom: 40 }}>
        <span className="section-label">Customer Love</span>
        <h2 className="section-title">What Our Guests <em>Say</em></h2>
        <div className="section-divider" />
      </div>

      {/* POWERFUL BRAND QUOTE */}
      <div style={{ 
        maxWidth: 800, 
        margin: '0 auto 40px', 
        fontFamily: "'Playfair Display', serif", 
        fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', 
        color: 'var(--green)',
        fontStyle: 'italic',
        fontWeight: 700,
        lineHeight: 1.3,
        textAlign: 'center',
        padding: '0 20px'
      }}>
        “Come for the coffee. Stay for the memories.”
      </div>

      {/* STATISTICS BLOCK: BREWS & MEMORIES BY NUMBERS */}
      <div style={{ 
        maxWidth: 1100, 
        margin: '0 auto 60px', 
        background: 'var(--cream-light)', 
        borderRadius: '24px', 
        border: '1px solid var(--cream-dark)', 
        padding: '48px 32px', 
        textAlign: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <span style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.82rem', fontWeight: 800, display: 'block', marginBottom: 8 }}>Our Milestones</span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--green)', margin: '0 0 16px', fontWeight: 700 }}>
          Brews &amp; Memories By Numbers
        </h2>
        <div style={{ width: 50, height: 3, background: 'var(--green)', margin: '0 auto 36px' }} />
        
        <div className="grid-5" style={{ gap: '20px' }}>
          {[
            { icon: '☕', number: '500+', label: 'Happy Guests' },
            { icon: '📚', number: 'Free', label: 'Books Available' },
            { icon: '🎲', number: 'Free', label: 'Board Games' },
            { icon: '⭐', number: '4.8+', label: 'Google Rating' },
            { icon: '❤️', number: 'Countless', label: 'Memories Made' }
          ].map((stat, idx) => (
            <div key={idx} style={{ 
              background: 'var(--white)', 
              border: '1px solid var(--cream-dark)', 
              borderRadius: '16px', 
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
            >
              <span style={{ fontSize: '2.5rem', marginBottom: 4 }} role="img" aria-label={stat.label}>{stat.icon}</span>
              <strong style={{ fontSize: '1.8rem', color: 'var(--green)', fontWeight: 800 }}><StatCounter targetValue={stat.number} /></strong>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-light)', fontWeight: 600 }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rating-summary">
        <div className="big-rating">4.8</div>
        <div className="rating-stars-big">★★★★★</div>
        <div className="rating-meta">Based on 500+ Google Reviews</div>
      </div>
      
      <div className="reviews-grid">
        {reviewsData.map((review) => (
          <article key={review.name} className="review-card">
            <div className="review-header">
              <div className="avatar">{review.initials}</div>
              <div>
                <strong>{review.name}</strong>
                <div className="footer-note">{review.date}</div>
              </div>
            </div>
            <div className="review-stars">{'★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)}</div>
            <p className="review-text">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Reviews;
