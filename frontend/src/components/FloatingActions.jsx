function FloatingActions() {
  const phone = '+919945446137';
  const whatsappUrl = 'https://wa.me/919945446137?text=Hello%20Brews%20%26%20Memories%2C%20I%20would%20like%20to%20inquire%20about%20a%20booking!';
  const directionsUrl = 'https://maps.google.com/?q=B+M+Patil+Circle+Vijayapura+Karnataka+586102';

  return (
    <>
      {/* Desktop Floating Actions Widget */}
      <div className="floating-actions-desktop" aria-label="Quick Contacts">
        <a 
          href={whatsappUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="float-btn whatsapp" 
          title="Chat on WhatsApp"
          aria-label="Chat on WhatsApp"
          style={{
            width: 'auto',
            height: '54px',
            borderRadius: '27px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontSize: '0.92rem',
            fontWeight: 800,
            boxShadow: '0 8px 32px rgba(37, 211, 102, 0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: '#25D366',
            color: '#ffffff'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(37, 211, 102, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(37, 211, 102, 0.3)';
          }}
        >
          <svg style={{ width: '22px', height: '22px', fill: '#fff' }} viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.457L0 24zm6.59-4.846c1.6.95 3.488 1.449 5.421 1.451 5.441 0 9.869-4.42 9.873-9.864.002-2.638-1.023-5.117-2.885-6.982A9.799 9.799 0 0 0 12.008 1.14c-5.449 0-9.879 4.421-9.883 9.866a9.8 9.8 0 0 0 1.489 5.14l-.999 3.646 3.734-.979z" />
          </svg>
          <span>Order Online</span>
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
