import { useState } from 'react';
import api from '../services/api';
import useSEO from '../hooks/useSEO';

function Reserve() {
  useSEO({
    title: 'Book a Table',
    description: 'Book a table at The Moras Cafe, B.M. Patil Circle, Vijayapura. Plan your coffee dates, team meetings, birthday celebrations, or study sessions in our cozy environment.'
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !date || !time) {
      setError('Please fill in all required fields.');
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.post('/reservations', {
        name: name.trim(),
        phone: cleanedPhone,
        guests: Number(guests),
        date,
        time,
        notes
      });
      setIsSubmitting(false);
      setSuccess(true);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not submit reservation. Please try again.');
    }
  };
  return (
    <section className="section" id="reserve" style={{ background: 'var(--cream-light)', minHeight: '80vh' }}>
      <div className="section-header">
        <span className="section-label">Book a Table</span>
        <h1 className="section-title">Table <em>Reservations</em></h1>
        <p style={{ maxWidth: 600, margin: '12px auto 0', color: 'var(--text-light)', lineHeight: 1.6 }}>
          Plan your visit to The Moras Cafe. Reserve a cozy corner for studying, meetings, birthday gatherings, or a coffee date at B.M. Patil Circle, Vijayapura.
        </p>
        <div className="section-divider" />
      </div>

      <div className="reservation-page-split" style={{ maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        <div className="reservation-form-container" style={{ margin: 0, width: '100%', maxWidth: 'none' }}>
        {success ? (
          <div className="order-success">
            <div className="success-icon" style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'var(--green)', margin: '10px 0' }}>Request Submitted Successfully!</h3>
            <p style={{ color: 'var(--text-light)', lineHeight: 1.7, maxWidth: 450, margin: '10px auto' }}>
              Thank you, <strong>{name}</strong>! We've received your table request for <strong>{guests} guests</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
            </p>
            <div className="order-card" style={{ textAlign: 'left', marginTop: 24, background: 'var(--cream-light)' }}>
              <div><strong>Status:</strong> Pending Confirmation</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 6 }}>
                A confirmation SMS will be sent to {phone} once our host approves the slot. For immediate updates, please call us.
              </div>
            </div>
            <button 
              className="btn-primary" 
              type="button" 
              onClick={() => {
                setSuccess(false);
                setName('');
                setPhone('');
                setDate('');
                setTime('');
                setNotes('');
              }}
              style={{ marginTop: 20 }}
            >
              Book Another Table
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem' }}>
                ⚠️ {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="page-reserve-name">Full Name *</label>
              <input
                id="page-reserve-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="page-reserve-phone">Mobile Phone Number *</label>
              <input
                id="page-reserve-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 XXXXX XXXXX"
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
                  <option value="7+">7+ People (Large Gathering)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="page-reserve-time">Preferred Time Slot *</label>
                <select
                  id="page-reserve-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                >
                  <option value="">Select Time</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="1:00 PM">1:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                  <option value="7:00 PM">7:00 PM</option>
                  <option value="8:30 PM">8:30 PM</option>
                  <option value="9:30 PM">9:30 PM</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="page-reserve-date">Select Date *</label>
              <input
                id="page-reserve-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="page-reserve-notes">Special Notes / Dietary Requirements (Optional)</label>
              <textarea
                id="page-reserve-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Corner space, low music spot, high chairs, birthday decor setup..."
                rows={3}
              />
            </div>

            <button 
              className="btn-primary" 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                padding: '16px', 
                fontSize: '1rem', 
                marginTop: 8, 
                opacity: isSubmitting ? 0.7 : 1, 
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{
                    width: 18,
                    height: 18,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid #fff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  Processing Reservation...
                </>
              ) : (
                "📅 Confirm Reservation Booking"
              )}
            </button>
          </form>
        )}
      </div>

        {/* Atmosphere Preview Card */}
        <div className="reservation-atmosphere-card" style={{ position: 'relative', background: '#FFFFFF', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--cream-dark)', boxShadow: '0 16px 40px rgba(15,61,62,0.08)' }}>
          {/* Ambient Botanical Brand Watermark Motif */}
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
                <span>✨</span> Zero reservation or cover charges
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
        📢 <strong>Note:</strong> We specify a holding time limit of 15 minutes. Timings: 10:00 AM – 10:30 PM.
      </div>
    </section>
  );
}

export default Reserve;
