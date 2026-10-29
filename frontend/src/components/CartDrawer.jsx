import { Fragment } from 'react';

function CartDrawer({
  open,
  cart,
  total,
  onClose,
  onUpdateQty,
  onRemove,
  onCheckout,
  activeTable,
  unavailableKeys = [],
  isUnavailable,
}) {
  const checkIsSoldOut = (item) => {
    if (!item || !item.name) return false;
    if (typeof isUnavailable === 'function') return isUnavailable(item.name);
    return Array.isArray(unavailableKeys) && unavailableKeys.includes(item.name.trim().toLowerCase());
  };

  const hasSoldOutItems = cart.some(checkIsSoldOut);

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
        {activeTable && (
          <div style={{
            background: 'var(--cream-light)',
            borderBottom: '1px solid var(--cream-dark)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--green)',
            textTransform: 'uppercase',
            letterSpacing: 0.5
          }}>
            <span style={{ color: '#10b981' }}>●</span> Ordering from: {activeTable}
          </div>
        )}
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
            cart.map((item) => {
              const isItemSoldOut = checkIsSoldOut(item);
              return (
                <div key={item.id} className={`cart-item ${isItemSoldOut ? 'cart-item-sold-out' : ''}`}>
                  <div className="cart-item-icon">{item.emoji}</div>
                  <div>
                    <div className="cart-item-name">{item.name}</div>
                    {isItemSoldOut && (
                      <div style={{
                        display: 'inline-block',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        margin: '2px 0 4px',
                      }}>
                        ⚠️ Sold Out — please remove
                      </div>
                    )}
                    {item.variant ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {['Hot', 'Cold'].includes(item.variant) ? 'Option: ' : 'Size: '}{item.variant === 'S' ? 'Small' : item.variant === 'M' ? 'Medium' : item.variant === 'L' ? 'Large' : item.variant}
                      </div>
                    ) : null}
                    <div className="cart-item-price">₹{item.price} each</div>
                    <div className="cart-item-state">
                      <button className="qty-button" type="button" onClick={() => onUpdateQty(item.id, -1)} aria-label={`Decrease quantity of ${item.name}`}>
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        className="qty-button"
                        type="button"
                        onClick={() => onUpdateQty(item.id, 1)}
                        disabled={isItemSoldOut}
                        style={isItemSoldOut ? { opacity: 0.35, cursor: 'not-allowed' } : {}}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                      <button className="btn-secondary" type="button" onClick={() => onRemove(item.id)} style={{ color: 'var(--red)', border: 'none', background: 'transparent' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">₹{item.price * item.qty}</div>
                </div>
              );
            })
          )}
        </div>
        <div className="cart-summary">
          {hasSoldOutItems && (
            <div style={{
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: '0.8rem',
              color: '#9f1239',
              marginBottom: 12,
              lineHeight: 1.4,
              textAlign: 'center',
            }}>
              ⚠️ Please remove sold-out items from your cart before proceeding to checkout.
            </div>
          )}
          <div className="cart-summary-row">
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>
          <button
            className="checkout-button"
            type="button"
            onClick={onCheckout}
            disabled={hasSoldOutItems}
            style={hasSoldOutItems ? { opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(50%)' } : {}}
          >
            {hasSoldOutItems ? 'Remove Sold Out Items' : 'Proceed to Checkout →'}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default CartDrawer;
