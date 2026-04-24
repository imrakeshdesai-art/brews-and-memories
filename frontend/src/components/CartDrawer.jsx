import { Fragment } from 'react';

function CartDrawer({ open, cart, total, onClose, onUpdateQty, onRemove, onCheckout }) {
  return (
    <div>
      <div className={`drawer-overlay ${open ? 'open' : ''}`} onClick={onClose} aria-hidden={!open}></div>
      <aside className={`drawer-panel ${open ? 'open' : ''}`} aria-label="Shopping cart">
        <div className="drawer-header">
          <span>🛒 Your Order</span>
          <button className="btn-secondary" type="button" onClick={onClose} aria-label="Close cart">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🛒</div>
              <p>Your cart is empty</p>
              <p style={{ color: 'var(--text-light)', marginTop: 8, fontSize: '0.9rem' }}>
                Add items from the menu to get started.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-icon">{item.emoji}</div>
                <div>
                  <div className="cart-item-name">{item.name}</div>
                  {item.variant ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Size: {item.variant}</div>
                  ) : null}
                  <div className="cart-item-price">₹{item.price} each</div>
                  <div className="cart-item-state">
                    <button className="qty-button" type="button" onClick={() => onUpdateQty(item.id, -1)} aria-label={`Decrease quantity of ${item.name}`}>
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button className="qty-button" type="button" onClick={() => onUpdateQty(item.id, 1)} aria-label={`Increase quantity of ${item.name}`}>
                      +
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => onRemove(item.id)} style={{ color: 'var(--red)', border: 'none', background: 'transparent' }}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-item-total">₹{item.price * item.qty}</div>
              </div>
            ))
          )}
        </div>
        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>
          <button className="checkout-button" type="button" onClick={onCheckout}>
            Proceed to Checkout →
          </button>
        </div>
      </aside>
    </div>
  );
}

export default CartDrawer;
