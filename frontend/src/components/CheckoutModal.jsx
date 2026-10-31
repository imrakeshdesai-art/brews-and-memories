import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from './ToastProvider';

function CheckoutModal({
  open,
  cart,
  total,
  payment,
  setPayment,
  onClose,
  onClearCart,
  activeTable,
  tableSessionExpiry,
  onClearSession,
  unavailableKeys = [],
  isUnavailable,
  onRefreshAvailability,
  onAddToCart,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const idempotencyKeyRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    if (orderSuccess) {
      if (onClearSession) onClearSession();
      navigate('/');
    }
  };

  const handleTrackOrder = () => {
    const trackingToken = orderSuccess?.trackingToken;
    const orderId = orderSuccess?._id;
    onClose();
    if (onClearSession) onClearSession();
    if (orderId && trackingToken) {
      navigate(`/track/${orderId}#token=${trackingToken}`);
    } else if (orderId) {
      navigate(`/track/${orderId}`);
    } else {
      navigate('/');
    }
  };


  useEffect(() => {
    if (!open) {
      setOrderSuccess(null);
      setName('');
      setPhone('');
      setEmail('');
      setIsLoading(false);
      idempotencyKeyRef.current = null;
    } else if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `moras_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
  }, [open]);

  useEffect(() => {
    if (activeTable) {
      setAddress(activeTable);
    } else {
      setAddress('');
    }
  }, [activeTable, open]);

  const summaryItems = useMemo(
    () =>
      cart.map((item) => (
        <div key={item.id} style={{ marginBottom: 8 }}>
          {item.emoji} {item.name} {item.variant ? `(${item.variant === 'S' ? 'Small' : item.variant === 'M' ? 'Medium' : item.variant === 'L' ? 'Large' : item.variant})` : ''} × {item.qty} — ₹{item.price * item.qty}
        </div>
      )),
    [cart]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!activeTable) {
      toast('A table ordering session is required. Please scan a table QR code.');
      return;
    }

    if (tableSessionExpiry && Date.now() > tableSessionExpiry) {
      if (onClearSession) onClearSession();
      alert('Your table ordering session has expired. Please scan the QR code on your table again to continue ordering.');
      onClose();
      return;
    }

    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast('Please complete all required fields (*)');
      return;
    }

    let cleanedPhone = phone.trim().replace(/[-\s()]/g, '');
    if (cleanedPhone.startsWith('+91')) {
      cleanedPhone = cleanedPhone.substring(3);
    } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.startsWith('0') && cleanedPhone.length === 11) {
      cleanedPhone = cleanedPhone.substring(1);
    }
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      toast('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast('Please enter a valid email address format (e.g. customer@gmail.com)');
        return;
      }
    }

    if (cart.length === 0) {
      toast('Your cart is empty');
      return;
    }

    setIsLoading(true);
    try {
      // Revalidate menu availability right before order placement
      try {
        const availRes = await api.get('/menu/availability', {
          headers: { 'Cache-Control': 'no-cache' },
          params: { _t: Date.now() },
        });
        const freshUnavailable = Array.isArray(availRes.data?.unavailableKeys) ? availRes.data.unavailableKeys : [];
        const soldOutInCart = cart.filter((item) => {
          const key = String(item.name || '').trim().toLowerCase();
          return freshUnavailable.includes(key);
        });

        if (soldOutInCart.length > 0) {
          const itemNames = soldOutInCart.map((i) => i.name).join(', ');
          toast(`⚠️ Cannot place order: "${itemNames}" is sold out. Please return to cart and remove it.`);
          if (onRefreshAvailability) onRefreshAvailability();
          setIsLoading(false);
          return;
        }
      } catch (checkErr) {
        console.warn('Live pre-order availability check warning:', checkErr.message);
      }

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `moras_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      }

      const response = await api.post('/orders', {
        name: name.trim(),
        phone: cleanedPhone,
        email: email.trim(),
        address: address.trim(),
        items: cart,
        total,
        payment,
        idempotencyKey: idempotencyKeyRef.current,
      });
      const order = response.data;
      setOrderSuccess(order);
      onClearCart();
      idempotencyKeyRef.current = null;
      toast(`Order ${order._id} created successfully`);
    } catch (error) {
      if (error.response?.data?.code === 'ITEM_UNAVAILABLE') {
        const message = error.response.data.message || 'One or more items in your cart are currently sold out.';
        toast(`⚠️ ${message}`);
        if (onRefreshAvailability) onRefreshAvailability();
      } else {
        const message = error.response?.data?.message || 'Failed to place order';
        toast(message);
      }
    } finally {
      setIsLoading(false);
    }
  };


  if (!open) return null;

  return (
    <div className="modal-backdrop open" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <span>{orderSuccess ? '🎉 Order Confirmed' : '🛍 Place Your Order'}</span>
          <button className="btn-secondary" type="button" onClick={handleClose} aria-label="Close checkout">
            ✕
          </button>
        </div>
        <div className="modal-body">
          {orderSuccess ? (
            <div className="order-success">
              <div className="success-icon">✅</div>
              <div className="success-title">Thank you, {orderSuccess.name}!</div>
              <p style={{ color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 16 }}>
                Your order has been received and sent directly to our kitchen.
              </p>
              <div className="order-card" style={{ marginBottom: 20 }}>
                <div>
                  <strong>Order ID:</strong> {orderSuccess._id}
                </div>
                <div>
                  <strong>Table:</strong> {orderSuccess.address}
                </div>
                <div>
                  <strong>Payment:</strong> {orderSuccess.payment?.toUpperCase()}
                </div>
                <div>
                  <strong>Total:</strong> ₹{orderSuccess.total}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                {orderSuccess.trackingToken ? (
                  <button
                    className="btn-primary"
                    type="button"
                    style={{
                      background: 'linear-gradient(135deg, var(--green) 0%, var(--green-light) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontSize: '1rem',
                      padding: '14px 20px',
                    }}
                    onClick={handleTrackOrder}
                  >
                    <span>📍</span>
                    <span>Track Your Order Live</span>
                  </button>
                ) : (
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.5, margin: '2px 0 6px' }}>
                    A live tracking link may be available in your original order confirmation email.
                  </p>
                )}
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  <span>🧾</span>
                  <span>Print Bill Receipt</span>
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleClose}
                  style={{ width: '100%', padding: '12px' }}
                >
                  Return to Menu
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.82rem', color: '#64748b' }}>
                <span style={{ fontSize: '1.1rem' }}>🔒</span>
                <div>
                  <strong style={{ color: '#334155' }}>Secure 256-bit Connection</strong>
                  <div style={{ fontSize: '0.72rem', marginTop: 1, color: '#94a3b8' }}>Session encrypted & locked to your device</div>
                </div>
              </div>

              {/* Forgot something? Water Upsell */}
              {!cart.some((i) => (i.name || '').toLowerCase().includes('water')) && onAddToCart && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  border: '1.5px dashed #059669',
                  borderRadius: 14,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(5, 150, 105, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.6rem' }}>💧</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.92rem' }}>
                        Forgot something? Water
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: 1 }}>
                        Packaged Drinking Water Bottle &bull; <strong>₹20</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToCart({ name: 'Packaged Drinking Water', price: 20, emoji: '💧' })}
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: 20,
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    + Add (₹20)
                  </button>
                </div>
              )}

              <div className="order-card">
                <div className="order-summary-title">Order Summary</div>
                <div>{summaryItems}</div>
                <div className="order-total-mini" style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total</span>
                  <strong>₹{total}</strong>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="order-name">Your Name *</label>
                <input id="order-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" />
              </div>
              <div className="form-group">
                <label htmlFor="order-phone">Phone Number *</label>
                <input id="order-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 XXXXX XXXXX" />
              </div>
              <div className="form-group">
                <label htmlFor="order-email">Email Address <span style={{color:'#047857',fontWeight:600,fontSize:'0.82em'}}>(Enter to receive official Tax Invoice & Bill Receipt ✉️)</span></label>
                <input id="order-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="yourname@gmail.com" />
              </div>
              <div className="form-group">
                <label htmlFor="order-address">Table Number *</label>
                <input 
                  id="order-address" 
                  value={address} 
                  onChange={(event) => setAddress(event.target.value)} 
                  placeholder="Table Number" 
                  readOnly={!!activeTable}
                  style={activeTable ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#374151', fontWeight: 'bold' } : {}}
                />
                {activeTable && (
                  <span style={{ fontSize: '0.8rem', color: '#047857', marginTop: 4, display: 'inline-block' }}>
                    🟢 Ordering from {activeTable} (Locked)
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-grid">
                  <button
                    type="button"
                    className={`payment-card ${payment === 'counter' ? 'selected' : ''}`}
                    onClick={() => setPayment('counter')}
                  >
                    <span className="icon">💵</span>
                    <div>Pay at Counter</div>
                  </button>
                  <button
                    type="button"
                    className="payment-card"
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  >
                    <span className="icon">📱</span>
                    <div>Pay with UPI (Coming Soon)</div>
                  </button>
                </div>
              </div>
              <button className="btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? 'Placing order…' : '✅ Place Order'}
              </button>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 1.4, marginInline: 'auto', maxWidth: '90%' }}>
                🛡️ <strong>Privacy Disclaimer:</strong> We only collect your name and contact details to fulfill your table order. Your data is encrypted and never shared.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
