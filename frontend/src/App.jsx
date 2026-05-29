import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ToastProvider from './components/ToastProvider';
import { loadCart, saveCart } from './services/cart';
import './index.css';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Menu = lazy(() => import('./pages/Menu'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const Reserve = lazy(() => import('./pages/Reserve'));

import Footer from './components/Footer';
import FloatingActions from './components/FloatingActions';
import ReservationModal from './components/ReservationModal';

const defaultCart = [];

function App() {
  const [cart, setCart] = useState(defaultCart);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('counter');
  const location = useLocation();

  useEffect(() => {
    const storedCart = loadCart();
    setCart(storedCart);
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const addToCart = (item) => {
    setCart((current) => {
      const existing = current.find((entry) => entry.name === item.name && entry.variant === item.variant);
      if (existing) {
        return current.map((entry) =>
          entry.name === item.name && entry.variant === item.variant
            ? { ...entry, qty: entry.qty + 1 }
            : entry
        );
      }
      return [...current, { ...item, qty: 1, id: `${item.name}-${item.variant || 'default'}` }];
    });
  };

  const updateCartQty = (id, qty) => {
    setCart((current) =>
      current
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + qty) } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleCheckoutOpen = () => {
    if (cart.length === 0) {
      setIsCartOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
  };

  const pageProps = {
    cart,
    addToCart,
    cartTotal,
    cartCount,
    updateCartQty,
    removeFromCart,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    openCheckout: handleCheckoutOpen,
    closeCheckout: handleCheckoutClose,
    selectedPayment,
    setSelectedPayment,
    clearCart,
    openReserve: () => setIsReserveOpen(true),
  };

  return (
    <ToastProvider>
      <div className="app-shell">
        <NavBar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
        <main className="page-shell">
          <Suspense fallback={<div className="page-loader">Loading page…</div>}>
            <Routes>
              <Route path="/" element={<Home {...pageProps} />} />
              <Route path="/about" element={<About />} />
              <Route path="/menu" element={<Menu {...pageProps} />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/reserve" element={<Reserve />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Home {...pageProps} />} />
            </Routes>
          </Suspense>
        </main>
        <Footer onReserveClick={() => setIsReserveOpen(true)} />
        <FloatingActions />
        <CartDrawer
          open={isCartOpen}
          cart={cart}
          total={cartTotal}
          onClose={() => setIsCartOpen(false)}
          onUpdateQty={updateCartQty}
          onRemove={removeFromCart}
          onCheckout={handleCheckoutOpen}
        />
        <CheckoutModal
          open={isCheckoutOpen}
          cart={cart}
          total={cartTotal}
          payment={selectedPayment}
          setPayment={setSelectedPayment}
          onClose={handleCheckoutClose}
          onClearCart={clearCart}
        />
        <ReservationModal
          open={isReserveOpen}
          onClose={() => setIsReserveOpen(false)}
        />
      </div>
    </ToastProvider>
  );
}

export default App;
