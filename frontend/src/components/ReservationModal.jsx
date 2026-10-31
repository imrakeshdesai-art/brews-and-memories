import { useEffect, useState } from 'react';
import api from '../services/api';
import { UPI_CONFIG, buildUpiUri, buildUpiQrUrl } from '../config/upi';

function ReservationModal({ open, onClose }) {
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

  useEffect(() => {
    if (open) {
      setStep(1);
      setName('');
      setPhone('');
      setBirthdayPerson('');
      setGuests('4');
      setDate('');
      setTime('');
      setEmail('');
      setNotes('');
      setUpiRef('');
      setCopied(false);
      setCreatedBooking(null);
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  // Accessibility: Focus trap & Escape key close
  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement;
    const timer = setTimeout(() => {
      const modalElement = document.querySelector('.modal-card');
      if (!modalElement) return;

      const focusable = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose]);

  // Step 1: Create pending birthday reservation before moving to ₹59 UPI payment
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
      setError('Please select both a date and a time slot.');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address, or leave it blank.');
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

  if (!open) return null;

  const upiUri = buildUpiUri({
    amount: UPI_CONFIG.bookingAmount,
    note: `Birthday Booking - ${name ? name.slice(0, 15) : 'Guest'}`,
  });
  const qrCodeUrl = buildUpiQrUrl(upiUri, 220);

  return (
    <div className="modal-backdrop open" role="dialog" aria-modal="true" aria-labelledby="modal-reserve-title">
      <div className="modal-card" style={{ maxWidth: step === 2 ? 520 : 510, maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span id="modal-reserve-title" style={{ fontWeight: 700, fontSize: '1.08rem' }}>
              {step === 1 && '🎂 Host Birthday Event'}
              {step === 2 && '💳 Pay ₹59 Booking Advance'}
              {step === 3 && '🎉 Birthday Celebration Confirmed!'}
            </span>
            {step === 1 && (
              <span style={{ fontSize: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 20, color: '#047857', fontWeight: 700 }}>
                ₹199 Setup Package
              </span>
            )}
            {step < 3 && (
              <span style={{ fontSize: '0.75rem', background: 'rgba(245, 230, 200, 0.25)', padding: '2px 8px', borderRadius: 20, color: 'var(--cream)' }}>
                Step {step} of 2
              </span>
            )}
          </div>
          <button className="btn-secondary" type="button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 22px' }}>
          
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ================= STEP 1: BIRTHDAY DETAILS ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              
              {/* Highlight Card: Stand with Lights & Transparent Price */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#047857', fontWeight: 800, fontSize: '0.92rem' }}>
                  <span>✨</span>
                  <span>Complete Birthday Setup for Just ₹199</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
                  Includes our dedicated <strong>birthday stand with &ldquo;Happy Birthday&rdquo; backdrop and warm glowing lights</strong>, celebration table setup, plates, and cake cutting knife!
                </p>
              </div>

              {/* Crucial Cake Policy Callout */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#c2410c', fontWeight: 800, fontSize: '0.86rem' }}>
                  <span>🎂</span>
                  <span>BRING YOUR OWN CAKE (BYOC)</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#9a3412', lineHeight: 1.5 }}>
                  <strong>Please bring your favorite birthday cake with you!</strong> We do not offer or sell cakes. We provide the complete illuminated stand, ambiance, plates, and cutlery.
                </p>
              </div>

              {/* 1. Name of Person Booking */}
              <div className="form-group">
                <label htmlFor="modal-bday-name">Name of Person Booking *</label>
                <input
                  id="modal-bday-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  required
                />
              </div>

              {/* 2. Mobile Number */}
              <div className="form-group">
                <label htmlFor="modal-bday-phone">Mobile Number *</label>
                <input
                  id="modal-bday-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              {/* 3. Birthday Person Name & Number of People Joining */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-bday-person">Birthday Person&apos;s Name</label>
                  <input
                    id="modal-bday-person"
                    type="text"
                    value={birthdayPerson}
                    onChange={(e) => setBirthdayPerson(e.target.value)}
                    placeholder="e.g. Priya"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-bday-guests">Number of People Joining *</label>
                  <select
                    id="modal-bday-guests"
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

              {/* 4. Date & Time Slot */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-bday-date">Celebration Date *</label>
                  <input
                    id="modal-bday-date"
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-bday-time">Time Slot *</label>
                  <select
                    id="modal-bday-time"
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
                <label htmlFor="modal-bday-email">
                  Email Address <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-light)' }}>(Optional &mdash; for confirmation pass)</span>
                </label>
                <input
                  id="modal-bday-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anand@gmail.com"
                />
              </div>

              {/* 6. Special Requests */}
              <div className="form-group">
                <label htmlFor="modal-bday-notes">Special Requests / Song requests (Optional)</label>
                <textarea
                  id="modal-bday-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Surprise entry, favorite music track, extra seating..."
                  rows={2}
                />
              </div>

              {/* Transparent Billing Explanation */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#334155', lineHeight: 1.5 }}>
                <strong>💰 How Billing Works:</strong>
                <div style={{ marginTop: 4 }}>
                  Birthday Setup is <strong>₹199</strong>. Pay only <strong>₹59 advance</strong> now to book your illuminated stand &amp; slot. After your celebration, your café bill is simply:
                  <div style={{ fontWeight: 700, color: '#0f3d3e', marginTop: 3 }}>
                    Final Bill = Total amount of food/drinks ordered + ₹140 (₹199 &minus; ₹59 advance)
                  </div>
                </div>
              </div>

              <button 
                className="btn-primary" 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  marginTop: 6, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8, 
                  padding: '14px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  background: '#0F3D3E'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

          {/* ================= STEP 2: ZERO-FEE ₹59 UPI ADVANCE PAYMENT ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              
              {/* Summary Chip */}
              <div style={{ background: 'var(--cream-light)', padding: '10px 14px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', border: '1px solid var(--cream-dark)' }}>
                <div>
                  <strong>{guests} People</strong> &middot; {date} &middot; {time}
                  {birthdayPerson && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--green)' }}>🎂 For: {birthdayPerson}</span>}
                </div>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.82rem', fontWeight: 600 }}
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
                padding: '10px 14px',
                color: '#065f46',
                fontSize: '0.84rem',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                <span className="live-pulse-dot" />
                <span>Listening for your ₹59 advance payment in real-time...</span>
              </div>

              {/* Package Breakdown Box */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: 4 }}>
                  <span style={{ color: '#166534' }}>Birthday Setup Package (Stand with lights):</span>
                  <strong>₹199</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 800, color: '#047857' }}>
                  <span>Advance Token to Pay Now:</span>
                  <span>₹59</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#555', marginTop: 4, paddingTop: 4, borderTop: '1px dashed #bbf7d0' }}>
                  <span>Balance setup fee payable after celebration:</span>
                  <span>₹140</span>
                </div>
              </div>

              {/* Mobile Quick Pay Button */}
              <div className="mobile-upi-intent-wrap" style={{ textAlign: 'center' }}>
                <a 
                  href={upiUri}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '13px 20px',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '1.02rem',
                    background: '#0F3D3E',
                    color: '#FAF5EF',
                    borderRadius: 12,
                    boxShadow: '0 4px 14px rgba(15, 61, 62, 0.25)'
                  }}
                >
                  <span>⚡ Pay ₹59 via UPI App</span>
                  <span style={{ fontSize: '0.82rem', opacity: 0.85 }}>(GPay / PhonePe / Paytm)</span>
                </a>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: 6 }}>
                  Tap above on mobile to open your UPI app directly
                </div>
              </div>

              {/* QR Code Container */}
              <div style={{ 
                background: '#fff', 
                border: '1px solid var(--cream-dark)', 
                borderRadius: 14, 
                padding: '16px', 
                textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--green)', marginBottom: 8 }}>
                  Or Scan QR to Pay ₹59 Advance
                </div>
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to Pay ₹59 Birthday Advance" 
                  style={{ width: 175, height: 175, borderRadius: 8, border: '1px solid #e8e2d2', margin: '0 auto', display: 'block' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 8 }}>
                  Scan with any scanner or UPI app (PhonePe, GPay, Paytm)
                </div>
              </div>

              {/* Copy UPI ID */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cream-light)', padding: '10px 14px', borderRadius: 10, fontSize: '0.85rem', border: '1px solid var(--cream-dark)' }}>
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
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
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
                <label htmlFor="modal-bday-utr" style={{ fontSize: '0.85rem' }}>
                  UPI Ref / UTR / Txn ID <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-light)' }}>(Optional / Recommended)</span>
                </label>
                <input
                  id="modal-bday-utr"
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="e.g. 428901234567"
                  style={{ padding: '10px 12px' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button 
                  className="btn-secondary" 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '12px' }}
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
                    padding: '12px', 
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
                      <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      Verifying Booking...
                    </>
                  ) : (
                    '✅ I Have Paid ₹59 — Confirm'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS & EVENT CONFIRMED ================= */}
          {step === 3 && (
            <div className="order-success" style={{ padding: '12px 0', textAlign: 'center' }}>
              <div className="success-icon" style={{ fontSize: '3.2rem', marginBottom: 8 }}>🎂✨</div>
              <div className="success-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.45rem', color: 'var(--green)' }}>
                Birthday Event Confirmed!
              </div>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.6, marginTop: 8, fontSize: '0.92rem' }}>
                Thank you, <strong>{name}</strong>! We are excited to host {birthdayPerson ? <strong>{birthdayPerson}&apos;s</strong> : 'your'} birthday celebration for <strong>{guests} people</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>

              {/* BYOC Cake Reminder */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '10px 14px', margin: '14px 0', textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c2410c' }}>🎂 DON&apos;T FORGET YOUR CAKE!</div>
                <div style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: 2 }}>
                  Please bring your favorite birthday cake with you. We will have the glowing Happy Birthday stand with ambient lights, plates, and cake knife ready.
                </div>
              </div>

              {/* Confirmation Pass Box */}
              <div className="order-card" style={{ textAlign: 'left', marginTop: 12, padding: '14px 16px', background: 'var(--cream-light)', borderRadius: 12, border: '1px solid var(--cream-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Booking Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '0.95rem' }}>
                    #TMC-BDAY-{createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : 'CONFIRMED'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.85rem', margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Birthday Setup Package:</span>
                  <strong>₹199</strong>
                </div>
                <div style={{ fontSize: '0.85rem', margin: '4px 0', display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                  <span>Advance Paid (UPI):</span>
                  <strong>₹59 (Confirmed)</strong>
                </div>
                <div style={{ fontSize: '0.85rem', margin: '4px 0', display: 'flex', justifyContent: 'space-between', color: '#c2410c', fontWeight: 700 }}>
                  <span>Remaining Setup Balance:</span>
                  <span>₹140 (Payable at cafe)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #cbd5e1' }}>
                  Final Cafe Bill = Food &amp; drinks ordered + ₹140
                </div>
                {email && (
                  <div style={{ fontSize: '0.82rem', color: '#047857', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>✉️</span>
                    <span>Confirmation pass sent to {email}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <a 
                  href={`https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20regarding%20my%20birthday%20booking%20%23TMC-BDAY-${createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', textDecoration: 'none', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  💬 WhatsApp Coordinator
                </a>
                <button 
                  className="btn-primary" 
                  type="button" 
                  onClick={onClose} 
                  style={{ flex: 1, padding: '12px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ReservationModal;
