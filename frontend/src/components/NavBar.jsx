import { useState } from 'react';
import { NavLink } from 'react-router-dom';

function NavBar({ cartCount, onCartClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-nav">
      <div className="site-brand">
        <div className="brand-icon">
          <img src="/logo.jpg" alt="Brews & Memories logo" />
        </div>
        <div className="brand-text">
          <span>Brews & Memories</span>
          <small>CAFÉ</small>
        </div>
      </div>

      <nav className="nav-links desktop-menu">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Home
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          About
        </NavLink>
        <NavLink to="/menu" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Menu
        </NavLink>
        <NavLink to="/reviews" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Reviews
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Contact
        </NavLink>
        <NavLink to="/reserve" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Book Table
        </NavLink>
      </nav>

      <div className="nav-actions">
        <button className="btn-cart" type="button" onClick={onCartClick} aria-label="Open cart">
          🛒 Cart
          <span className="cart-badge" aria-live="polite">{cartCount}</span>
        </button>
        <button
          className={`mobile-toggle ${menuOpen ? 'open' : ''}`}
          type="button"
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
        <NavLink to="/" end className="nav-link" onClick={() => setMenuOpen(false)}>
          🏠 Home
        </NavLink>
        <NavLink to="/about" className="nav-link" onClick={() => setMenuOpen(false)}>
          📖 About
        </NavLink>
        <NavLink to="/menu" className="nav-link" onClick={() => setMenuOpen(false)}>
          🍽 Menu
        </NavLink>
        <NavLink to="/reviews" className="nav-link" onClick={() => setMenuOpen(false)}>
          ⭐ Reviews
        </NavLink>
        <NavLink to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>
          📍 Contact
        </NavLink>
        <NavLink to="/reserve" className="nav-link" onClick={() => setMenuOpen(false)}>
          📅 Book Table
        </NavLink>
      </div>
    </header>
  );
}

export default NavBar;
