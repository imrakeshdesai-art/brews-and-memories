function Contact() {
  return (
    <section className="section" id="contact">
      <div className="section-header">
        <span className="section-label">Find Us</span>
        <h2 className="section-title">Visit <em>Us</em></h2>
        <div className="section-divider" />
      </div>
      <div className="contact-grid">
        <div className="contact-card">
          <div className="contact-icon">📍</div>
          <div>
            <div className="contact-label">Address</div>
            <div className="contact-value">
              B M Patil Circle, Ring Rd,
              <br />
              Vijayapura, Karnataka 586102, India
            </div>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <div>
            <div className="contact-label">Phone</div>
            <div className="contact-value">+91 99454 46137</div>
            <a className="btn-call" href="tel:+919945446137">
              📞 Call Now
            </a>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-icon">🕙</div>
          <div>
            <div className="contact-label">Opening Hours</div>
            <div className="contact-value">
              10:00 AM onwards
              <br />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>Open all days · Last order 10 PM</span>
            </div>
          </div>
        </div>
        <div className="contact-card">
          <div className="contact-icon">⭐</div>
          <div>
            <div className="contact-label">Google Rating</div>
            <div className="contact-value">
              4.2 / 5 · 200+ Reviews
              <br />
              <span style={{ color: '#fbbf24', fontSize: '1rem' }}>★★★★☆</span>
            </div>
          </div>
        </div>
      </div>
      <div className="map-frame">
        <div className="map-placeholder">
          <div className="map-icon">🗺️</div>
          <p>
            <strong>Brews & Memories Café</strong>
            <br />
            B M Patil Circle, Ring Rd,
            <br />
            Vijayapura, Karnataka 586102
          </p>
          <a className="btn-call" href="https://maps.google.com/?q=B+M+Patil+Circle+Ring+Rd+Vijayapura+Karnataka+586102" target="_blank" rel="noreferrer">
            🗺️ Open in Google Maps
          </a>
        </div>
      </div>
    </section>
  );
}

export default Contact;
