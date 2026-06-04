import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
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
const TableOrder = lazy(() => import('./pages/TableOrder'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));

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
  const [activeTable, setActiveTable] = useState(null);
  const [tableSessionExpiry, setTableSessionExpiry] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const storedCart = loadCart();
    setCart(storedCart);
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Load and validate table session on mount
  useEffect(() => {
    const storedTable = localStorage.getItem('activeTable');
    const storedExpiry = localStorage.getItem('tableSessionExpiry');
    
    if (storedTable && storedExpiry) {
      if (Date.now() < Number(storedExpiry)) {
        setActiveTable(storedTable);
        setTableSessionExpiry(Number(storedExpiry));
      } else {
        handleClearSession();
      }
    }
  }, []);

  // Validate session on route change
  useEffect(() => {
    const storedExpiry = localStorage.getItem('tableSessionExpiry');
    if (storedExpiry && Date.now() > Number(storedExpiry)) {
      handleClearSession();
    }
  }, [location.pathname]);

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
    // Prevent adding to cart if session is expired
    if (tableSessionExpiry && Date.now() > tableSessionExpiry) {
      handleClearSession();
      alert('Your table ordering session has expired. Please scan the QR code on your table again to continue ordering.');
      return;
    }
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
    if (tableSessionExpiry && Date.now() > tableSessionExpiry) {
      handleClearSession();
      alert('Your table ordering session has expired. Please scan the QR code on your table again to continue ordering.');
      return;
    }
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
    if (tableSessionExpiry && Date.now() > tableSessionExpiry) {
      handleClearSession();
      alert('Your table ordering session has expired. Please scan the QR code on your table again to continue ordering.');
      return;
    }
    if (cart.length === 0) {
      setIsCartOpen(true);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setIsCheckoutOpen(false);
  };

  const endTableSession = () => {
    const confirmed = window.confirm(
      'Are you sure you want to end your table session? You will need to scan the QR code on your table again to place orders.'
    );
    if (confirmed) {
      handleClearSession();
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem('activeTable');
    localStorage.removeItem('tableSessionExpiry');
    localStorage.removeItem('tableSessionToken');
    setActiveTable(null);
    setTableSessionExpiry(null);
    setCart([]);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
  };

  const handleSessionStart = (tableId, token) => {
    // Clear old cart and checkout states immediately to prevent bleeding data
    setCart([]);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    
    setActiveTable(tableId);
    const expiry = Date.now() + 20 * 60 * 1000; // 20 minutes
    setTableSessionExpiry(expiry);
    
    localStorage.setItem('activeTable', tableId);
    localStorage.setItem('tableSessionExpiry', String(expiry));
    if (token) {
      localStorage.setItem('tableSessionToken', token);
    }
  };

  const handleOpenReserve = useCallback(() => {
    setIsReserveOpen(true);
    if (window.trackEvent) window.trackEvent('reserve_open');
  }, []);

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
    openReserve: handleOpenReserve,
    activeTable,
    tableSessionExpiry,
    endTableSession,
    onClearSession: handleClearSession,
  };

  return (
    <ToastProvider>
      <div className="app-shell">
        <NavBar 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
          activeTable={activeTable} 
          onReserveClick={handleOpenReserve}
        />
        <main className="page-shell">
          <Suspense fallback={<div className="page-loader">Loading page…</div>}>
            <Routes>
              <Route path="/" element={<Home {...pageProps} />} />
              <Route path="/about" element={<About />} />
              <Route path="/menu" element={<Menu {...pageProps} />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/reserve" element={<Reserve />} />
              <Route path="/order" element={<TableOrder />} />
              <Route path="/order/:tableId" element={<TableOrder onSessionStart={handleSessionStart} />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
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
          activeTable={activeTable}
        />
        <CheckoutModal
          open={isCheckoutOpen}
          cart={cart}
          total={cartTotal}
          payment={selectedPayment}
          setPayment={setSelectedPayment}
          onClose={handleCheckoutClose}
          onClearCart={clearCart}
          activeTable={activeTable}
          tableSessionExpiry={tableSessionExpiry}
          onClearSession={handleClearSession}
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
