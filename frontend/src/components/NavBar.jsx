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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isHomeActive = location.pathname === '/' && !location.hash;
  const isContactActive = location.pathname === '/' && location.hash === '#location';

  return (
    <>
      <header className={`site-nav ${isScrolled ? 'scrolled' : 'transparent'} ${location.pathname === '/' ? 'is-home' : ''} ${menuOpen ? 'menu-is-open' : ''}`}>
        <div className="nav-container-split">
          {/* LEFT NAV WING: Home, About */}
          <nav className="nav-wing nav-wing-left desktop-menu">
            <NavLink to="/" end className={() => (isHomeActive ? 'nav-link active' : 'nav-link')}>
              Home
            </NavLink>
            <NavLink to="/about" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              About
            </NavLink>
          </nav>

          {/* CENTER LUXURY LOGO EMBLEM */}
          <NavLink to="/" className="site-brand-center" aria-label="The Moras Cafe Home">
            <img src="/logo.png" alt="The Moras Cafe" className="brand-center-img" />
          </NavLink>

          {/* RIGHT NAV WING: Menu, Wallpapers, Contact */}
          <nav className="nav-wing nav-wing-right desktop-menu">
            <NavLink to="/menu" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Menu
            </NavLink>
            <NavLink to="/wallpapers" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Wallpapers
            </NavLink>
            <NavLink to="/#location" className={() => (isContactActive ? 'nav-link active' : 'nav-link')}>
              Contact
            </NavLink>
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
                Cart
                <span className="cart-badge" aria-live="polite">{cartCount}</span>
              </button>
            )}
            <button
              className={`mobile-toggle ${menuOpen ? 'open' : ''}`}
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation-drawer"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER - Rendered outside <header> to avoid backdrop-filter containing block trap */}
      <nav 
        id="mobile-navigation-drawer"
        className={`mobile-menu ${menuOpen ? 'open' : ''}`} 
        aria-hidden={!menuOpen}
        aria-label="Mobile Navigation Drawer"
      >
        <NavLink 
          to="/" 
          end 
          className={({ isActive }) => `mobile-nav-link ${isActive && isHomeActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          Home
        </NavLink>
        <NavLink 
          to="/about" 
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          About
        </NavLink>
        <NavLink 
          to="/menu" 
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          Menu
        </NavLink>
        <NavLink 
          to="/reviews" 
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          Reviews
        </NavLink>
        <NavLink 
          to="/moments" 
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          Moments
        </NavLink>
        <NavLink 
          to="/wallpapers" 
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          Brand Wallpapers
        </NavLink>
        <a 
          href="https://www.instagram.com/themorascafe/" 
          target="_blank" 
          rel="noreferrer" 
          className="mobile-nav-link" 
          onClick={() => setMenuOpen(false)}
          aria-label="The Moras Cafe on Instagram (opens in new tab)"
        >
          <span>Instagram</span>
          <span className="mobile-link-ext" aria-hidden="true">↗</span>
        </a>
        <NavLink 
          to="/#location" 
          className={() => `mobile-nav-link ${isContactActive ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        >
          Contact
        </NavLink>

        <button 
          type="button" 
          className="mobile-reserve-btn"
          onClick={() => {
            setMenuOpen(false);
            onReserveClick();
          }}
          aria-label="Book a table reservation"
        >
          <svg className="mobile-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>Book a Table</span>
        </button>

        <div className="mobile-menu-divider" role="separator" />

        <NavLink 
          to="/admin" 
          className="mobile-secondary-link" 
          onClick={() => setMenuOpen(false)}
          aria-label="Staff Portal Login"
        >
          <span>Staff Portal</span>
          <span className="mobile-secondary-arrow" aria-hidden="true">→</span>
        </NavLink>
      </nav>
    </>
  );
}

export default NavBar;
