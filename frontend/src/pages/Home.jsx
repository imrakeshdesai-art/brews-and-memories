import { Link } from 'react-router-dom';

const FEATURED_CATEGORIES = [
  { emoji: '☕', label: 'Coffee', category: 'Hot Beverages' },
  { emoji: '🍕', label: 'Pizza', category: 'Pizza' },
  { emoji: '🍔', label: 'Burgers', category: 'Burgers' },
  { emoji: '🍫', label: 'Desserts', category: 'Desserts' },
  { emoji: '🥤', label: 'Milkshakes', category: 'Milkshakes' },
  { emoji: '🥟', label: 'Momos', category: 'Momos' },
  { emoji: '🌯', label: 'Rolls', category: 'Rolls' },
  { emoji: '🍟', label: 'Fries', category: 'Fries' },
];

function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot" />
            Now Open · 10:00 AM onwards
          </div>
          <h1 className="hero-title">
            Brews &amp;
            <br />
            <span>Memories</span>
          </h1>
          <p className="hero-tagline">Cafe, Coffee &amp; More</p>
          <div className="hero-rating">
            <span className="stars">★★★★☆</span>
            <span className="rating-text">4.2 · 200+ Google Reviews</span>
          </div>
          <p className="hero-quote">"Great ambiance, tasty brews, and chill vibes."</p>
          <div className="hero-btns">
            <Link to="/menu" className="btn-primary">🍽 View Menu</Link>
            <Link to="/menu" className="btn-outline">📲 Order Now</Link>
          </div>
        </div>
      </section>

      {/* FEATURED CATEGORIES */}
      <section className="section" style={{ background: 'var(--cream-light)', paddingTop: 60, paddingBottom: 60 }}>
        <div className="section-header" style={{ marginBottom: 36 }}>
          <span className="section-label">Explore</span>
          <h2 className="section-title">What We <em>Serve</em></h2>
          <div className="section-divider" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16, maxWidth: 900, margin: '0 auto' }}>
          {FEATURED_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={`/menu?category=${encodeURIComponent(cat.category)}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{
                  padding: '20px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>{cat.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--green)' }}>{cat.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="section" style={{ background: '#fff' }}>
        <div className="section-header" style={{ marginBottom: 40 }}>
          <span className="section-label">Why Visit</span>
          <h2 className="section-title">A Place to <em>Remember</em></h2>
          <div className="section-divider" />
        </div>
        <div className="grid-4" style={{ maxWidth: 1100, margin: '0 auto' }}>
          {[
            { icon: '⭐', title: '4.2 Rating', desc: 'Loved by 200+ guests on Google Reviews' },
            { icon: '🌿', title: 'Pure Veg', desc: 'Fully vegetarian café — fresh and wholesome' },
            { icon: '🛋️', title: 'Cozy Ambiance', desc: 'Comfortable seating, warm lights, chill music' },
            { icon: '🕙', title: 'Open Daily', desc: 'Serving from 10:00 AM every day' },
          ].map((item) => (
            <div key={item.title} className="card" style={{ cursor: 'default' }}>
              <div className="card-icon">{item.icon}</div>
              <div className="card-title">{item.title}</div>
              <div className="card-copy">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
