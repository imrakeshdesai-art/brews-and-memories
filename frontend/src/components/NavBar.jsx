import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

function NavBar({ cartCount, onCartClick, activeTable, onReserveClick, theme, toggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomeActive = location.pathname === '/' && !location.hash;
  const isContactActive = location.pathname === '/' && location.hash === '#location';

  return (
    <header className={`site-nav ${isScrolled ? 'scrolled' : 'transparent'}`}>
      <div className="nav-container-split">
        {/* LEFT NAV WING */}
        <nav className="nav-wing nav-wing-left desktop-menu">
          <NavLink to="/" end className={() => (isHomeActive ? 'nav-link active' : 'nav-link')}>
            Home
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            About
          </NavLink>
          <NavLink to="/menu" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Menu
          </NavLink>
        </nav>

        {/* CENTER LUXURY LOGO BRAND */}
        <NavLink to="/" className="site-brand-center" aria-label="The Moras Cafe Home">
          <img src="/logo.png" alt="The Moras Cafe logo" className="brand-center-img" />
        </NavLink>

        {/* RIGHT NAV WING */}
        <nav className="nav-wing nav-wing-right desktop-menu">
          <NavLink to="/reviews" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Reviews
          </NavLink>
          <NavLink to="/moments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            Moments
          </NavLink>
          <NavLink to="/#location" className={() => (isContactActive ? 'nav-link active' : 'nav-link')}>
            Contact
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

        {/* MOBILE / QUICK ACTIONS (RIGHT SIDE) */}
        <div className="nav-actions-split">
          {activeTable && (
            <span className="table-badge-nav">
              <span className="dot-live">●</span> {activeTable}
            </span>
          )}
          {activeTable && (
            <button className="btn-cart" type="button" onClick={onCartClick} aria-label="Open cart">
              🛒 Cart
              <span className="cart-badge" aria-live="polite">{cartCount}</span>
            </button>
          )}
          <button
            className="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
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
        <NavLink to="/#location" className="nav-link" onClick={() => setMenuOpen(false)}>
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
