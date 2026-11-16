function MobileCartBar({ cartCount, cartTotal, onOpenCart }) {
  if (!cartCount || cartCount <= 0) return null;

  return (
    <aside className="mobile-cart-bar-wrapper" aria-label="Quick cart access">
      <button 
        type="button"
        className="mobile-cart-bar" 
        onClick={onOpenCart}
        aria-label={`View cart with ${cartCount} items totaling ₹${cartTotal}`}
      >
        <div className="mobile-cart-bar-left">
          <div className="mobile-cart-bar-badge">
            <span className="cart-icon" aria-hidden="true">🛒</span>
            <span className="cart-num">{cartCount}</span>
          </div>
          <div className="mobile-cart-bar-details">
            <div className="mobile-cart-bar-count">
              {cartCount} {cartCount === 1 ? 'item' : 'items'} in order
            </div>
            <div className="mobile-cart-bar-price">
              ₹{cartTotal} <span className="tax-tag">Taxes incl.</span>
            </div>
          </div>
        </div>

        <div className="mobile-cart-bar-right">
          <span>View Cart</span>
          <span className="cart-arrow" aria-hidden="true">➔</span>
        </div>
      </button>
    </aside>
  );
}

export default MobileCartBar;
