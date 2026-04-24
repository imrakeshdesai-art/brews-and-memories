import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="dot" />
          Now Open · 10:00 AM onwards
        </div>
        <h1 className="hero-title">
          Brews &
          <br />
          <span>Memories</span>
        </h1>
        <p className="hero-tagline">Cafe, Coffee & More</p>
        <div className="hero-rating">
          <span className="stars">★★★★☆</span>
          <span className="rating-text">4.2 · 200+ Google Reviews</span>
        </div>
        <p className="hero-quote">"Great ambiance, tasty brews, and chill vibes."</p>
        <div className="hero-btns">
          <Link to="/menu" className="btn-primary">
            🍽 View Menu
          </Link>
          <Link to="/menu" className="btn-outline">
            📲 Order Now
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Home;
