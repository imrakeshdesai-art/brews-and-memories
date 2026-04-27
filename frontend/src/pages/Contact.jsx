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
              B M Patil Circle, Ring Rd,<br />
              Solapur, Vijayapura,<br />
              Karnataka 586102, India
            </div>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-icon">📞</div>
          <div>
            <div className="contact-label">Phone</div>
            <div className="contact-value" style={{ marginBottom: 12 }}>+91 99454 46137</div>
            <a className="btn-primary" href="tel:+919945446137" style={{ display: 'inline-flex', padding: '10px 20px', fontSize: '0.9rem', borderRadius: 8, textDecoration: 'none' }}>
              📞 Call Now
            </a>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-icon">🕙</div>
          <div>
            <div className="contact-label">Opening Hours</div>
            <div className="contact-value">
              10:00 AM onwards<br />
              <span style={{ fontSize: '0.82rem', color: 'var(--text-light)' }}>Open all days · Last order 10 PM</span>
            </div>
          </div>
        </div>

        <div className="contact-card">
          <div className="contact-icon">⭐</div>
          <div>
            <div className="contact-label">Google Rating</div>
            <div className="contact-value">
              4.2 / 5 · 200+ Reviews<br />
              <span style={{ color: '#fbbf24', fontSize: '1rem' }}>★★★★☆</span>
            </div>
          </div>
        </div>
      </div>

      <div className="map-frame" style={{ marginTop: 48 }}>
        <iframe
          title="Brews & Memories Café Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3821.6543!2d75.7151!3d16.8245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc5c0b0b0b0b0b1%3A0xabc123!2sB%20M%20Patil%20Circle%2C%20Vijayapura%2C%20Karnataka%20586102!5e0!3m2!1sen!2sin!4v1700000000000"
          width="100%"
          height="420"
          style={{ border: 0, display: 'block' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <a
          href="https://maps.google.com/?q=B+M+Patil+Circle+Ring+Rd+Vijayapura+Karnataka+586102"
          target="_blank"
          rel="noreferrer"
          className="btn-outline"
          style={{ display: 'inline-flex', color: 'var(--green)', borderColor: 'var(--green)', padding: '12px 28px' }}
        >
          🗺️ Open in Google Maps
        </a>
      </div>
    </section>
  );
}

export default Contact;
