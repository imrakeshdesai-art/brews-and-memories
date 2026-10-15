import { useLocation } from 'react-router-dom';

function FloatingActions() {
  const location = useLocation();
  const phone = '+919945446137';
  const whatsappUrl = 'https://wa.me/919945446137?text=Hello%20The%20Moras%20Cafe%2C%20I%20would%20like%20to%20inquire%20about%20a%20booking!';
  const directionsUrl = 'https://www.google.com/maps/place/Brews+and+Memories+cafe/@16.8637369,75.7133426,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc65571521cbf25:0x8c034c8193bdc099!8m2!3d16.8637369!4d75.7159176';

  // Hide on interactive routes like /menu, /order, /admin, or print QR
  const hiddenPrefixes = ['/menu', '/order', '/admin'];
  const shouldHide = hiddenPrefixes.some(prefix => location.pathname.startsWith(prefix));

  if (shouldHide) return null;

  return (
    <nav className="floating-actions-mobile" aria-label="Quick Contacts Bar">
      <a 
        href={`tel:${phone}`} 
        className="mobile-action-link"
        aria-label="Call The Moras Cafe"
      >
        <svg className="mobile-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        <span>Call Us</span>
      </a>

      <a 
        href={whatsappUrl} 
        target="_blank" 
        rel="noreferrer" 
        className="mobile-action-link"
        aria-label="Message on WhatsApp"
      >
        <svg className="mobile-action-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.421 1.451 5.441 0 9.869-4.42 9.873-9.864.002-2.638-1.023-5.117-2.885-6.982A9.799 9.799 0 0 0 12.008 1.14c-5.449 0-9.879 4.421-9.883 9.866a9.8 0 0 0 1.489 5.14l-.999 3.646 3.734-.979z" />
        </svg>
        <span>WhatsApp</span>
      </a>

      <a 
        href={directionsUrl} 
        target="_blank" 
        rel="noreferrer" 
        className="mobile-action-link"
        aria-label="Get Directions on Google Maps"
      >
        <svg className="mobile-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>Directions</span>
      </a>
    </nav>
  );
}

export default FloatingActions;
