function FloatingActions() {
  const phone = '+919945446137';
  const whatsappUrl = 'https://wa.me/919945446137?text=Hello%20Brews%20%26%20Memories%2C%20I%20would%20like%20to%20inquire%20about%20a%20booking!';
  const directionsUrl = 'https://www.google.com/maps/place/Brews+and+Memories+cafe/@16.8637369,75.7133426,17z/data=!3m1!4b1!4m6!3m5!1s0x3bc65571521cbf25:0x8c034c8193bdc099!8m2!3d16.8637369!4d75.7159176';

  return (
    <>
      {/* Desktop & Mobile Floating Actions Widget */}
      <div className="floating-actions-desktop" aria-label="Quick Contacts" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="float-btn whatsapp" 
          title="Connect on WhatsApp"
          aria-label="Connect on WhatsApp"
          style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          <svg style={{ width: '22px', height: '22px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.421 1.451 5.441 0 9.869-4.42 9.873-9.864.002-2.638-1.023-5.117-2.885-6.982A9.799 9.799 0 0 0 12.008 1.14c-5.449 0-9.879 4.421-9.883 9.866a9.8 0 0 0 1.489 5.14l-.999 3.646 3.734-.979z" />
          </svg>
        </a>

        <a 
          href="https://www.instagram.com/brews_and_memories_/" 
          target="_blank" 
          rel="noreferrer" 
          className="float-btn instagram" 
          title="Connect us on Instagram"
          aria-label="Connect us on Instagram"
          style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#E1306C', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        >
          <svg style={{ width: '22px', height: '22px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
          </svg>
        </a>
      </div>

      {/* Mobile Bottom Sticky Bar Actions */}
      <div className="floating-actions-mobile" aria-label="Mobile Contacts">
        <a 
          href={`tel:${phone}`} 
          className="mobile-action-link"
          aria-label="Call cafe phone number"
        >
          <span style={{ fontSize: '1.2rem' }}>📞</span>
          <span>Call Us</span>
        </a>
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="mobile-action-link whatsapp"
          aria-label="Send WhatsApp message"
        >
          <span style={{ fontSize: '1.2rem' }}>💬</span>
          <span>WhatsApp</span>
        </a>
        <a 
          href={directionsUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="mobile-action-link directions"
          aria-label="Get directions to B M Patil Circle on Google Maps"
        >
          <span style={{ fontSize: '1.2rem' }}>🗺️</span>
          <span>Directions</span>
        </a>
      </div>
    </>
  );
}

export default FloatingActions;
