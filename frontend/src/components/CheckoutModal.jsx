import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useToast } from './ToastProvider';

function CheckoutModal({ open, cart, total, payment, setPayment, onClose, onClearCart }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) {
      setOrderSuccess(null);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setIsLoading(false);
    }
  }, [open]);

  const summaryItems = useMemo(
    () =>
      cart.map((item) => (
        <div key={item.id} style={{ marginBottom: 8 }}>
          {item.emoji} {item.name} {item.variant ? `(${item.variant})` : ''} × {item.qty} — ₹{item.price * item.qty}
        </div>
      )),
    [cart]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast('Please complete all fields before placing your order');
      return;
    }
    if (cart.length === 0) {
      toast('Your cart is empty');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/orders', {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        items: cart,
        total,
        payment,
      });
      const order = response.data;
      setOrderSuccess(order);
      onClearCart();
      toast(`Order ${order._id} created successfully`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to place order';
      toast(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
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
              <p style={{ color: 'var(--text-light)', lineHeight: 1.7, marginBottom: 20 }}>
                Your order has been received and is now in the kitchen. Track it from admin dashboard after login.
              </p>
              <div className="order-card">
                <div>
                  <strong>Order ID:</strong> {orderSuccess._id}
                </div>
                <div>
                  <strong>Table:</strong> {orderSuccess.address}
                </div>
                <div>
                  <strong>Payment:</strong> {orderSuccess.payment.toUpperCase()}
                </div>
                <div>
                  <strong>Total:</strong> ₹{orderSuccess.total}
                </div>
              </div>
              <button className="btn-primary" type="button" onClick={handleClose}>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                <label htmlFor="order-email">Email Address <span style={{color:'#aaa',fontWeight:400,fontSize:'0.85em'}}>(optional — for confirmation)</span></label>
                <input id="order-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="yourname@gmail.com" />
              </div>
              <div className="form-group">
                <label htmlFor="order-address">Table Number *</label>
                <input id="order-address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Table Number" />
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutModal;
