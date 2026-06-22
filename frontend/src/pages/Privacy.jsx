import React from 'react';
import useSEO from '../hooks/useSEO';

function Privacy() {
  useSEO({
    title: 'Privacy Policy',
    description: 'Privacy Policy for Brews & Memories Café. Learn how we collect, protect, and process your table ordering information securely.'
  });

  return (
    <section className="section" style={{ padding: '120px 20px 80px', minHeight: '80vh', background: 'var(--cream-light)' }}>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
        <span className="section-label" style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Security & Trust</span>
        <h1 className="section-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: 'var(--green)', margin: '10px 0 16px' }}>Privacy Policy</h1>
        <div className="section-divider" style={{ width: 60, height: 3, background: 'var(--green)', margin: '0 auto' }} />
      </div>
      <div className="card" style={{ maxWidth: 800, width: '100%', margin: '0 auto', background: 'var(--white)', border: '1px solid var(--cream-dark)', borderRadius: 16, padding: '40px', boxShadow: 'var(--shadow-lg)', color: 'var(--text-light)', lineHeight: 1.8 }}>
        <p><strong>Last Updated: June 2026</strong></p>
        <p>
          At Brews & Memories, we prioritize the privacy and security of our guests. This privacy policy describes how we collect, use, and process your information when you use our QR code table ordering system or website.
        </p>
        
        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>1. Information We Collect</h3>
        <p>
          When you place an order at a table, we collect standard details required to process and deliver your order, including:
        </p>
        <ul>
          <li><strong>Your Name</strong> (to identify who the food is for).</li>
          <li><strong>Phone Number</strong> (for order confirmations and in case staff need to contact you).</li>
          <li><strong>Email Address</strong> (optional, to send you a copy of your receipt).</li>
          <li><strong>Table Location</strong> (automatically resolved via table QR code to deliver food to the correct table).</li>
        </ul>

        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>2. How We Use Your Information</h3>
        <p>
          Your information is solely used to:
        </p>
        <ul>
          <li>Deliver orders directly to your table inside the café.</li>
          <li>Send automatic receipt notifications and confirmation messages.</li>
          <li>Provide a secure, authenticated table session locked to your device.</li>
        </ul>

        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>3. Security and Storage</h3>
        <p>
          Your personal data is encrypted and transmitted securely. Table sessions are bound to your specific physical device using temporary secure tokens in local browser storage, and automatically expire after 20 minutes or immediately upon completing your order.
        </p>

        <h3 style={{ color: 'var(--green)', marginTop: 24 }}>4. Data Protection</h3>
        <p>
          We do not sell, trade, rent, or distribute customer details to third-party advertisers. All transaction histories are handled privately through our encrypted admin panel.
        </p>
      </div>
    </section>
  );
}

export default Privacy;
