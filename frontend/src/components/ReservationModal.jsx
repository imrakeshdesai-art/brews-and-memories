import { useEffect, useState } from 'react';
import api from '../services/api';

function ReservationModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guests, setGuests] = useState('2');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setPhone('');
      setGuests('2');
      setDate('');
      setTime('');
      setNotes('');
      setSuccess(false);
      setError('');
      setIsSubmitting(false);
    }
  }, [open]);

  // Accessibility: Focus trap & Escape key close
  useEffect(() => {
    if (!open) return;

    const previousActiveElement = document.activeElement;
    
    // Slight delay to allow DOM to render before targeting focusable elements
    const timer = setTimeout(() => {
      const modalElement = document.querySelector('.modal-card');
      if (!modalElement) return;

      const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(modalElement.querySelectorAll(focusableElementsString));
      
      if (focusableElements.length === 0) return;

      const firstFocusableElement = focusableElements[0];
      const lastFocusableElement = focusableElements[focusableElements.length - 1];

      firstFocusableElement.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
              lastFocusableElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusableElement) {
              firstFocusableElement.focus();
              e.preventDefault();
            }
          }
        } else if (e.key === 'Escape') {
          onClose();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, 50);

    return () => {
      clearTimeout(timer);
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    };
  }, [open, onClose]);

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

    if (Number(guests) < 1) {
      setError('Number of guests must be at least 1.');
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
      if (window.trackEvent) {
        window.trackEvent('reserve_submit', { guests: guests, date: date, time: time });
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.message || 'Could not submit reservation. Please try again.');
    }
  };

  if (!open) return null;

  return (
    <div className="modal-backdrop open" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <span>📅 Book a Table</span>
          <button className="btn-secondary" type="button" onClick={onClose} aria-label="Close reservation modal">
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ padding: 24 }}>
          {success ? (
            <div className="order-success" style={{ padding: '20px 0' }}>
              <div className="success-icon" style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <div className="success-title">Table Requested!</div>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.6, marginTop: 10 }}>
                Thank you, <strong>{name}</strong>! We have received your booking request for <strong>{guests} guests</strong> on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>
              <div className="order-card" style={{ textAlign: 'left', marginTop: 16 }}>
                <div><strong>Status:</strong> Pending Confirmation</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 4 }}>
                  We will send a confirmation SMS to {phone} within 10-15 minutes.
                </div>
              </div>
              <button className="btn-primary" type="button" onClick={onClose} style={{ marginTop: 16 }}>
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {error && (
                <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem' }}>
                  ⚠️ {error}
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="reserve-name">Your Name *</label>
                <input
                  id="reserve-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reserve-phone">Phone Number *</label>
                <input
                  id="reserve-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="reserve-guests">Guests *</label>
                  <select
                    id="reserve-guests"
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
                  <label htmlFor="reserve-time">Time Slot *</label>
                  <select
                    id="reserve-time"
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
                <label htmlFor="reserve-date">Date *</label>
                <input
                  id="reserve-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reserve-notes">Special Requests (Optional)</label>
                <textarea
                  id="reserve-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Corner table, Birthday celebration, Wheelchair access"
                  rows={2}
                />
              </div>

              <button 
                className="btn-primary" 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  marginTop: 8, 
                  opacity: isSubmitting ? 0.7 : 1, 
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '14px'
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
                  "📅 Submit Reservation Request"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservationModal;
