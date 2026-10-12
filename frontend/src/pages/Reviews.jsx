import { useState, useEffect } from 'react';
import { reviewsData } from '../data/reviewsData';
import useSEO from '../hooks/useSEO';

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
  useSEO({
    title: 'Reviews',
    description: 'Read reviews and testimonials from our guests at The Moras Cafe in Vijayapura. See why they love our freshly brewed coffee, hot pizzas, and ambient environment.'
  });

  return (
    <div className="reviews-editorial-page" style={{ background: '#FAF5EF', minHeight: '100vh', padding: '60px 5% 80px' }}>
      <div className="section-header" style={{ marginBottom: 44, textAlign: 'center' }}>
        <span className="hero-editorial-kicker" style={{ color: '#b45309' }}>Guest Reflections</span>
        <h1 className="hero-editorial-title" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', marginTop: 12 }}>
          What Our Patrons <em>Share</em>
        </h1>
        <div className="hero-editorial-tagline" style={{ marginTop: 16 }}>
          “The Place That Knows You”
        </div>
      </div>

      {/* REFINED EDITORIAL STATS */}
      <div style={{ 
        maxWidth: 1100, 
        margin: '0 auto 60px', 
        background: '#FFFFFF', 
        borderRadius: '24px', 
        border: '1px solid var(--cream-dark)', 
        padding: '48px 32px', 
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(15, 61, 62, 0.05)'
      }}>
        <span style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.8rem', fontWeight: 800, display: 'block', marginBottom: 8 }}>
          Milestones of Care
        </span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--green)', margin: '0 0 24px', fontWeight: 700 }}>
          The Moras Cafe in Numbers
        </h2>
        
        <div className="grid-3" style={{ gap: '24px' }}>
          {[
            { number: '4.8★', label: 'Google Rating', note: 'Based on genuine patron reviews on Google Maps' },
            { number: '100%', label: 'Pure Veg Craft', note: 'Strictly vegetarian kitchen & fresh preparation' },
            { number: 'Daily', label: '10 AM – 10:30 PM', note: 'Welcoming guests 7 days a week at B.M. Patil Circle' }
          ].map((stat, idx) => (
            <div key={idx} style={{ 
              background: '#FAF5EF', 
              border: '1px solid var(--cream-dark)', 
              borderRadius: '16px', 
              padding: '28px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ 
                fontFamily: "'Playfair Display', serif", 
                fontSize: '2rem', 
                fontWeight: 800, 
                color: 'var(--green)'
              }}>
                <StatCounter targetValue={stat.number} />
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.5 }}>
                {stat.note}
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
}

export default Reviews;
