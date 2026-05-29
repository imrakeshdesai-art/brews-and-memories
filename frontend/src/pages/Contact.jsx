function Contact() {
  const phone = '+919945446137';
  const whatsappUrl = 'https://wa.me/919945446137?text=Hello%20Brews%20%26%20Memories%2C%20I%20would%20like%20to%20inquire!';
  const directionsUrl = 'https://maps.google.com/?q=B+M+Patil+Circle+Ring+Rd+Vijayapura+Karnataka+586102';

  return (
    <section className="section" id="contact" style={{ padding: '80px 20px' }}>
      <div className="section-header" style={{ marginBottom: 48, textAlign: 'center' }}>
        <span className="section-label" style={{ color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.85rem', fontWeight: 700 }}>Find Us</span>
        <h2 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.2rem', color: 'var(--green)', margin: '8px 0 0' }}>Visit <em>Us</em></h2>
        <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '16px auto 0' }} />
      </div>

      <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Address Card */}
        <div className="contact-card" style={{ background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '30px 24px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="contact-icon" style={{ fontSize: '2.5rem' }}>📍</div>
          <div>
            <div className="contact-label" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)', marginBottom: 6 }}>Address</div>
            <div className="contact-value" style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              B M Patil Circle, Ring Rd,<br />
              Solapur Bypass, Vijayapura,<br />
              Karnataka 586102, India
            </div>
            <div style={{ marginTop: 14 }}>
              <a 
                href={directionsUrl}
                target="_blank" 
                rel="noreferrer" 
                className="btn-outline" 
                style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', color: 'var(--green)', borderColor: 'var(--green)' }}
              >
                🗺️ Get Directions
              </a>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="contact-card" style={{ background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '30px 24px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="contact-icon" style={{ fontSize: '2.5rem' }}>📞</div>
          <div>
            <div className="contact-label" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)', marginBottom: 6 }}>Phone & Chat</div>
            <div className="contact-value" style={{ color: 'var(--text-light)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 12 }}>
              +91 99454 46137
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <a 
                className="btn-primary" 
                href={`tel:${phone}`} 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: '0.85rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
              >
                📞 Call Now
              </a>
              <a 
                className="btn-outline" 
                href={whatsappUrl}
                target="_blank" 
                rel="noreferrer" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', fontSize: '0.85rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600, color: '#25d366', borderColor: '#25d366' }}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Opening Hours Card */}
        <div className="contact-card" style={{ background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '30px 24px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="contact-icon" style={{ fontSize: '2.5rem' }}>🕙</div>
          <div>
            <div className="contact-label" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)', marginBottom: 6 }}>Opening Hours</div>
            <div className="contact-value" style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              <strong>Open Daily</strong><br />
              Monday – Sunday: 10:00 AM – 10:30 PM<br />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-light)', fontStyle: 'italic' }}>* Last kitchen orders close at 10:00 PM</span>
            </div>
          </div>
        </div>

        {/* Reviews Card */}
        <div className="contact-card" style={{ background: '#fff', border: '1px solid var(--cream-dark)', borderRadius: 12, padding: '30px 24px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="contact-icon" style={{ fontSize: '2.5rem' }}>⭐</div>
          <div>
            <div className="contact-label" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--green)', marginBottom: 6 }}>Google Rating</div>
            <div className="contact-value" style={{ color: 'var(--text-light)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              <strong>4.8 / 5 Stars</strong><br />
              Based on 500+ verified customer reviews on Google.<br />
              <span style={{ color: '#fbbf24', fontSize: '1.1rem', letterSpacing: 2 }}>★★★★★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Embed map */}
      <div className="map-frame" style={{ marginTop: 48, borderRadius: 14, overflow: 'hidden', border: '2px solid var(--cream-dark)', boxShadow: 'var(--shadow)' }}>
        <iframe
          title="Brews & Memories Café Location B M Patil Circle Vijayapura"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.5794503716616!2d75.70327361118671!3d16.822765383921865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc5d481f9b3e107%3A0x334460f9ec347101!2sB%20M%20Patil%20Circle%2C%20Vijayapura%2C%20Karnataka%20586102!5e0!3m2!1sen!2sin!4v1717000000000"
          width="100%"
          height="450"
          style={{ border: 0, display: 'block' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
          style={{ display: 'inline-flex', padding: '14px 32px', fontSize: '1rem', textDecoration: 'none' }}
        >
          🗺️ Open directly in Google Maps App
        </a>
      </div>
    </section>
  );
}

export default Contact;
