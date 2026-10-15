import { useEffect, useState } from 'react';
import api from '../services/api';
import { UPI_CONFIG, buildUpiUri, buildUpiQrUrl } from '../config/upi';

function ReservationModal({ open, onClose }) {
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

  useEffect(() => {
    if (open) {
      setStep(1);
      setName('');
      setEmail('');
      setPhone('');
      setGuests('2');
      setDate('');
      setTime('');
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

  // Step 1: Create pending reservation before moving to ₹10 UPI payment
  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !phone.trim() || !date || !time) {
      setError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address for confirmation.');
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

    setIsSubmitting(true);
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
      });

      setCreatedBooking(res.data);
      setIsSubmitting(false);

      // If an existing PhonePe payment matched instantly upon booking creation
      if (res.data.status === 'confirmed') {
        setStep(3);
        if (window.trackEvent) {
          window.trackEvent('reserve_success', { 
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
      setError(err.response?.data?.message || 'Could not initiate reservation. Please try again.');
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
            window.trackEvent('reserve_success', { 
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
        window.trackEvent('reserve_success', { 
          guests, 
          date, 
          time, 
          amount: UPI_CONFIG.bookingAmount 
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not confirm reservation. Please try again.');
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
    note: `Table Booking - ${name ? name.slice(0, 15) : 'Diner'}`,
  });
  const qrCodeUrl = buildUpiQrUrl(upiUri, 220);

  return (
    <div className="modal-backdrop open" role="dialog" aria-modal="true" aria-labelledby="modal-reserve-title">
      <div className="modal-card" style={{ maxWidth: step === 2 ? 520 : 490 }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span id="modal-reserve-title" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {step === 1 && '📅 Book a Table'}
              {step === 2 && '💳 Confirm ₹10 Table Advance'}
              {step === 3 && '🥂 Reservation Confirmed'}
            </span>
            {step < 3 && (
              <span style={{ fontSize: '0.78rem', background: 'rgba(245, 230, 200, 0.2)', padding: '2px 8px', borderRadius: 20, color: 'var(--cream)' }}>
                Step {step} of 2
              </span>
            )}
          </div>
          <button className="btn-secondary" type="button" onClick={onClose} aria-label="Close reservation modal">
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '22px 24px' }}>
          
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ================= STEP 1: DINING DETAILS ================= */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              
              <div className="form-group">
                <label htmlFor="modal-reserve-name">Your Full Name *</label>
                <input
                  id="modal-reserve-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anand Kulkarni"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-reserve-email">
                  Email Address * <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-light)' }}>(Confirmation pass sent here)</span>
                </label>
                <input
                  id="modal-reserve-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. anand@gmail.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-reserve-phone">Mobile Number *</label>
                <input
                  id="modal-reserve-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-reserve-guests">Party Size *</label>
                  <select
                    id="modal-reserve-guests"
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
                  <label htmlFor="modal-reserve-time">Time Slot *</label>
                  <select
                    id="modal-reserve-time"
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
                <label htmlFor="modal-reserve-date">Reservation Date *</label>
                <input
                  id="modal-reserve-date"
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-reserve-notes">Special Requests (Optional)</label>
                <textarea
                  id="modal-reserve-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Birthday celebration, Garden view, Quiet corner"
                  rows={2}
                />
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
                  fontWeight: 700,
                  fontSize: '1rem'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <span>Preparing Reservation...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Reserve (₹10 Advance)</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: ZERO-FEE UPI PAYMENT (₹10) ================= */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Summary Chip */}
              <div style={{ background: 'var(--cream-light)', padding: '10px 14px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', border: '1px solid var(--cream-dark)' }}>
                <div>
                  <strong>{guests} Guests</strong> &middot; {date} &middot; {time}
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
                <span>Listening for your ₹10 payment in real-time...</span>
              </div>

              {/* 100% Redeemable Advance Callout */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 700, fontSize: '0.92rem' }}>
                  <span>✨ 100% Redeemable Token</span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#166534', lineHeight: 1.5 }}>
                  A nominal <strong>₹10 advance</strong> secures your table and guarantees your seating. <strong>100% of this ₹10 will be deducted from your final cafe bill!</strong>
                </p>
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
                  <span>⚡ Pay ₹10 via UPI App</span>
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
                  Or Scan QR to Pay ₹10
                </div>
                <img 
                  src={qrCodeUrl} 
                  alt="Scan to Pay ₹10" 
                  style={{ width: 175, height: 175, borderRadius: 8, border: '1px solid #e8e2d2', margin: '0 auto', display: 'block' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: 8 }}>
                  Scan with any scanner or UPI app
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
                <label htmlFor="modal-reserve-utr" style={{ fontSize: '0.85rem' }}>
                  UPI Ref / UTR / Txn ID <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-light)' }}>(Optional / Recommended)</span>
                </label>
                <input
                  id="modal-reserve-utr"
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
                    fontWeight: 700, 
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
                    '✅ I Have Paid ₹10 — Confirm'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SUCCESS & EMAIL SENT ================= */}
          {step === 3 && (
            <div className="order-success" style={{ padding: '16px 0', textAlign: 'center' }}>
              <div className="success-icon" style={{ fontSize: '3.2rem', marginBottom: 10 }}>🥂</div>
              <div className="success-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: 'var(--green)' }}>
                Table Reserved!
              </div>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.6, marginTop: 8, fontSize: '0.95rem' }}>
                Thank you, <strong>{name}</strong>! We have confirmed your table for <strong>{guests} guests</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>

              {/* Confirmation Pass Box */}
              <div className="order-card" style={{ textAlign: 'left', marginTop: 16, padding: '16px 18px', background: 'var(--cream-light)', borderRadius: 12, border: '1px solid var(--cream-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)' }}>
                    #TMC-RES-{createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : 'CONFIRMED'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.88rem', margin: '4px 0' }}>
                  <strong>Advance:</strong> ₹10 Paid (UPI &bull; Redeemable against your bill)
                </div>
                <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>✉️</span>
                  <span>Confirmation email sent to {email}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 14 }}>
                Please arrive 10-15 minutes early. Tables are held for 15 minutes past the reserved time.
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <a 
                  href={`https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20regarding%20my%20table%20reservation%20%23TMC-RES-${createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', textDecoration: 'none', textAlign: 'center', fontSize: '0.9rem' }}
                >
                  💬 WhatsApp Us
                </a>
                <button 
                  className="btn-primary" 
                  type="button" 
                  onClick={onClose} 
                  style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
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
