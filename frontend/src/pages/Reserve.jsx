import { useState, useEffect } from 'react';
import api from '../services/api';
import useSEO from '../hooks/useSEO';
import { UPI_CONFIG, buildUpiUri, buildUpiQrUrl } from '../config/upi';

function Reserve() {
  useSEO({
    title: 'Host Birthday Events (₹199)',
    description: 'Host your birthday celebration at The Moras Cafe for ₹199. Dedicated illuminated Happy Birthday backdrop with warm ambient lights, table setup, and party seating. Book with a ₹59 advance.'
  });

  const [step, setStep] = useState(1); // 1: Details, 2: UPI ₹59 Advance Payment, 3: Success
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdayPerson, setBirthdayPerson] = useState('');
  const [guests, setGuests] = useState('4');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [upiRef, setUpiRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Create pending birthday reservation before moving to ₹59 UPI advance payment
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide the name of the person booking.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (Number(guests) < 1) {
      setError('Number of people joining must be at least 1.');
      return;
    }

    if (!date || !time) {
      setError('Please select both a celebration date and time slot.');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address for your confirmation ticket, or leave it blank.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/reservations', {
        name: name.trim(),
        phone: cleanedPhone,
        guests: Number(guests),
        date,
        time,
        birthdayPerson: birthdayPerson.trim(),
        email: email.trim().toLowerCase(),
        notes: notes.trim(),
        eventType: 'birthday',
        amount: UPI_CONFIG.bookingAmount,
        packagePrice: UPI_CONFIG.birthdayPackagePrice,
        remainingBalance: UPI_CONFIG.birthdayRemainingBalance,
      });

      setCreatedBooking(res.data);
      setIsSubmitting(false);

      // If an existing PhonePe payment matched instantly upon booking creation
      if (res.data.status === 'confirmed') {
        setStep(3);
        if (window.trackEvent) {
          window.trackEvent('birthday_reserve_success', { 
            guests, 
            date, 
            time, 
            amount: UPI_CONFIG.bookingAmount 
          });
        }
      } else {
        setStep(2);
      }

      // Smooth scroll back to form top if on mobile
      const formElem = document.getElementById('reservation-form-anchor');
      if (formElem) formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not initiate birthday booking. Please try again.');
    }
  };

  // Step 2: Real-time Polling for Instant PhonePe Webhook Confirmation
  useEffect(() => {
    if (step !== 2 || !createdBooking?._id) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/reservations/status/${createdBooking._id}`);
        if (isMounted && res.data && res.data.status === 'confirmed') {
          clearInterval(pollInterval);
          setCreatedBooking((prev) => ({ ...prev, ...res.data }));
          setStep(3);
          if (window.trackEvent) {
            window.trackEvent('birthday_reserve_success', { 
              guests: res.data.guests, 
              date: res.data.date, 
              time: res.data.time, 
              amount: res.data.amount 
            });
          }
        }
      } catch (err) {
        // Polling gracefully ignores transient network glitches
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [step, createdBooking?._id]);

  // Step 2 Fallback: Manual Confirmation or UTR submission
  const handleCompleteReservation = async () => {
    if (!createdBooking?._id) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.patch(`/reservations/${createdBooking._id}/submit-utr`, {
        upiRef: upiRef.trim(),
      });

      setCreatedBooking(res.data);
      setIsSubmitting(false);
      setStep(3);

      if (window.trackEvent) {
        window.trackEvent('birthday_reserve_success', { 
          guests, 
          date, 
          time, 
          amount: UPI_CONFIG.bookingAmount 
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not verify payment yet. If you already completed UPI payment, please enter your 12-digit UTR reference or wait a moment.');
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_CONFIG.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const upiUri = buildUpiUri({
    amount: UPI_CONFIG.bookingAmount,
    note: `Birthday Booking - ${name ? name.slice(0, 15) : 'Guest'}`,
  });
  const qrCodeUrl = buildUpiQrUrl(upiUri, 240);

  return (
    <section className="section" style={{ minHeight: '85vh', paddingTop: '100px' }}>
      
      {/* Header */}
      <div className="section-header" style={{ textAlign: 'center', marginBottom: 36 }}>
        <span className="section-label" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
          🎂 Birthday Events at The Moras Cafe
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2.5rem', color: 'var(--green)', margin: '14px 0 10px' }}>
          Celebrate Birthdays for Just ₹199
        </h1>
        <p style={{ color: 'var(--text-light)', maxWidth: 640, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Complete celebration setup featuring our dedicated <strong>birthday stand with &ldquo;Happy Birthday&rdquo; written in the background with warm ambient lights</strong>, decorated table, plates, and cake cutting knife!
        </p>
      </div>

      <div 
        id="reservation-form-anchor"
        className="reservation-grid" 
        style={{ 
          maxWidth: 1080, 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: 36,
          alignItems: 'start'
        }}
      >
        
        {/* Left Column: Multi-step Interactive Form */}
        <div 
          className="reservation-card" 
          style={{ 
            background: 'var(--white)', 
            padding: '32px 28px', 
            borderRadius: 20, 
            border: '1px solid var(--cream-dark)', 
            boxShadow: '0 12px 36px rgba(15,61,62,0.06)' 
          }}
        >
          
          {/* Progress Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--cream-dark)', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>
                {step === 1 && 'Step 1 of 2: Event Details'}
                {step === 2 && 'Step 2 of 2: ₹59 Advance'}
                {step === 3 && 'Booking Confirmed!'}
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--green)', margin: '4px 0 0' }}>
                {step === 1 && 'Host Your Birthday'}
                {step === 2 && 'Pay ₹59 Advance Token'}
                {step === 3 && '🎉 Celebration Confirmed!'}
              </h2>
            </div>
            {step < 3 && (
              <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 800 }}>
                ₹199 Setup Fee
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ================= STEP 1: BIRTHDAY DETAILS ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Highlight Card: Stand with Lights & Transparent Price */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 800, fontSize: '0.94rem' }}>
                  <span>✨</span>
                  <span>Dedicated Birthday Stand with Lights</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#166534', lineHeight: 1.5 }}>
                  We set up our illuminated <strong>&ldquo;Happy Birthday&rdquo; stand with ambient lights</strong>, celebration table, plates, and cake cutting knife for your group.
                </p>
              </div>

              {/* Crucial Cake Notice */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c2410c', fontWeight: 800, fontSize: '0.88rem' }}>
                  <span>🎂</span>
                  <span>BRING YOUR OWN CAKE (BYOC)</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#9a3412', lineHeight: 1.5 }}>
                  <strong>Please bring your favorite birthday cake with you!</strong> We do not offer or sell cakes in the café. We provide the complete illuminated stand, ambiance, plates, and cutlery.
                </p>
              </div>

              {/* 1. Name of Person Booking */}
              <div className="form-group">
                <label htmlFor="page-bday-name">Name of Person Booking *</label>
                <input
                  id="page-bday-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  required
                />
              </div>

              {/* 2. Mobile Number */}
              <div className="form-group">
                <label htmlFor="page-bday-phone">Mobile Number *</label>
                <input
                  id="page-bday-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              {/* 3. Birthday Person & Number of People Joining */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="page-bday-person">Birthday Person&apos;s Name</label>
                  <input
                    id="page-bday-person"
                    type="text"
                    value={birthdayPerson}
                    onChange={(e) => setBirthdayPerson(e.target.value)}
                    placeholder="e.g. Priya"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="page-bday-guests">Number of People Joining *</label>
                  <select
                    id="page-bday-guests"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  >
                    <option value="2">2 People</option>
                    <option value="3">3 People</option>
                    <option value="4">4 People</option>
                    <option value="5">5 People</option>
                    <option value="6">6 People</option>
                    <option value="7">7 People</option>
                    <option value="8">8 People</option>
                    <option value="10">10 People</option>
                    <option value="12">12 People</option>
                    <option value="15">15+ People</option>
                  </select>
                </div>
              </div>

              {/* 4. Date & Time */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="page-bday-date">Celebration Date *</label>
                  <input
                    id="page-bday-date"
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="page-bday-time">Time Slot *</label>
                  <select
                    id="page-bday-time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  >
                    <option value="">Select Time</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:30 PM">12:30 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:30 PM">5:30 PM</option>
                    <option value="7:00 PM">7:00 PM</option>
                    <option value="8:30 PM">8:30 PM</option>
                    <option value="9:30 PM">9:30 PM</option>
                  </select>
                </div>
              </div>

              {/* 5. Optional Email */}
              <div className="form-group">
                <label htmlFor="page-bday-email">
                  Email Address <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-light)' }}>(Optional &mdash; for confirmation pass)</span>
                </label>
                <input
                  id="page-bday-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anand@gmail.com"
                />
              </div>

              {/* 6. Special Requests */}
              <div className="form-group">
                <label htmlFor="page-bday-notes">Special Requests / Song requests (Optional)</label>
                <textarea
                  id="page-bday-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Surprise entry, favorite music track, garden seating preferred..."
                  rows={2}
                />
              </div>

              {/* Transparent Billing Explanation Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.55 }}>
                <strong style={{ color: '#0f3d3e' }}>💰 Transparent Billing Calculation:</strong>
                <div style={{ marginTop: 4 }}>
                  Birthday Setup Package is <strong>₹199</strong>. Pay only <strong>₹59 advance</strong> now to secure your illuminated backdrop &amp; slot.
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '8px 12px', marginTop: 6, fontWeight: 700, color: '#065f46' }}>
                    Final Cafe Bill = Total amount of food/drinks you eat in cafe + ₹140 (₹199 &minus; ₹59 advance)
                  </div>
                </div>
              </div>

              <button 
                className="btn-primary" 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  padding: '16px', 
                  fontSize: '1.02rem', 
                  marginTop: 6, 
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  background: '#0F3D3E'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Preparing Birthday Booking...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Book (Pay ₹59 Advance)</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: ₹59 ZERO-FEE UPI PAYMENT ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              
              {/* Summary Chip */}
              <div style={{ background: 'var(--cream-light)', padding: '12px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--cream-dark)' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>
                    {guests} People &middot; {date} at {time}
                  </div>
                  {birthdayPerson && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      🎂 Celebrating: <strong>{birthdayPerson}</strong>
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Edit
                </button>
              </div>

              {/* Real-Time PhonePe Listening Pulse Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 12,
                padding: '12px 16px',
                color: '#065f46',
                fontSize: '0.88rem',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                <span className="live-pulse-dot" />
                <span>Listening for your ₹59 advance payment in real-time...</span>
              </div>

              {/* Package Breakdown Box */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', marginBottom: 6 }}>
                  <span style={{ color: '#166534' }}>Birthday Setup Package (Stand with lights):</span>
                  <strong>₹199</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#047857' }}>
                  <span>Advance Token to Pay Now:</span>
                  <span>₹59</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #bbf7d0' }}>
                  <span>Remaining Setup Balance (Payable at cafe):</span>
                  <span>₹140</span>
                </div>
              </div>

              {/* Mobile Quick Pay Intent Button */}
              <div className="mobile-upi-intent-wrap" style={{ textAlign: 'center' }}>
                <a 
                  href={upiUri}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '15px 24px',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    background: '#0F3D3E',
                    color: '#FAF5EF',
                    borderRadius: 12,
                    boxShadow: '0 4px 14px rgba(15, 61, 62, 0.25)'
                  }}
                >
                  <span>⚡ Pay ₹59 via UPI App</span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.85 }}>(GPay / PhonePe / Paytm)</span>
                </a>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 8 }}>
                  Tap above on mobile to open your UPI app directly
                </div>
              </div>

              {/* QR Code Container */}
              <div style={{ 
                background: '#fff', 
                border: '1px solid var(--cream-dark)', 
                borderRadius: 16, 
                padding: '20px', 
                textAlign: 'center',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--green)', marginBottom: 12 }}>
                  Or Scan QR to Pay ₹59 Advance
                </div>
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to Pay ₹59 Advance" 
                  style={{ width: 190, height: 190, borderRadius: 10, border: '1px solid #e8e2d2', margin: '0 auto', display: 'block' }}
                />
                <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 10 }}>
                  Scan with any scanner or UPI app (PhonePe, GPay, Paytm)
                </div>
              </div>

              {/* Copy UPI ID */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream-light)', padding: '12px 16px', borderRadius: 12, fontSize: '0.9rem', border: '1px solid var(--cream-dark)' }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span style={{ color: 'var(--text-light)', fontSize: '0.78rem', display: 'block' }}>UPI ID (VPA):</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)' }}>{UPI_CONFIG.upiId}</strong>
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
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {copied ? '✓ Copied!' : 'Copy ID'}
                </button>
              </div>

              {/* UTR Input (Optional / Recommended) */}
              <div className="form-group">
                <label htmlFor="page-bday-utr" style={{ fontSize: '0.9rem' }}>
                  UPI Ref / UTR / Txn ID <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-light)' }}>(Optional / Recommended)</span>
                </label>
                <input
                  id="page-bday-utr"
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. 428901234567"
                  style={{ padding: '12px 14px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button 
                  className="btn-secondary" 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '14px' }}
                  disabled={isSubmitting}
                >
                  ← Back
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
                      Confirming Booking...
                    </>
                  ) : (
                    '✅ I Have Paid ₹59 — Complete Booking'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS & CONFIRMATION PASS ================= */}
          {step === 3 && (
            <div className="order-success" style={{ textAlign: 'center', padding: '20px 0' }}>
              <div className="success-icon" style={{ fontSize: '3.6rem', marginBottom: 14 }}>🎂✨</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', color: 'var(--green)', margin: '10px 0' }}>
                Birthday Celebration Confirmed!
              </h3>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.7, maxWidth: 460, margin: '10px auto', fontSize: '1rem' }}>
                Thank you, <strong>{name}</strong>! We are thrilled to host {birthdayPerson ? <strong>{birthdayPerson}&apos;s</strong> : 'your'} birthday celebration for <strong>{guests} people</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>

              {/* BYOC Cake Reminder */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', margin: '16px auto', maxWidth: 460, textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c2410c' }}>🎂 DON&apos;T FORGET YOUR CAKE!</div>
                <div style={{ fontSize: '0.84rem', color: '#9a3412', marginTop: 3 }}>
                  Please bring your favorite birthday cake with you. We will have the glowing Happy Birthday stand with ambient lights, plates, and cake knife ready.
                </div>
              </div>

              {/* Pass Card */}
              <div className="order-card" style={{ textAlign: 'left', marginTop: 20, padding: '20px', background: 'var(--cream-light)', borderRadius: 14, border: '1px solid var(--cream-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Booking Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '1.05rem' }}>
                    #TMC-BDAY-{createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : 'CONFIRMED'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Birthday Setup Package:</span>
                  <strong>₹199</strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0', display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                  <span>Advance Paid (UPI):</span>
                  <strong>₹59 (Confirmed)</strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0', display: 'flex', justifyContent: 'space-between', color: '#c2410c', fontWeight: 700 }}>
                  <span>Remaining Setup Balance:</span>
                  <span>₹140 (Payable at cafe)</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                  Final Cafe Bill = Food &amp; drinks ordered + ₹140
                </div>
                {email && (
                  <div style={{ fontSize: '0.88rem', color: '#047857', fontWeight: 700, marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✉️</span>
                    <span>Confirmation pass emailed to {email}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <a 
                  href={`https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20regarding%20my%20birthday%20booking%20%23TMC-BDAY-${createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}
                >
                  💬 WhatsApp Coordinator
                </a>
                <button 
                  className="btn-primary" 
                  type="button" 
                  onClick={() => {
                    setStep(1);
                    setName('');
                    setPhone('');
                    setBirthdayPerson('');
                    setDate('');
                    setTime('');
                    setEmail('');
                    setNotes('');
                    setUpiRef('');
                    setCreatedBooking(null);
                  }}
                  style={{ flex: 1, padding: '14px', fontWeight: 700 }}
                >
                  Book Another Event
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Birthday Atmosphere Card */}
        <div className="reservation-atmosphere-card" style={{ position: 'relative', background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--cream-dark)', boxShadow: '0 16px 40px rgba(15,61,62,0.08)' }}>
          <div className="brand-watermark-light reserve-watermark" aria-hidden="true" />

          <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
            <img 
              src="/images/instagram/garden_night_seating.webp" 
              alt="Birthday celebration setup under warm lights at The Moras Cafe"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(15, 61, 62, 0.92)', color: '#FAF5EF', padding: '6px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#fbbf24' }}>★</span>
              <span>Birthday Event Setup &bull; ₹199</span>
            </div>
          </div>
          <div style={{ padding: '28px 24px', position: 'relative', zIndex: 1 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--green)', margin: '0 0 10px' }}>
              Your Celebration Sanctuary
            </h3>
            <p style={{ color: 'var(--text-light)', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 20px' }}>
              Make birthdays unforgettable at The Moras Cafe with our illuminated backdrop, cozy seating, artisan food, and personalized party assistance.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>✨</span> <strong>Illuminated &ldquo;Happy Birthday&rdquo; stand with lights</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: '#c2410c', fontWeight: 700 }}>
                <span>🎂</span> <strong>Bring Your Own Cake (BYOC &mdash; we don&apos;t offer cake)</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>🍽️</span> Cake knife, serving plates, and table setup included
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>💰</span> ₹199 setup package with ₹59 advance
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', color: 'var(--green)', fontWeight: 600 }}>
                <span>🧾</span> Transparent bill: Cafe food eaten + ₹140 balance
              </li>
            </ul>
            <div style={{ borderTop: '1px solid var(--cream-dark)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Need coordinator assistance?</span>
              <a href="tel:+919945446137" style={{ color: 'var(--green)', fontWeight: 800, textDecoration: 'none', fontSize: '0.92rem' }}>
                📞 +91 99454 46137
              </a>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 36, color: 'var(--text-light)', fontSize: '0.9rem' }}>
        📢 <strong>Note:</strong> We do not offer or sell cakes in the café. Please bring your own birthday cake. Timings: 10:00 AM – 10:30 PM.
      </div>
    </section>
  );
}

export default Reserve;
