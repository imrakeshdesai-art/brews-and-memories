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
        >
          💬
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
