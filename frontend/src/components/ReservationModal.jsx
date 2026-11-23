import { useEffect, useState } from 'react';
import api from '../services/api';
import { UPI_CONFIG } from '../config/upi';

function ReservationModal({ open, onClose }) {
  const [step, setStep] = useState(1); // 1: Details Form, 2: Request Submitted Success
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdayPerson, setBirthdayPerson] = useState('');
  const [guests, setGuests] = useState('4');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
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

  // Submit Birthday Reservation Request
  const handleSubmitRequest = async (e) => {
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
        amount: UPI_CONFIG.bookingAmount || 59,
        packagePrice: UPI_CONFIG.birthdayPackagePrice || 199,
        remainingBalance: UPI_CONFIG.birthdayRemainingBalance || 140,
      });

      setCreatedBooking(res.data);
      setIsSubmitting(false);
      setStep(2);

      if (window.trackEvent) {
        window.trackEvent('birthday_reserve_request_submitted', { 
          guests, 
          date, 
          time,
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not submit birthday booking request. Please try again.');
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop open" role="dialog" aria-modal="true" aria-labelledby="modal-reserve-title">
      <div className="modal-card" style={{ maxWidth: 510, maxHeight: '92vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span id="modal-reserve-title" style={{ fontWeight: 700, fontSize: '1.08rem' }}>
              {step === 1 ? '🎂 Host Birthday Event' : '🎉 Request Submitted!'}
            </span>
            <span style={{ fontSize: '0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 20, color: '#047857', fontWeight: 700 }}>
              ₹199 Setup Package
            </span>
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

          {/* ================= STEP 1: BIRTHDAY DETAILS FORM ================= */}
          {step === 1 && (
            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              
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
                <label htmlFor="modal-bday-phone">Mobile Number (We will contact you here) *</label>
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

              {/* Clear Advance & Contact Workflow Note */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', fontSize: '0.84rem', color: '#1e3a8a', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span>📞</span>
                  <span>How Confirmation &amp; Advance Work:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.82rem', color: '#1e40af' }}>
                  <li>Submit your birthday details below.</li>
                  <li>Our café team will contact you on your mobile number to confirm your slot and collect the <strong>₹59 advance</strong> online.</li>
                  <li>Once the advance is received, we will send an official confirmation pass to your email / phone number!</li>
                </ul>
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
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Request</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================= STEP 2: REQUEST SUBMITTED SUCCESS ================= */}
          {step === 2 && (
            <div className="order-success" style={{ padding: '8px 0', textAlign: 'center' }}>
              <div className="success-icon" style={{ fontSize: '3.2rem', marginBottom: 8 }}>🎉🎂</div>
              <div className="success-title" style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.45rem', color: 'var(--green)' }}>
                Birthday Request Submitted!
              </div>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.6, marginTop: 8, fontSize: '0.92rem' }}>
                Thank you, <strong>{name}</strong>! We have received your celebration request for {birthdayPerson ? <strong>{birthdayPerson}&apos;s</strong> : 'your'} birthday with <strong>{guests} people</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>

              {/* What Happens Next Card */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 12, padding: '14px 16px', margin: '14px 0', textAlign: 'left' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span>📞</span>
                  <span>Next Step: We Will Contact You!</span>
                </div>
                <div style={{ fontSize: '0.83rem', color: '#14532d', lineHeight: 1.6 }}>
                  Our café team will reach out to you directly on <strong>+91 {phone}</strong> to confirm your slot, verify special requests, and collect the <strong>₹59 advance</strong> online.
                </div>
                <div style={{ fontSize: '0.83rem', color: '#166534', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #bbf7d0' }}>
                  ✉️ Once your advance is received, we will send an official confirmation to your <strong>{email ? `email (${email}) & phone number` : 'phone number'}</strong>.
                </div>
              </div>

              {/* BYOC Cake Reminder */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '10px 14px', margin: '14px 0', textAlign: 'left' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c2410c' }}>🎂 BRING YOUR OWN CAKE (BYOC)</div>
                <div style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: 2 }}>
                  Please bring your favorite birthday cake with you. We will have the glowing Happy Birthday stand with ambient lights, plates, and cake knife ready.
                </div>
              </div>

              {/* Summary Box */}
              <div className="order-card" style={{ textAlign: 'left', marginTop: 12, padding: '14px 16px', background: 'var(--cream-light)', borderRadius: 12, border: '1px solid var(--cream-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Request Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '0.95rem' }}>
                    #TMC-BDAY-{createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : 'SUBMITTED'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.85rem', margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Birthday Setup Package:</span>
                  <strong>₹199</strong>
                </div>
                <div style={{ fontSize: '0.85rem', margin: '4px 0', display: 'flex', justifyContent: 'space-between', color: '#1d4ed8' }}>
                  <span>Advance (Payable online upon call):</span>
                  <strong>₹59</strong>
                </div>
                <div style={{ fontSize: '0.85rem', margin: '4px 0', display: 'flex', justifyContent: 'space-between', color: '#c2410c', fontWeight: 700 }}>
                  <span>Remaining Setup Balance:</span>
                  <span>₹140 (Payable at cafe)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #cbd5e1' }}>
                  Final Cafe Bill = Food &amp; drinks ordered + ₹140
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <a 
                  href={`https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20I%20have%20submitted%20a%20birthday%20request%20%23TMC-BDAY-${createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '12px', textDecoration: 'none', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  💬 WhatsApp Desk
                </a>
                <button 
                  className="btn-primary" 
                  type="button" 
                  onClick={onClose} 
                  style={{ flex: 1, padding: '12px', fontSize: '0.88rem', fontWeight: 700 }}
                >
                  Done
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
