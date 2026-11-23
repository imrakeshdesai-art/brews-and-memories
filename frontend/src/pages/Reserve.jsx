import { useState } from 'react';
import api from '../services/api';
import useSEO from '../hooks/useSEO';
import Breadcrumbs from '../components/Breadcrumbs';
import { UPI_CONFIG } from '../config/upi';

function Reserve() {
  useSEO({
    title: 'Host Birthday Events (₹199)',
    description: 'Host your birthday celebration at The Moras Cafe for ₹199. Dedicated illuminated Happy Birthday backdrop with warm ambient lights, table setup, and party seating. Submit request and our team will contact you.'
  });

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

  // Submit birthday reservation request
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

      // Smooth scroll back to form top if on mobile
      const formElem = document.getElementById('reservation-form-anchor');
      if (formElem) formElem.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not submit birthday booking request. Please try again.');
    }
  };

  return (
    <section className="section" style={{ minHeight: '85vh', paddingTop: '100px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto 16px', padding: '0 16px' }}>
        <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Birthday Celebration' }]} />
      </div>
      
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
        
        {/* Left Column: Form & Confirmation */}
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
          
          {/* Header Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, borderBottom: '1px solid var(--cream-dark)', paddingBottom: 16 }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>
                {step === 1 ? 'Birthday Celebration Request' : 'Request Confirmed'}
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: 'var(--green)', margin: '4px 0 0' }}>
                {step === 1 ? 'Host Your Birthday' : '🎉 Request Submitted!'}
              </h2>
            </div>
            <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 800 }}>
              ₹199 Setup Package
            </div>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
              ⚠️ {error}
            </div>
          )}

          {/* ================= STEP 1: BIRTHDAY DETAILS FORM ================= */}
          {step === 1 && (
            <form onSubmit={handleSubmitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
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
                <label htmlFor="page-bday-phone">Mobile Number (We will contact you here) *</label>
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

              {/* Clear Advance & Contact Workflow Note */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', fontSize: '0.86rem', color: '#1e3a8a', lineHeight: 1.55 }}>
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span>📞</span>
                  <span>How Confirmation &amp; Advance Work:</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.83rem', color: '#1e40af' }}>
                  <li>Submit your birthday celebration details below.</li>
                  <li>Our café team will contact you on your mobile number to confirm your slot and collect the <strong>₹59 advance</strong> online.</li>
                  <li>Once the advance is received, we will send an official confirmation pass to your email / phone number!</li>
                </ul>
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
            <div className="order-success" style={{ textAlign: 'center', padding: '10px 0' }}>
              <div className="success-icon" style={{ fontSize: '3.6rem', marginBottom: 14 }}>🎉🎂</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', color: 'var(--green)', margin: '10px 0' }}>
                Birthday Request Submitted!
              </h3>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.7, maxWidth: 460, margin: '10px auto', fontSize: '1rem' }}>
                Thank you, <strong>{name}</strong>! We have received your celebration request for {birthdayPerson ? <strong>{birthdayPerson}&apos;s</strong> : 'your'} birthday celebration for <strong>{guests} people</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>

              {/* What Happens Next Card */}
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14, padding: '16px 18px', margin: '18px auto', maxWidth: 460, textAlign: 'left' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span>📞</span>
                  <span>Next Step: We Will Contact You!</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#14532d', lineHeight: 1.6 }}>
                  Our café team will reach out to you directly on <strong>+91 {phone}</strong> to confirm your slot, verify special requests, and collect the <strong>₹59 advance</strong> online.
                </div>
                <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #bbf7d0' }}>
                  ✉️ Once your advance is received, we will send an official confirmation to your <strong>{email ? `email (${email}) & phone number` : 'phone number'}</strong>.
                </div>
              </div>

              {/* BYOC Cake Reminder */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', margin: '16px auto', maxWidth: 460, textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c2410c' }}>🎂 BRING YOUR OWN CAKE (BYOC)</div>
                <div style={{ fontSize: '0.84rem', color: '#9a3412', marginTop: 3 }}>
                  Please bring your favorite birthday cake with you. We will have the glowing Happy Birthday stand with ambient lights, plates, and cake knife ready.
                </div>
              </div>

              {/* Summary Card */}
              <div className="order-card" style={{ textAlign: 'left', marginTop: 20, padding: '20px', background: 'var(--cream-light)', borderRadius: 14, border: '1px solid var(--cream-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, borderBottom: '1px dashed var(--cream-dark)', paddingBottom: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Request Reference</span>
                  <strong style={{ fontFamily: 'monospace', color: 'var(--green)', fontSize: '1.05rem' }}>
                    #TMC-BDAY-{createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : 'SUBMITTED'}
                  </strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Birthday Setup Package:</span>
                  <strong>₹199</strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0', display: 'flex', justifyContent: 'space-between', color: '#1d4ed8' }}>
                  <span>Advance (Payable online upon call):</span>
                  <strong>₹59</strong>
                </div>
                <div style={{ fontSize: '0.92rem', margin: '6px 0', display: 'flex', justifyContent: 'space-between', color: '#c2410c', fontWeight: 700 }}>
                  <span>Remaining Setup Balance:</span>
                  <span>₹140 (Payable at cafe)</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #cbd5e1' }}>
                  Final Cafe Bill = Food &amp; drinks ordered + ₹140
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <a 
                  href={`https://wa.me/919945446137?text=Hi%20The%20Moras%20Cafe%2C%20I%20have%20submitted%20a%20birthday%20request%20%23TMC-BDAY-${createdBooking?._id ? String(createdBooking._id).slice(-6).toUpperCase() : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px', textDecoration: 'none', textAlign: 'center', fontWeight: 700 }}
                >
                  💬 WhatsApp Desk
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
