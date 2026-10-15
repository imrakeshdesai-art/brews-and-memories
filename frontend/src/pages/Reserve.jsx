import { useState } from 'react';
import api from '../services/api';
import useSEO from '../hooks/useSEO';
import { UPI_CONFIG, buildUpiUri, buildUpiQrUrl } from '../config/upi';

function Reserve() {
  useSEO({
    title: 'Book a Table',
    description: 'Book a table at The Moras Cafe, B.M. Patil Circle, Vijayapura. Reserve your cozy corner with a 100% redeemable ₹10 advance.'
  });

  const [step, setStep] = useState(1); // 1: Details, 2: UPI ₹10 Payment, 3: Success
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !phone.trim() || !date || !time) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address for your confirmation ticket.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (Number(guests) < 1) {
      setError('Number of guests must be at least 1.');
      return;
    }

    setStep(2);
    // Smooth scroll back to form top if on mobile
    const formElem = document.getElementById('reservation-form-anchor');
    if (formElem) formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCompleteReservation = async () => {
    setIsSubmitting(true);
    setError('');

    const cleanedPhone = phone.replace(/\D/g, '');

    try {
      const res = await api.post('/reservations', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanedPhone,
        guests: Number(guests),
        date,
        time,
        notes: notes.trim(),
        amount: UPI_CONFIG.bookingAmount,
        upiRef: upiRef.trim(),
      });

      setCreatedBooking(res.data);
      setIsSubmitting(false);
      setStep(3);

      if (window.trackEvent) {
        window.trackEvent('reserve_success', { 
          guests, 
          date, 
          time, 
          amount: UPI_CONFIG.bookingAmount 
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not submit reservation. Please try again.');
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_CONFIG.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const upiUri = buildUpiUri({
    amount: UPI_CONFIG.bookingAmount,
    note: `Table Booking - ${name ? name.slice(0, 15) : 'Diner'}`,
  });
  const qrCodeUrl = buildUpiQrUrl(upiUri, 230);

  return (
    <section className="section" id="reserve" style={{ background: 'var(--cream-light)', minHeight: '80vh' }}>
      <div className="section-header">
        <span className="section-label">Book a Table</span>
        <h1 className="section-title">Table <em>Reservations</em></h1>
        <p style={{ maxWidth: 600, margin: '12px auto 0', color: 'var(--text-light)', lineHeight: 1.6 }}>
          Plan your visit to The Moras Cafe. Reserve a cozy corner for studying, meetings, birthday celebrations, or a coffee date at B.M. Patil Circle, Vijayapura.
        </p>
        <div className="section-divider" />
      </div>

      <div className="reservation-page-split" style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        
        {/* Left Column: Form & Payment Flow */}
        <div id="reservation-form-anchor" className="reservation-form-container" style={{ margin: 0, width: '100%', maxWidth: 'none', background: '#FFFFFF', padding: '32px 28px', borderRadius: '24px', border: '1px solid var(--cream-dark)', boxShadow: '0 16px 40px rgba(15,61,62,0.06)' }}>
          
          {/* Step Progress Tracker */}
          {step < 3 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--cream-dark)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Step {step} of 2
                </span>
                <div style={{ fontWeight: 800, color: 'var(--green)', fontSize: '1.15rem', fontFamily: "'Playfair Display', serif" }}>
                  {step === 1 ? '1. Guest & Time Details' : '2. ₹10 Table Advance (UPI)'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: step >= 2 ? 'var(--green)' : 'var(--cream-dark)' }} />
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ================= STEP 1: DINING DETAILS ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div className="form-group">
                <label htmlFor="page-reserve-name">Full Name *</label>
                <input
                  id="page-reserve-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="page-reserve-email">
                  Email Address * <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-light)' }}>(Confirmation pass will be emailed here)</span>
                </label>
                <input
                  id="page-reserve-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anand@gmail.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="page-reserve-phone">Mobile Number *</label>
                <input
                  id="page-reserve-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="page-reserve-guests">Number of Guests *</label>
                  <select
                    id="page-reserve-guests"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="1">1 Person</option>
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5 People</option>
                    <option value="6">6 People</option>
                    <option value="7">7+ People</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="page-reserve-time">Time Slot *</label>
                  <select
                    id="page-reserve-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  >
                    <option value="">Select Time</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="7:30 PM">7:30 PM</option>
                    <option value="9:00 PM">9:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="page-reserve-date">Date of Visit *</label>
                <input
                  id="page-reserve-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="page-reserve-notes">Special Requests / Occasion (Optional)</label>
                <textarea
                  id="page-reserve-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Quiet corner for study, Anniversary decor, Birthday setup, high chair..."
                  rows={2}
                />
              </div>

              <button 
                className="btn-primary" 
                type="submit" 
                style={{ 
                  padding: '16px', 
                  fontSize: '1.02rem', 
                  marginTop: 8, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10
                }}
              >
                <span>Proceed to Reserve (₹10 Advance)</span>
                <span>→</span>
              </button>
            </form>
          )}

          {/* ================= STEP 2: ₹10 ZERO-FEE UPI PAYMENT ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Summary Chip */}
              <div style={{ background: 'var(--cream-light)', padding: '12px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--cream-dark)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>
                    {guests} Guests &middot; {date} at {time}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 2 }}>
                    {name} ({phone}) &middot; {email}
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  Edit
                </button>
              </div>

              {/* 100% Redeemable Callout */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 800, fontSize: '0.95rem' }}>
                  <span>✨ 100% Redeemable Booking Advance</span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
                  A nominal <strong>₹10 advance</strong> secures your reservation and eliminates no-shows. <strong>100% of this ₹10 will be deducted from your final cafe bill upon arrival!</strong>
                </p>
              </div>

              {/* Mobile Quick Pay Intent Button */}
              <div style={{ textAlign: 'center' }}>
                <a 
                  href={upiUri}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '14px 24px',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    background: '#0F3D3E',
                    color: '#FAF5EF',
                    borderRadius: 14,
                    boxShadow: '0 4px 16px rgba(15, 61, 62, 0.25)'
                  }}
                >
                  <span>⚡ Pay ₹10 with any UPI App</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>(GPay / PhonePe / Paytm)</span>
                </a>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 6 }}>
                  Tap button above on mobile to open your UPI app directly
                </div>
              </div>

              {/* QR Code Container */}
              <div style={{ 
                background: '#faf8f5', 
                border: '1px solid var(--cream-dark)', 
                borderRadius: 16, 
                padding: '20px', 
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--green)', marginBottom: 10 }}>
                  Or Scan QR Code to Pay ₹10
                </div>
                <img 
                  src={qrCodeUrl} 
                  alt="Scan QR to Pay ₹10" 
                  style={{ width: 190, height: 190, borderRadius: 10, border: '1px solid #e8e2d2', margin: '0 auto', display: 'block' }}
                />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 10 }}>
                  Open Google Pay, PhonePe, Paytm, or BHIM &amp; scan
                </div>
              </div>

              {/* Copy UPI ID */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream-light)', padding: '12px 16px', borderRadius: 12, fontSize: '0.88rem', border: '1px solid var(--cream-dark)' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: 'var(--text-light)', fontSize: '0.78rem', display: 'block' }}>UPI ID (VPA):</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '0.95rem' }}>{UPI_CONFIG.upiId}</strong>
                </div>
                <button
                  type="button"
                  onClick={copyUpiId}
                  style={{
                    background: copied ? '#059669' : 'var(--green)',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy UPI ID'}
                </button>
              </div>

              {/* UTR Input (Optional / Recommended) */}
              <div className="form-group">
                <label htmlFor="page-reserve-utr" style={{ fontSize: '0.88rem' }}>
                  UPI Reference Number / UTR / Txn ID <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-light)' }}>(Optional / Recommended)</span>
                </label>
                <input
                  id="page-reserve-utr"
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. 428901234567"
                  style={{ padding: '12px 14px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <button 
                  className="btn-secondary" 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '14px' }}
                  disabled={isSubmitting}
                >
                  ← Back to Details
                </button>
                <button 
                  className="btn-primary" 
                  type="button" 
                  onClick={handleCompleteReservation}
                  disabled={isSubmitting}
                  style={{ 
                    flex: 2, 
                    padding: '14px', 
                    fontWeight: 800, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 8,
                    background: '#047857'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Confirming Reservation...
                    </>
                  ) : (
                    '✅ I Have Paid ₹10 — Complete Booking'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS & CONFIRMATION EMAIL ================= */}
          {step === 3 && (
            <div className="order-success" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="success-icon" style={{ fontSize: '3.6rem', marginBottom: 14 }}>🥂</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', color: 'var(--green)', margin: '10px 0' }}>
                Table Reserved Successfully!
              </h3>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.7, maxWidth: 460, margin: '10px auto', fontSize: '1rem' }}>
                Thank you, <strong>{name}</strong>! Your table is confirmed for <strong>{guests} guests</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>

              {/* Pass Card */}
              <div className="order-card" style={{ textAlign: 'left', marginTop: 24, padding: '20px', background: 'var(--cream-light)', borderRadius: 14, border: '1px solid var(--cream-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Booking Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '1.05rem' }}>
                    #TMC-RES-{createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : 'CONFIRMED'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0' }}>
                  <strong>Advance:</strong> ₹10 Paid (UPI &bull; Redeemable against your final bill)
                </div>
                <div style={{ fontSize: '0.88rem', color: '#047857', fontWeight: 700, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✉️</span>
                  <span>Confirmation pass emailed to {email}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.88rem', color: 'var(--text-light)', marginTop: 16 }}>
                Please arrive 10&ndash;15 minutes before your slot. Tables are held for 15 minutes past the reserved time.
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <a 
                  href={`https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20regarding%20my%20table%20reservation%20%23TMC-RES-${createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}
                >
                  💬 WhatsApp Us
                </a>
                <button 
                  className="btn-primary" 
                  type="button" 
                  onClick={() => {
                    setStep(1);
                    setName('');
                    setEmail('');
                    setPhone('');
                    setDate('');
                    setTime('');
                    setNotes('');
                    setUpiRef('');
                    setCreatedBooking(null);
                  }}
                  style={{ flex: 1, padding: '14px', fontWeight: 700 }}
                >
                  Book Another Table
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Atmosphere Preview Card */}
        <div className="reservation-atmosphere-card" style={{ position: 'relative', background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--cream-dark)', boxShadow: '0 16px 40px rgba(15,61,62,0.08)' }}>
          <div className="brand-watermark-light reserve-watermark" aria-hidden="true" />

          <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
            <img 
              src="/images/instagram/garden_night_seating.webp" 
              alt="Serene garden table seating under warm evening pendant lights at The Moras Cafe"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(15, 61, 62, 0.92)', color: '#FAF5EF', padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#10b981' }}>●</span>
              <span>Garden Terrace Seating</span>
            </div>
          </div>
          <div style={{ padding: '28px 24px', position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--green)', margin: '0 0 10px' }}>
              Your Table Awaits
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Whether you prefer our quiet indoor library corners or our fairy-lit open-air garden, every table at The Moras Cafe is prepared with warm hospitality.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>🌿</span> Open-air garden &amp; cozy indoor spaces
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>📶</span> High-speed Wi-Fi &amp; charging outlets
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>🎯</span> Free board games &amp; curated book library
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>💳</span> ₹10 token advance (100% redeemable on your bill)
              </li>
            </ul>
            <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Need an instant booking?</span>
              <a href="tel:+919945446137" style={{ color: 'var(--green)', fontWeight: 800, textDecoration: 'none', fontSize: '0.92rem' }}>
                📞 +91 99454 46137
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 36, color: 'var(--text-light)', fontSize: '0.9rem' }}>
        📢 <strong>Note:</strong> We hold tables for up to 15 minutes past the reservation time. Timings: 10:00 AM – 10:30 PM.
      </div>
    </section>
  );
}

export default Reserve;
