import { useState } from 'react';
import { NavLink } from 'react-router-dom';

function NavBar({ cartCount, onCartClick, activeTable, onReserveClick }) {
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
        <NavLink to="/moments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Moments
        </NavLink>
        <NavLink to="/contact" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Contact
        </NavLink>
        <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Staff Login
        </NavLink>
        <button 
          type="button" 
          onClick={onReserveClick} 
          className="nav-btn-reserve" 
          aria-label="Book a reservation table"
        >
          Book Table
        </button>
      </nav>

      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {activeTable && (
          <span className="table-badge-nav" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--cream-light)',
            color: 'var(--green)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: 800,
            border: '1px solid var(--cream-dark)',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            <span style={{ color: '#10b981', display: 'inline-block', transform: 'scale(0.8)' }}>●</span> {activeTable}
          </span>
        )}
        {activeTable && (
          <button className="btn-cart" type="button" onClick={onCartClick} aria-label="Open cart">
            🛒 Cart
            <span className="cart-badge" aria-live="polite">{cartCount}</span>
          </button>
        )}
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
        <NavLink to="/moments" className="nav-link" onClick={() => setMenuOpen(false)}>
          📸 Moments
        </NavLink>
        <NavLink to="/contact" className="nav-link" onClick={() => setMenuOpen(false)}>
          📍 Contact
        </NavLink>
        <NavLink to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>
          🔐 Staff Login
        </NavLink>
        <button 
          type="button" 
          className="nav-link" 
          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '12px 20px', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit', cursor: 'pointer' }}
          onClick={() => {
            setMenuOpen(false);
            onReserveClick();
          }}
          aria-label="Book a reservation table"
        >
          📅 Book Table
        </button>
      </div>
    </header>
  );
}

export default NavBar;
